import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from app import crud
from app.api.deps import get_db
from app.core.config import settings
from app.core.security import ALGORITHM
from app.schemas.workspace import OperationCreate
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.websockets import WebSocketState

logger = logging.getLogger(__name__)
router = APIRouter()

# Store active connections by document_id
active_connections: Dict[str, List[WebSocket]] = {}
# Store user info by connection
connection_users: Dict[WebSocket, Dict[str, Any]] = {}


async def get_token_from_websocket(websocket: WebSocket) -> Optional[str]:
    """Extract token from WebSocket query parameters"""
    token = websocket.query_params.get("token")
    return token


async def get_user_from_token(token: str, db: AsyncSession) -> Optional[Dict[str, Any]]:
    """Validate token and return user info"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None

        user = await crud.user.get(db, id=user_id)
        if user is None:
            return None

        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar": user.avatar,
        }
    except JWTError:
        return None


async def broadcast_to_document(
    document_id: str, message: Dict[str, Any], exclude: WebSocket = None
):
    """Broadcast a message to all clients connected to a document"""
    if document_id in active_connections:
        for connection in active_connections[document_id]:
            if (
                connection != exclude
                and connection.client_state == WebSocketState.CONNECTED
            ):
                await connection.send_json(message)


@router.websocket("/documents/{document_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    document_id: str,
    db: AsyncSession = Depends(get_db),
):
    """WebSocket endpoint for real-time document collaboration"""
    # Authenticate user
    token = await get_token_from_websocket(websocket)
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user = await get_user_from_token(token, db)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Check if document exists and user has permission
    document = await crud.document.get(db, id=document_id)
    if not document:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Check if user is a member of the workspace
    is_member = await crud.workspace.is_member(
        db=db, workspace_id=document.workspace_id, user_id=user["id"]
    )
    if not is_member:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Get user's role in the workspace
    role = await crud.workspace.get_member_role(
        db=db, workspace_id=document.workspace_id, user_id=user["id"]
    )

    # Accept connection
    await websocket.accept()

    # Store connection
    if document_id not in active_connections:
        active_connections[document_id] = []
    active_connections[document_id].append(websocket)

    # Store user info
    user_info = {
        "id": user["id"],
        "name": user["name"],
        "avatar": user["avatar"],
        "role": role,
        "joined_at": datetime.utcnow().isoformat(),
    }
    connection_users[websocket] = user_info

    # Notify others that user has joined
    await broadcast_to_document(
        document_id,
        {
            "type": "user_joined",
            "user": user_info,
            "timestamp": datetime.utcnow().isoformat(),
        },
        exclude=websocket,
    )

    # Send list of active users to the new client
    active_users = []
    if document_id in active_connections:
        for conn in active_connections[document_id]:
            if conn != websocket and conn in connection_users:
                active_users.append(connection_users[conn])

    await websocket.send_json(
        {
            "type": "init",
            "users": active_users,
            "document_id": document_id,
            "timestamp": datetime.utcnow().isoformat(),
        }
    )

    try:
        while True:
            # Receive message from WebSocket
            data = await websocket.receive_json()
            message_type = data.get("type")

            if message_type == "ping":
                # Respond to ping with pong
                await websocket.send_json(
                    {"type": "pong", "timestamp": datetime.utcnow().isoformat()}
                )

            elif message_type == "cursor_update":
                # Broadcast cursor position update
                await broadcast_to_document(
                    document_id,
                    {
                        "type": "cursor_update",
                        "user_id": user["id"],
                        "position": data.get("position", {}),
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    exclude=websocket,
                )

            elif message_type == "operation" and role != "viewer":
                # Process and broadcast operation
                try:
                    operation_data = data.get("operation", {})
                    operation_in = OperationCreate(
                        type=operation_data.get("type"),
                        target_id=operation_data.get("target_id"),
                        payload=operation_data.get("payload", {}),
                        vector_clock=operation_data.get("vector_clock", []),
                    )

                    # Save operation to database
                    operation = await crud.document.add_operation(
                        db=db,
                        document_id=document_id,
                        operation_in=operation_in,
                        user_id=user["id"],
                    )

                    # Broadcast operation to other clients
                    await broadcast_to_document(
                        document_id,
                        {
                            "type": "operation",
                            "operation": {
                                "id": operation.id,
                                "document_id": operation.document_id,
                                "type": operation.type,
                                "target_id": operation.target_id,
                                "payload": json.loads(operation.payload),
                                "vector_clock": json.loads(operation.vector_clock),
                                "created_by": operation.created_by,
                                "created_at": operation.created_at.isoformat(),
                            },
                            "user_id": user["id"],
                            "timestamp": datetime.utcnow().isoformat(),
                        },
                        exclude=websocket,
                    )

                    # Acknowledge operation
                    await websocket.send_json(
                        {
                            "type": "ack",
                            "operation_id": operation.id,
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    )
                except Exception as e:
                    logger.error(f"Error processing operation: {str(e)}")
                    await websocket.send_json(
                        {
                            "type": "error",
                            "message": "Failed to process operation",
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    )

            elif message_type == "chat_message":
                # Broadcast chat message
                message_content = data.get("content", "")
                if message_content:
                    await broadcast_to_document(
                        document_id,
                        {
                            "type": "chat_message",
                            "user_id": user["id"],
                            "user_name": user["name"],
                            "content": message_content,
                            "timestamp": datetime.utcnow().isoformat(),
                        },
                    )

    except WebSocketDisconnect:
        # Remove connection from active connections
        if document_id in active_connections:
            active_connections[document_id].remove(websocket)
            if not active_connections[document_id]:
                del active_connections[document_id]

        # Remove user info
        if websocket in connection_users:
            del connection_users[websocket]

        # Notify others that user has left
        await broadcast_to_document(
            document_id,
            {
                "type": "user_left",
                "user_id": user["id"],
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        if websocket.client_state == WebSocketState.CONNECTED:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
