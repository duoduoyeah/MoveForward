# MoveForward Requirements

## ✅ Functional Requirements

## Conversation Types
- Nornal one, like chatgpt
- Topic one, the main feature

### Conversation Actions
Each `ConversationStateNode` supports:
- **Move Forward** – add next step with auto-summary, with option to question previous parts
- **Prompt Refine** – stash current state for retry/edit
- **Shark Explanation** – fork sub-topic from any message
- **Fork** - use selected node part to generate a new conversation
### Conversation Modes
- Support multiple modes:
  - **Mainline**
  - **Sub-topic** with visual distinction and return reminder
  - **Nested Sub-topic**
  - **Sidebar** (hidden by default, appears on hover with summary nodes)

### Input & Interaction
- The **Enter** key must **not** submit a request.
- Support **next-step actions**:
  - Modify previous prompt
  - Retry response (with cached version shown)
- Allow users to **summarize** conversation manually.(There is also an auto one)
- Support **collapsible main chain** (some parts collapse automatically).
- Auto-close empty sub-branch.
- Auto-collapse the prompt input by user
- Sometimes, some response from the language model, is not proper/not understandable by users, we need to think a method, which is not delete that node, but to somehow ignore it, so that
- auto-detect if the user is start talking a different topic, then move to a new conversation.
### UI Behavior
- Never auto-scroll when messages are returned.
- Allow user to **choose where to attach** follow-up (default: previous node).

---

## ✅ Non-Functional Requirements

### UX & Usability
- Clear visual cues for sub-topic entry/exit.
- Encourage **user-driven summarization**.
- Preserve context when navigating sub-topics.

### System Behavior
- Cache previous responses for revisiting or reuse.
- Maintain state consistency across nested conversations.

### Maintainability
- Actions should be **modular** and **extensible**.
- User-written summaries treated as first-class objects.

