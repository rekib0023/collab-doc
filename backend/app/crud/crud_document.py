# app/crud/crud_document.py
import json
import uuid
from typing import Any, Dict, List, Optional, Union

from app.crud.base import CRUDBase
from app.models.workspace import Document, DocumentVersion, Operation
from app.schemas import DocumentCreate, DocumentUpdate, OperationCreate
from sqlalchemy import select, asc, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


def _to_json(data: Any) -> str:
    """Safe JSON dumper for snapshots/payloads. Returns '{}' for falsy values except False/0."""
    # Use json.dumps directly but ensure it's a serializable object.
    if data is None:
        return "{}"
    return json.dumps(data)


class CRUDDocument(CRUDBase[Document, DocumentCreate, DocumentUpdate]):
    async def get(self, db: AsyncSession, id: Any) -> Optional[Document]:
        """
        Get a document by id with creator eager-loaded.
        """
        result = await db.execute(
            select(self.model)
            .options(selectinload(self.model.creator))
            .where(self.model.id == id)
        )
        return result.scalars().first()

    async def create_with_owner(
        self,
        db: AsyncSession,
        *,
        obj_in: DocumentCreate,
        owner_id: str,
        commit: bool = False,
    ) -> Document:
        """
        Create a new Document and its initial DocumentVersion.

        By default this will NOT commit the transaction so the caller can make
        multiple DB changes atomically. Set commit=True to commit immediately.
        """
        snapshot = _to_json(obj_in.content)

        db_obj = Document(
            id=str(uuid.uuid4()),
            name=obj_in.name,
            workspace_id=obj_in.workspace_id,
            snapshot=snapshot,
            created_by=owner_id,
        )

        version = DocumentVersion(
            id=str(uuid.uuid4()),
            document_id=db_obj.id,
            snapshot=snapshot,
            name="Initial version",
            created_by=owner_id,
        )

        try:
            db.add_all([db_obj, version])
            # Flush to persist to DB and populate defaults/PKs without committing
            await db.flush()

            if commit:
                await db.commit()

            # Refresh the objects to get DB-default fields (timestamps, etc.)
            await db.refresh(db_obj)
            # Only refresh version if needed by caller later; it's cheap enough here.
            await db.refresh(version)
        except Exception:
            await db.rollback()
            raise

        return db_obj

    async def get_multi_by_workspace(
        self, db: AsyncSession, *, workspace_id: str, skip: int = 0, limit: int = 100
    ) -> List[Document]:
        """
        Return documents in a workspace. Eager-load creators for consistency.
        """
        result = await db.execute(
            select(Document)
            .where(Document.workspace_id == workspace_id)
            .options(selectinload(Document.creator))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_recent_by_user(
        self, db: AsyncSession, *, user_id: str, skip: int = 0, limit: int = 10
    ) -> List[Document]:
        """Get recent documents that the user has access to, across all workspaces."""
        from app.models.workspace import workspace_members

        result = await db.execute(
            select(Document)
            .join(
                workspace_members,
                workspace_members.c.workspace_id == Document.workspace_id,
            )
            .where(workspace_members.c.user_id == user_id)
            .options(selectinload(Document.creator))
            .order_by(desc(Document.updated_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_multi_by_user_access(
        self,
        db: AsyncSession,
        *,
        user_id: str,
        workspace_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Document]:
        """Get documents that the user has access to, optionally filtered by workspace."""
        from app.models.workspace import workspace_members

        query = (
            select(Document)
            .join(
                workspace_members,
                workspace_members.c.workspace_id == Document.workspace_id,
            )
            .where(workspace_members.c.user_id == user_id)
        )

        if workspace_id:
            query = query.where(Document.workspace_id == workspace_id)

        query = (
            query.options(selectinload(Document.creator))
            .order_by(desc(Document.updated_at))
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(query)
        return result.scalars().all()

    async def update_document(
        self,
        db: AsyncSession,
        *,
        db_obj: Document,
        obj_in: Union[DocumentUpdate, Dict[str, Any]],
        user_id: str,
        commit: bool = False,
    ) -> Document:
        """
        Update a Document. If 'content' is present a new DocumentVersion is created.

        By default this will NOT commit so caller can combine multiple updates atomically.
        """
        update_data = (
            obj_in if isinstance(obj_in, dict) else obj_in.dict(exclude_unset=True)
        )

        try:
            if "content" in update_data:
                snapshot = _to_json(update_data["content"])
                update_data["snapshot"] = snapshot
                update_data.pop("content", None)

                version = DocumentVersion(
                    id=str(uuid.uuid4()),
                    document_id=db_obj.id,
                    snapshot=snapshot,
                    created_by=user_id,
                )
                db.add(version)

            # Use the base class update to apply changes to db_obj
            updated = await super().update(db, db_obj=db_obj, obj_in=update_data)

            # Ensure the added version and updates are flushed to DB
            await db.flush()

            if commit:
                await db.commit()

            await db.refresh(updated)
        except Exception:
            await db.rollback()
            raise

        return updated

    async def add_operation(
        self,
        db: AsyncSession,
        *,
        document_id: str,
        operation_in: OperationCreate,
        user_id: str,
        commit: bool = False,
    ) -> Operation:
        """
        Add an Operation (for OT/CRDT operations). Caller can choose to commit.
        """
        op_data = operation_in.dict()
        payload = _to_json(op_data.get("payload"))
        vector_clock = _to_json(op_data.get("vector_clock"))

        db_obj = Operation(
            id=str(uuid.uuid4()),
            document_id=document_id,
            type=op_data["type"],
            target_id=op_data.get("target_id"),
            payload=payload,
            vector_clock=vector_clock,
            created_by=user_id,
        )

        try:
            db.add(db_obj)
            await db.flush()

            if commit:
                await db.commit()

            await db.refresh(db_obj)
        except Exception:
            await db.rollback()
            raise

        return db_obj

    async def get_operations(
        self,
        db: AsyncSession,
        *,
        document_id: str,
        skip: int = 0,
        limit: int = 1000,
        ascending: bool = True,
    ) -> List[Operation]:
        """
        Get operations for a document. Default ordering is ascending by created_at.
        """
        order = asc(Operation.created_at) if ascending else desc(Operation.created_at)
        result = await db.execute(
            select(Operation)
            .where(Operation.document_id == document_id)
            .order_by(order)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_document_versions(
        self,
        db: AsyncSession,
        *,
        document_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[DocumentVersion]:
        result = await db.execute(
            select(DocumentVersion)
            .where(DocumentVersion.document_id == document_id)
            .order_by(desc(DocumentVersion.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create_version(
        self,
        db: AsyncSession,
        *,
        document_id: str,
        snapshot: Dict,
        name: Optional[str],
        user_id: str,
        commit: bool = False,
    ) -> DocumentVersion:
        db_obj = DocumentVersion(
            id=str(uuid.uuid4()),
            document_id=document_id,
            snapshot=_to_json(snapshot),
            name=name,
            created_by=user_id,
        )

        try:
            db.add(db_obj)
            await db.flush()

            if commit:
                await db.commit()

            await db.refresh(db_obj)
        except Exception:
            await db.rollback()
            raise

        return db_obj


# single exported instance for convenience, same as before
document = CRUDDocument(Document)
