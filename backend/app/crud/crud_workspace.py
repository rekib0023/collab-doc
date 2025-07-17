import uuid
from typing import List, Optional

from app.crud.base import CRUDBase
from app.models.workspace import Workspace, workspace_members
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload


class CRUDWorkspace(CRUDBase[Workspace, WorkspaceCreate, WorkspaceUpdate]):
    async def create_with_owner(
        self, db: AsyncSession, *, obj_in: WorkspaceCreate, owner_id: str
    ) -> Workspace:
        obj_in_data = obj_in.dict()
        db_obj = Workspace(**obj_in_data, id=str(uuid.uuid4()), created_by=owner_id)
        db.add(db_obj)
        await db.commit()

        # Add owner to workspace_members with 'owner' role
        query = workspace_members.insert().values(
            workspace_id=db_obj.id, user_id=owner_id, role="owner"
        )
        await db.execute(query)
        await db.commit()

        await db.refresh(db_obj)
        return db_obj

    async def get_multi_by_owner(
        self, db: AsyncSession, *, owner_id: str, skip: int = 0, limit: int = 100
    ) -> List[Workspace]:
        result = await db.execute(
            select(Workspace)
            .where(Workspace.created_by == owner_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_multi_by_member(
        self, db: AsyncSession, *, user_id: str, skip: int = 0, limit: int = 100
    ) -> List[Workspace]:
        result = await db.execute(
            select(Workspace)
            .join(workspace_members)
            .where(workspace_members.c.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_workspace_with_members(
        self, db: AsyncSession, *, workspace_id: str
    ) -> Optional[Workspace]:
        result = await db.execute(
            select(Workspace)
            .options(joinedload(Workspace.members))
            .where(Workspace.id == workspace_id)
        )
        return result.scalars().first()

    async def add_member(
        self, db: AsyncSession, *, workspace_id: str, user_id: str, role: str = "viewer"
    ) -> bool:
        query = workspace_members.insert().values(
            workspace_id=workspace_id, user_id=user_id, role=role
        )
        await db.execute(query)
        await db.commit()
        return True

    async def remove_member(
        self, db: AsyncSession, *, workspace_id: str, user_id: str
    ) -> bool:
        query = workspace_members.delete().where(
            workspace_members.c.workspace_id == workspace_id,
            workspace_members.c.user_id == user_id,
        )
        await db.execute(query)
        await db.commit()
        return True

    async def update_member_role(
        self, db: AsyncSession, *, workspace_id: str, user_id: str, role: str
    ) -> bool:
        query = (
            workspace_members.update()
            .where(
                workspace_members.c.workspace_id == workspace_id,
                workspace_members.c.user_id == user_id,
            )
            .values(role=role)
        )
        await db.execute(query)
        await db.commit()
        return True

    async def is_member(
        self, db: AsyncSession, *, workspace_id: str, user_id: str
    ) -> bool:
        query = select(workspace_members).where(
            workspace_members.c.workspace_id == workspace_id,
            workspace_members.c.user_id == user_id,
        )
        result = await db.execute(query)
        return result.first() is not None

    async def get_member_role(
        self, db: AsyncSession, *, workspace_id: str, user_id: str
    ) -> Optional[str]:
        query = select(workspace_members.c.role).where(
            workspace_members.c.workspace_id == workspace_id,
            workspace_members.c.user_id == user_id,
        )
        result = await db.execute(query)
        member = result.first()
        return member[0] if member else None


workspace = CRUDWorkspace(Workspace)
