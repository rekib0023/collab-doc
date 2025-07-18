from typing import Any, Dict, List

from app import crud
from app.api.deps import get_current_active_user, get_db
from app.schemas import (
    Document,
    DocumentResponse,
    DocumentUpdate,
    DocumentVersion,
    Operation,
    OperationCreate,
    User,
)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


async def check_document_permissions(
    document_id: str,
    db: AsyncSession,
    current_user: User,
    required_roles: List[str] = None,
) -> Document:
    document = await crud.document.get(db=db, id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    role = await crud.workspace.get_member_role(
        db=db, workspace_id=document.workspace_id, user_id=current_user.id
    )

    if required_roles:
        if not role or role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
    elif not role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    return document


@router.get("/", response_model=List[DocumentResponse])
async def read_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve all documents the user has access to.
    """
    return await crud.document.get_multi_by_user_access(
        db=db, user_id=current_user.id, skip=skip, limit=limit
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def read_document(
    *,
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get document by ID.
    """
    return await check_document_permissions(document_id, db, current_user)


@router.patch("/{document_id}", response_model=DocumentResponse)
async def update_document(
    *,
    document_id: str,
    db: AsyncSession = Depends(get_db),
    document_in: DocumentUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update document.
    """
    document = await check_document_permissions(
        document_id, db, current_user, required_roles=["owner", "admin", "editor"]
    )
    return await crud.document.update_document(
        db=db, db_obj=document, obj_in=document_in, user_id=current_user.id
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    *,
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> None:
    """
    Delete document.
    """
    await check_document_permissions(
        document_id, db, current_user, required_roles=["owner", "admin"]
    )
    await crud.document.remove(db=db, id=document_id)


@router.get("/{document_id}/versions", response_model=List[DocumentVersion])
async def read_document_versions(
    *,
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve versions for a document.
    """
    await check_document_permissions(document_id, db, current_user)
    return await crud.document.get_document_versions(
        db=db, document_id=document_id, skip=skip, limit=limit
    )


@router.post("/{document_id}/versions", response_model=DocumentVersion)
async def create_document_version(
    *,
    document_id: str,
    db: AsyncSession = Depends(get_db),
    version_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create a new version for a document.
    """
    await check_document_permissions(
        document_id, db, current_user, required_roles=["owner", "admin", "editor"]
    )
    snapshot = version_data.get("snapshot", {})
    name = version_data.get("name")
    return await crud.document.create_version(
        db=db,
        document_id=document_id,
        snapshot=snapshot,
        name=name,
        user_id=current_user.id,
    )


@router.post("/{document_id}/operations", response_model=Operation)
async def create_operation(
    *,
    document_id: str,
    db: AsyncSession = Depends(get_db),
    operation_in: OperationCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Add a new operation to a document.
    """
    await check_document_permissions(
        document_id, db, current_user, required_roles=["owner", "admin", "editor"]
    )
    return await crud.document.add_operation(
        db=db,
        document_id=document_id,
        operation_in=operation_in,
        user_id=current_user.id,
    )


@router.get("/{document_id}/operations", response_model=List[Operation])
async def read_operations(
    *,
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve operations for a document.
    """
    await check_document_permissions(document_id, db, current_user)
    return await crud.document.get_operations(
        db=db, document_id=document_id, skip=skip, limit=limit
    )
