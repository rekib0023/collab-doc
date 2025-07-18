from datetime import datetime
from typing import Any, Dict, List, Optional, TYPE_CHECKING

from pydantic import BaseModel

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


class Workspace(WorkspaceInDB):
    creator: "User"
    members: List["User"] = []


class DocumentBase(BaseModel):
    name: str
    workspace_id: str


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
