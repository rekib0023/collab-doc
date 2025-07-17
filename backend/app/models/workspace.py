import uuid

from app.db.base import Base
from sqlalchemy import Column, DateTime, ForeignKey, String, Table, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

# Association table for the many-to-many relationship between users and workspaces
workspace_members = Table(
    "workspace_members",
    Base.metadata,
    Column("workspace_id", String, ForeignKey("workspaces.id", ondelete="CASCADE")),
    Column("user_id", String, ForeignKey("users.id", ondelete="CASCADE")),
    Column("role", String, default="viewer"),  # owner, admin, editor, viewer
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    creator = relationship("User", back_populates="owned_workspaces")
    members = relationship(
        "User", secondary=workspace_members, backref="member_workspaces"
    )
    documents = relationship(
        "Document", back_populates="workspace", cascade="all, delete-orphan"
    )


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String, ForeignKey("workspaces.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    snapshot = Column(
        Text, nullable=True
    )  # JSON string of the document's current state
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    workspace = relationship("Workspace", back_populates="documents")
    creator = relationship("User")
    versions = relationship(
        "DocumentVersion", back_populates="document", cascade="all, delete-orphan"
    )
    operations = relationship(
        "Operation", back_populates="document", cascade="all, delete-orphan"
    )


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"))
    snapshot = Column(
        Text, nullable=False
    )  # JSON string of the document state at this version
    name = Column(String, nullable=True)  # Optional named checkpoint
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    document = relationship("Document", back_populates="versions")
    creator = relationship("User")


class Operation(Base):
    __tablename__ = "operations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"))
    type = Column(String, nullable=False)  # add, update, delete, transform
    target_id = Column(String, nullable=True)  # ID of the object being operated on
    payload = Column(Text, nullable=False)  # JSON string of the operation data
    vector_clock = Column(Text, nullable=False)  # JSON array of the vector clock
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    document = relationship("Document", back_populates="operations")
    creator = relationship("User")
