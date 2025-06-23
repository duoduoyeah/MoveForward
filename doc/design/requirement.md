# MoveForward Requirements

## ✅ Functional Requirements

### Conversation Actions
Each `ConversationStateNode` supports:
- **Move Forward** – add next step with auto-summary
- **Step Back** – stash current state for retry/edit
- **Shark Explanation** – fork sub-topic from any message
- **Question on Previous** – attach multiple follow-up questions

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

