# 📘 Entity Relationship Diagram (ERD) – MoveForward (Base Version)

## 🧑‍💼 User
- `id` (PK)
- `name`
- `email` (nullable for non-login users)
- `auth_status`: "authenticated" | "anonymous"
- `session_id` (for anonymous users)
- `last_login_at` (nullable for non-login users)
- `preferences` (JSON - storing UI/theme settings)
- `role`: "user" | "admin" | "moderator"
- `created_at`


🔗 **Relationships**
- Has many `Conversations`

---

## 💬 Conversation
- `id` (PK)
- `user_id` (FK → User)
- `title` (optional)
- `created_at`
- `deleted_at` (nullable, for soft deletion)

🔗 **Relationships**
- Has many `ConversationStateNodes`
- Belongs to `User`

---

## 🧠 ConversationStateNode
Represents a node in the mainline or a sub-topic.

- `id` (PK)
- `conversation_id` (FK → Conversation)
- `parent_node_id` (FK → ConversationStateNode, nullable)
- `type`: "mainline" | "sub-topic"
- `summary`
- `created_at`
- `deleted_at` (nullable, for soft deletion)

🔗 **Relationships**
- Has many `Messages`
- Can have child `ConversationStateNodes` (self-referencing)
- Belongs to `Conversation`

**Constraints**:
- If `type` is "mainline", `parent_node_id` must either be null (for the first node) or reference another "mainline" node
- If `type` is "sub-topic", `parent_node_id` must not be null and must reference either a "mainline" or "sub-topic" node
- If `type` is "mainline", the node must have exactly one user message and one assistant message
- If `type` is "sub-topic", the node can have multiple user and assistant messages

---

## ✉️ Message
- `id` (PK)
- `state_node_id` (FK → ConversationStateNode)
- `author`: "user" | "assistant"
- `content`
- `sequence_number` (to maintain order within a node)
- `created_at`
- `deleted_at` (nullable, for soft deletion)

🔗 **Relationships**
- Belongs to `ConversationStateNode`
- Can have many `FileReferences`

---

## 📎 FileReference
- `id` (PK)
- `message_id` (FK → Message)
- `file_name`
- `file_url`
- `file_type`
- `uploaded_at`

🔗 **Relationships**
- Belongs to `Message`

---

## 📄 Summary
- `id` (PK)
- `state_node_id` (FK → ConversationStateNode)
- `user_summary` (nullable, default null)
- `system_summary` 
- `created_at`
- `updated_at`

---

## 📝 Edit
- `id` (PK)
- `message_id` (FK → Message)
- `previous_content`
- `new_content`
- `edited_at`

---

## 🌐 GraphView(Frontend)
- Virtual/derived structure showing the tree of `ConversationStateNodes` and summaries.

---

## 🔄 Actions (Metadata Layer)
These aren't entities but define **interactions on nodes**:
- `Move Forward` → creates a new `ConversationStateNode` on the mainline
- `Step Back` → stashes node or allows editing
- `Shark Explanation` → creates a new sub-topic node
- `Attach Question` → links new message(s) to a previous message or node

