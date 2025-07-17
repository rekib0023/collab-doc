from typing import Any, Dict, List

from app import crud
from app.api.deps import get_current_active_user, get_db
from app.schemas.user import User
from app.schemas.workspace import (
    Document,
    DocumentCreate,
    DocumentUpdate,
    DocumentVersion,
    Operation,
    OperationCreate,
)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("/workspaces/{workspace_id}/documents", response_model=List[Document])
async def read_documents(
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve documents for a workspace.
    """
    # Check if user is a member of the workspace
    is_member = await crud.workspace.is_member(
        db=db, workspace_id=workspace_id, user_id=current_user.id
    )
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    return await crud.document.get_multi_by_workspace(
        db=db, workspace_id=workspace_id, skip=skip, limit=limit
    )


@router.post("/workspaces/{workspace_id}/documents", response_model=Document)
async def create_document(
    *,
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    document_in: DocumentCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create new document in a workspace.
    """
    # Check if user is a member of the workspace with appropriate permissions
    role = await crud.workspace.get_member_role(
        db=db, workspace_id=workspace_id, user_id=current_user.id
    )
    if not role or role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    # Ensure workspace_id is set correctly
    document_data = DocumentCreate(
        name=document_in.name, workspace_id=workspace_id, content=document_in.content
    )

    document = await crud.document.create_with_owner(
        db=db, obj_in=document_data, owner_id=current_user.id
    )
    return document


@router.get(
    "/workspaces/{workspace_id}/documents/{document_id}", response_model=Document
)
async def read_document(
    *,
    workspace_id: str,
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get document by ID.
    """
    # Check if user is a member of the workspace
    is_member = await crud.workspace.is_member(
        db=db, workspace_id=workspace_id, user_id=current_user.id
    )
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    document = await crud.document.get(db=db, id=document_id)
    if not document or document.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    return document


@router.put(
    "/workspaces/{workspace_id}/documents/{document_id}", response_model=Document
)
async def update_document(
    *,
    workspace_id: str,
    document_id: str,
    db: AsyncSession = Depends(get_db),
    document_in: DocumentUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update document.
    """
    # Check if user has edit permissions in workspace
    role = await crud.workspace.get_member_role(
        db=db, workspace_id=workspace_id, user_id=current_user.id
    )
    if not role or role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    document = await crud.document.get(db=db, id=document_id)
    if not document or document.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    document = await crud.document.update_document(
        db=db, db_obj=document, obj_in=document_in, user_id=current_user.id
    )
    return document


@router.delete(
    "/workspaces/{workspace_id}/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_document(
    *,
    workspace_id: str,
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> None:
    """
    Delete document.
    """
    # Check if user has admin/owner permissions in workspace
    role = await crud.workspace.get_member_role(
        db=db, workspace_id=workspace_id, user_id=current_user.id
    )
    if not role or role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    document = await crud.document.get(db=db, id=document_id)
    if not document or document.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    await crud.document.remove(db=db, id=document_id)


@router.get(
    "/workspaces/{workspace_id}/documents/{document_id}/versions",
    response_model=List[DocumentVersion],
)
async def read_document_versions(
    *,
    workspace_id: str,
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve versions for a document.
    """
    # Check if user is a member of the workspace
    is_member = await crud.workspace.is_member(
        db=db, workspace_id=workspace_id, user_id=current_user.id
    )
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    document = await crud.document.get(db=db, id=document_id)
    if not document or document.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    return await crud.document.get_document_versions(
        db=db, document_id=document_id, skip=skip, limit=limit
    )


@router.post(
    "/workspaces/{workspace_id}/documents/{document_id}/versions",
    response_model=DocumentVersion,
)
async def create_document_version(
    *,
    workspace_id: str,
    document_id: str,
    db: AsyncSession = Depends(get_db),
    version_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create a new version for a document.
    """
    # Check if user has edit permissions in workspace
    role = await crud.workspace.get_member_role(
        db=db, workspace_id=workspace_id, user_id=current_user.id
    )
    if not role or role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    document = await crud.document.get(db=db, id=document_id)
    if not document or document.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    snapshot = version_data.get("snapshot", {})
    name = version_data.get("name")

    version = await crud.document.create_version(
        db=db,
        document_id=document_id,
        snapshot=snapshot,
        name=name,
        user_id=current_user.id,
    )
    return version


@router.post(
    "/workspaces/{workspace_id}/documents/{document_id}/operations",
    response_model=Operation,
)
async def create_operation(
    *,
    workspace_id: str,
    document_id: str,
    db: AsyncSession = Depends(get_db),
    operation_in: OperationCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Add a new operation to a document.
    """
    # Check if user has edit permissions in workspace
    role = await crud.workspace.get_member_role(
        db=db, workspace_id=workspace_id, user_id=current_user.id
    )
    if not role or role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    document = await crud.document.get(db=db, id=document_id)
    if not document or document.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    operation = await crud.document.add_operation(
        db=db,
        document_id=document_id,
        operation_in=operation_in,
        user_id=current_user.id,
    )
    return operation


@router.get(
    "/workspaces/{workspace_id}/documents/{document_id}/operations",
    response_model=List[Operation],
)
async def read_operations(
    *,
    workspace_id: str,
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 1000,
) -> Any:
    """
    Retrieve operations for a document.
    """
    # Check if user is a member of the workspace
    is_member = await crud.workspace.is_member(
        db=db, workspace_id=workspace_id, user_id=current_user.id
    )
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    document = await crud.document.get(db=db, id=document_id)
    if not document or document.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    return await crud.document.get_operations(
        db=db, document_id=document_id, skip=skip, limit=limit
    )
