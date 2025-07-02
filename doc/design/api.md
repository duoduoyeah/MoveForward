# MoveForward API Specification

## Base URL
`/api/v1`

## Authentication

### Register User
- **Endpoint:** `POST /auth/register`
- **Description:** Register a new user
- **Request Body:**
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "auth_status": "authenticated",
    "role": "user",
    "created_at": "timestamp"
  }
  ```

### Login
- **Endpoint:** `POST /auth/login`
- **Description:** Login with email/password
- **Request Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "token": "jwt_token",
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "user",
      "last_login_at": "timestamp"
    }
  }
  ```

### Anonymous Session
- **Endpoint:** `POST /auth/anonymous`
- **Description:** Create anonymous session
- **Response:** `200 OK`
  ```json
  {
    "token": "jwt_token",
    "user": {
      "id": "uuid",
      "session_id": "uuid",
      "auth_status": "anonymous"
    }
  }
  ```

### Logout
- **Endpoint:** `POST /auth/logout`
- **Description:** Invalidate current session
- **Authentication:** Required
- **Response:** `204 No Content`

## Conversations

### List Conversations
- **Endpoint:** `GET /conversations`
- **Description:** Get all conversations for current user
- **Authentication:** Required
- **Query Parameters:**
  - `page` (optional): Page number
  - `limit` (optional): Items per page
- **Response:** `200 OK`
  ```json
  {
    "total": "number",
    "data": [
      {
        "id": "uuid",
        "title": "string",
        "created_at": "timestamp",
        "last_message_at": "timestamp"
      }
    ]
  }
  ```

### Create Conversation
- **Endpoint:** `POST /conversations`
- **Description:** Create a new conversation
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "title": "string (optional)"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "string",
    "created_at": "timestamp"
  }
  ```

### Get Conversation
- **Endpoint:** `GET /conversations/{id}`
- **Description:** Get a specific conversation
- **Authentication:** Required
- **Response:** `200 OK`
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "string",
    "created_at": "timestamp"
  }
  ```

### Delete Conversation
- **Endpoint:** `DELETE /conversations/{id}`
- **Description:** Soft delete a conversation
- **Authentication:** Required
- **Response:** `204 No Content`

## Conversation State Nodes

### List Conversation Nodes
- **Endpoint:** `GET /conversations/{conversation_id}/nodes`
- **Description:** Get all nodes in a conversation
- **Authentication:** Required
- **Response:** `200 OK`
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "conversation_id": "uuid",
        "parent_node_id": "uuid|null",
        "type": "mainline|sub-topic",
        "summary": "string",
        "created_at": "timestamp",
        "history_count": "number",
        "messages": [
          {
            "id": "uuid",
            "author": "user|assistant",
            "content": "string",
            "sequence_number": "number",
            "created_at": "timestamp"
          }
        ]
      }
    ]
  }
  ```

### Create State Node (Move Forward)
- **Endpoint:** `POST /conversations/{conversation_id}/nodes`
- **Description:** Create a new conversation node (Move Forward action)
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "parent_node_id": "uuid",
    "type": "mainline|sub-topic",
    "content": "string (user message)"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "id": "uuid",
    "conversation_id": "uuid",
    "parent_node_id": "uuid",
    "type": "mainline|sub-topic",
    "summary": "string (auto-generated)",
    "created_at": "timestamp",
    "messages": [
      {
        "id": "uuid",
        "author": "user",
        "content": "string",
        "sequence_number": 1,
        "created_at": "timestamp"
      },
      {
        "id": "uuid",
        "author": "assistant",
        "content": "string",
        "sequence_number": 2,
        "created_at": "timestamp"
      }
    ]
  }
  ```

### Create Shark Explanation
- **Endpoint:** `POST /conversations/{conversation_id}/nodes/{node_id}/sub-topics`
- **Description:** Create a sub-topic node (Shark Explanation action)
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "content": "string (user question)"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "id": "uuid",
    "conversation_id": "uuid",
    "parent_node_id": "uuid",
    "type": "sub-topic",
    "summary": "string (auto-generated)",
    "created_at": "timestamp",
    "messages": [
      {
        "id": "uuid",
        "author": "user",
        "content": "string",
        "sequence_number": 1,
        "created_at": "timestamp"
      },
      {
        "id": "uuid",
        "author": "assistant", 
        "content": "string",
        "sequence_number": 2,
        "created_at": "timestamp"
      }
    ]
  }
  ```

### Get Node
- **Endpoint:** `GET /conversations/{conversation_id}/nodes/{node_id}`
- **Description:** Get a specific node with its messages
- **Authentication:** Required
- **Response:** `200 OK`
  ```json
  {
    "id": "uuid",
    "conversation_id": "uuid",
    "parent_node_id": "uuid|null",
    "type": "mainline|sub-topic",
    "summary": "string",
    "created_at": "timestamp",
    "messages": [
      {
        "id": "uuid",
        "author": "user|assistant",
        "content": "string",
        "sequence_number": "number",
        "created_at": "timestamp"
      }
    ]
  }
  ```

## Messages

### Prompt Refine
- **Endpoint:** `PUT /conversations/{conversation_id}/nodes/{node_id}/messages/{message_id}`
- **Description:** Refine a user message and get new assistant response
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "content": "string (new user message)"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "user_message": {
      "id": "uuid",
      "content": "string",
      "edited_at": "timestamp"
    },
    "assistant_message": {
      "id": "uuid",
      "content": "string",
      "created_at": "timestamp"
    }
  }
  ```

### Revert Prompt Refine
- **Endpoint:** `POST /conversations/{conversation_id}/nodes/{node_id}/revert`
- **Description:** Revert to previous messages after prompt refine
- **Authentication:** Required
- **Response:** `200 OK`
  ```json
  {
    "user_message": {
      "id": "uuid",
      "content": "string",
      "created_at": "timestamp"
    },
    "assistant_message": {
      "id": "uuid",
      "content": "string", 
      "created_at": "timestamp"
    }
  }
  ```

## Summaries

### Get Node Summaries
- **Endpoint:** `GET /conversations/{conversation_id}/nodes/{node_id}/summary`
- **Description:** Get system and user summaries for a node
- **Authentication:** Required
- **Response:** `200 OK`
  ```json
  {
    "id": "uuid",
    "state_node_id": "uuid",
    "system_summary": "string",
    "user_summary": "string|null",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```

### Update User Summary
- **Endpoint:** `PUT /conversations/{conversation_id}/nodes/{node_id}/summary`
- **Description:** Update user summary for a node
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "user_summary": "string"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "id": "uuid",
    "state_node_id": "uuid",
    "system_summary": "string",
    "user_summary": "string",
    "created_at": "timestamp", 
    "updated_at": "timestamp"
  }
  ```

## Files

### Upload File
- **Endpoint:** `POST /files`
- **Description:** Upload a file to attach to a message
- **Authentication:** Required
- **Request Body:** `multipart/form-data`
  - `file`: The file to upload
- **Response:** `201 Created`
  ```json
  {
    "id": "uuid",
    "file_name": "string",
    "file_url": "string",
    "file_type": "string",
    "uploaded_at": "timestamp"
  }
  ```

### Attach File to Message
- **Endpoint:** `POST /conversations/{conversation_id}/nodes/{node_id}/messages/{message_id}/files`
- **Description:** Attach a previously uploaded file to a message
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "file_id": "uuid"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "id": "uuid",
    "message_id": "uuid",
    "file_name": "string",
    "file_url": "string", 
    "file_type": "string",
    "uploaded_at": "timestamp"
  }
  ```

## Fork Conversation

### Create Fork
- **Endpoint:** `POST /conversations/{conversation_id}/fork`
- **Description:** Create a new conversation from selected nodes
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "start_node_id": "uuid",
    "end_node_id": "uuid",
    "title": "string (optional)"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "string",
    "created_at": "timestamp",
    "forked_from": {
      "conversation_id": "uuid",
      "start_node_id": "uuid",
      "end_node_id": "uuid"
    }
  }
  ```

## User Preferences

### Get User Preferences
- **Endpoint:** `GET /user/preferences`
- **Description:** Get current user preferences
- **Authentication:** Required
- **Response:** `200 OK`
  ```json
  {
    "theme": "light|dark|system",
    "auto_scroll": "boolean",
    "collapse_settings": {
      "auto_collapse_prompts": "boolean",
      "auto_collapse_empty_branches": "boolean"
    }
  }
  ```

### Update User Preferences
- **Endpoint:** `PUT /user/preferences`
- **Description:** Update user preferences
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "theme": "light|dark|system",
    "auto_scroll": "boolean",
    "collapse_settings": {
      "auto_collapse_prompts": "boolean",
      "auto_collapse_empty_branches": "boolean"
    }
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "theme": "light|dark|system",
    "auto_scroll": "boolean",
    "collapse_settings": {
      "auto_collapse_prompts": "boolean", 
      "auto_collapse_empty_branches": "boolean"
    }
  }
  ```
