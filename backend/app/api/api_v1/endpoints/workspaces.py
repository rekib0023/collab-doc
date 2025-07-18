from typing import Any, List

from app import crud
from app.api.deps import get_current_active_user, get_db
from app.schemas import (
    Document,
    User,
    Workspace,
    WorkspaceAddMember,
    WorkspaceCreate,
    WorkspaceUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("/recent/documents", response_model=List[Document])
async def read_recent_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 10,
) -> Any:
    """
    Retrieve recent documents for the current user across all workspaces.
    """
    return await crud.document.get_recent_by_user(
        db=db, user_id=current_user.id, skip=skip, limit=limit
    )


@router.get("/", response_model=List[Workspace])
async def read_workspaces(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve workspaces for the current user.
    """
    return await crud.workspace.get_multi_by_member(
        db=db, user_id=current_user.id, skip=skip, limit=limit
    )


@router.post("/", response_model=Workspace)
async def create_workspace(
    *,
    db: AsyncSession = Depends(get_db),
    workspace_in: WorkspaceCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create new workspace.
    """
    workspace = await crud.workspace.create_with_owner(
        db=db, obj_in=workspace_in, owner_id=current_user.id
    )
    return workspace


@router.get("/{workspace_id}", response_model=Workspace)
async def read_workspace(
    *,
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get workspace by ID.
    """
    workspace = await crud.workspace.get_workspace_with_members(
        db=db, workspace_id=workspace_id
    )
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    # Check if user is a member of the workspace
    is_member = await crud.workspace.is_member(
        db=db, workspace_id=workspace_id, user_id=current_user.id
    )
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    return workspace


@router.put("/{workspace_id}", response_model=Workspace)
async def update_workspace(
    *,
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    workspace_in: WorkspaceUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update workspace.
    """
    workspace = await crud.workspace.get(db=db, id=workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    # Check if user is an admin or owner
    role = await crud.workspace.get_member_role(
        db=db, workspace_id=workspace_id, user_id=current_user.id
    )
    if role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    workspace = await crud.workspace.update(
        db=db, db_obj=workspace, obj_in=workspace_in
    )
    return workspace


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    *,
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> None:
    """
    Delete workspace.
    """
    workspace = await crud.workspace.get(db=db, id=workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    # Only owner can delete workspace
    role = await crud.workspace.get_member_role(
        db=db, workspace_id=workspace_id, user_id=current_user.id
    )
    if role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    await crud.workspace.remove(db=db, id=workspace_id)


@router.post("/{workspace_id}/members", response_model=Workspace)
async def add_workspace_member(
    *,
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    member_in: WorkspaceAddMember,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Add a member to workspace.
    """
    workspace = await crud.workspace.get(db=db, id=workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    # Check if current user is an admin or owner
    role = await crud.workspace.get_member_role(
        db=db, workspace_id=workspace_id, user_id=current_user.id
    )
    if role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    # Check if user exists
    user = await crud.user.get(db=db, id=member_in.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Add member to workspace
    await crud.workspace.add_member(
        db=db, workspace_id=workspace_id, user_id=member_in.user_id, role=member_in.role
    )

    return await crud.workspace.get_workspace_with_members(
        db=db, workspace_id=workspace_id
    )


@router.delete("/{workspace_id}/members/{user_id}", response_model=Workspace)
async def remove_workspace_member(
    *,
    workspace_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Remove a member from workspace.
    """
    workspace = await crud.workspace.get(db=db, id=workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    # Check if current user is an admin or owner
    current_role = await crud.workspace.get_member_role(
        db=db, workspace_id=workspace_id, user_id=current_user.id
    )
    if current_role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    # Check if target user is a member
    is_member = await crud.workspace.is_member(
        db=db, workspace_id=workspace_id, user_id=user_id
    )
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not a member of this workspace",
        )

    # Check if trying to remove owner
    target_role = await crud.workspace.get_member_role(
        db=db, workspace_id=workspace_id, user_id=user_id
    )
    if target_role == "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot remove workspace owner",
        )

    # If admin trying to remove another admin, deny
    if current_role == "admin" and target_role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins cannot remove other admins",
        )

    await crud.workspace.remove_member(
        db=db, workspace_id=workspace_id, user_id=user_id
    )

    return await crud.workspace.get_workspace_with_members(
        db=db, workspace_id=workspace_id
    )
