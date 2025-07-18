import json
import uuid
from typing import Any, Dict, List, Optional, Union

from app.crud.base import CRUDBase
from app.models.workspace import Document, DocumentVersion, Operation
from app.schemas import DocumentCreate, DocumentUpdate, OperationCreate
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class CRUDDocument(CRUDBase[Document, DocumentCreate, DocumentUpdate]):
    async def create_with_owner(
        self, db: AsyncSession, *, obj_in: DocumentCreate, owner_id: str
    ) -> Document:
        obj_in_data = obj_in.dict(exclude={"content"})
        snapshot = json.dumps(obj_in.content) if obj_in.content else "{}"

        db_obj = Document(
            id=str(uuid.uuid4()), **obj_in_data, snapshot=snapshot, created_by=owner_id
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)

        # Create initial version
        version = DocumentVersion(
            id=str(uuid.uuid4()),
            document_id=db_obj.id,
            snapshot=snapshot,
            name="Initial version",
            created_by=owner_id,
        )
        db.add(version)
        await db.commit()

        return db_obj

    async def get_multi_by_workspace(
        self, db: AsyncSession, *, workspace_id: str, skip: int = 0, limit: int = 100
    ) -> List[Document]:
        result = await db.execute(
            select(Document)
            .where(Document.workspace_id == workspace_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_recent_by_user(
        self, db: AsyncSession, *, user_id: str, skip: int = 0, limit: int = 10
    ) -> List[Document]:
        """Get recent documents that the user has access to, across all workspaces"""
        from app.models.workspace import WorkspaceMember
        
        # Get all workspaces the user is a member of
        result = await db.execute(
            select(Document)
            .join(WorkspaceMember, WorkspaceMember.workspace_id == Document.workspace_id)
            .where(WorkspaceMember.user_id == user_id)
            .order_by(Document.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
        
    async def update_document(
        self,
        db: AsyncSession,
        *,
        db_obj: Document,
        obj_in: Union[DocumentUpdate, Dict[str, Any]],
        user_id: str,
    ) -> Document:
        update_data = (
            obj_in if isinstance(obj_in, dict) else obj_in.dict(exclude_unset=True)
        )

        if "content" in update_data:
            snapshot = json.dumps(update_data["content"])
            update_data["snapshot"] = snapshot
            del update_data["content"]

            # Create a new version
            version = DocumentVersion(
                id=str(uuid.uuid4()),
                document_id=db_obj.id,
                snapshot=snapshot,
                created_by=user_id,
            )
            db.add(version)

        return await super().update(db, db_obj=db_obj, obj_in=update_data)

    async def add_operation(
        self,
        db: AsyncSession,
        *,
        document_id: str,
        operation_in: OperationCreate,
        user_id: str,
    ) -> Operation:
        op_data = operation_in.dict()
        payload = json.dumps(op_data["payload"])
        vector_clock = json.dumps(op_data["vector_clock"])

        db_obj = Operation(
            id=str(uuid.uuid4()),
            document_id=document_id,
            type=op_data["type"],
            target_id=op_data.get("target_id"),
            payload=payload,
            vector_clock=vector_clock,
            created_by=user_id,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_operations(
        self, db: AsyncSession, *, document_id: str, skip: int = 0, limit: int = 1000
    ) -> List[Operation]:
        result = await db.execute(
            select(Operation)
            .where(Operation.document_id == document_id)
            .order_by(Operation.created_at)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_document_versions(
        self, db: AsyncSession, *, document_id: str, skip: int = 0, limit: int = 100
    ) -> List[DocumentVersion]:
        result = await db.execute(
            select(DocumentVersion)
            .where(DocumentVersion.document_id == document_id)
            .order_by(DocumentVersion.created_at.desc())
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
    ) -> DocumentVersion:
        db_obj = DocumentVersion(
            id=str(uuid.uuid4()),
            document_id=document_id,
            snapshot=json.dumps(snapshot),
            name=name,
            created_by=user_id,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj


document = CRUDDocument(Document)
