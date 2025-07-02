# Dataflow Actions

## Move Forward

**Process Flow:**
1. User Initiates Move Forward
2. Create New ConversationStateNode
3. Generate System Summary for Current Node
5. Generate Assistant Response
5. Add User Message/ assistant message to New Node

## Prompt Refine
prompt refine works on node
**Process Flow:**
1. User Initiates Prompt Refine
2. Stash Current messages of the node
3. The user will modify the user message
4. Re-generate assistant message
5. Allow to keep the new message, or to restore old one

## Shark Explanation

**Process Flow:**
1. User Initiates Shark Explanation
2. Create Sub-topic Node
6. Provide Return Path to Main Conversation

## Fork

**Process Flow:**
1. User Selects Start Node and End Node for Forking
   - Default: Include all nodes of current conversation tree
   - Optional: User can specify a subset by selecting start and end nodes
2. Extract All Nodes Between Start and End Nodes (inclusive)
3. Create New Conversation with Selected Nodes as Context
4. Initialize New Conversation State
5. Allow User to Continue in the New Conversation Thread
