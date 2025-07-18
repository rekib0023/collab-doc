from datetime import datetime
from typing import Any, Dict, List, Optional, TYPE_CHECKING

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from app.schemas.user import User


class WorkspaceBase(BaseModel):
    name: str
    description: Optional[str] = None


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class WorkspaceMember(BaseModel):
    user_id: str
    role: str = "viewer"  # owner, admin, editor, viewer


class WorkspaceAddMember(BaseModel):
    user_id: str
    role: str = "viewer"


class WorkspaceInDB(WorkspaceBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Simple user model to avoid cyclic references
class UserBasicInfo(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = None

    class Config:
        from_attributes = True


# Full workspace model with potentially cyclic references
class Workspace(WorkspaceInDB):
    creator: "User"
    members: List["User"] = []


# Safe response model to avoid recursion errors
class WorkspaceResponse(WorkspaceInDB):
    creator: UserBasicInfo
    members: List[UserBasicInfo] = Field(default_factory=list)


class DocumentBase(BaseModel):
    name: str
    workspace_id: str


class DocumentCreateRequest(BaseModel):
    name: str
    content: Optional[Dict[str, Any]] = None


class DocumentCreate(DocumentBase):
    content: Optional[Dict[str, Any]] = None


class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[Dict[str, Any]] = None


class DocumentInDB(DocumentBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Document(DocumentInDB):
    creator: "User"


# Safe response model
class DocumentResponse(DocumentInDB):
    creator: UserBasicInfo


class DocumentVersion(BaseModel):
    id: str
    document_id: str
    snapshot: Dict[str, Any]
    name: Optional[str] = None
    created_by: str
    created_at: datetime
    creator: "User"

    class Config:
        from_attributes = True


class Operation(BaseModel):
    id: str
    document_id: str
    type: str  # add, update, delete, transform
    target_id: Optional[str] = None
    payload: Dict[str, Any]
    vector_clock: List[int]
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True


class OperationCreate(BaseModel):
    type: str
    target_id: Optional[str] = None
    payload: Dict[str, Any]
    vector_clock: List[int]
