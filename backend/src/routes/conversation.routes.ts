import { Router } from 'express';
import { body, param } from 'express-validator';
import * as conversationController from '../controllers/conversation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication to all conversation routes
router.use(authenticate);

// List conversations
router.get('/', conversationController.listConversations);

// Create new conversation
router.post(
  '/',
  [body('title').optional().isString()],
  conversationController.createConversation
);

// Get specific conversation
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid conversation ID')],
  conversationController.getConversation
);

// Delete conversation
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid conversation ID')],
  conversationController.deleteConversation
);

// List nodes in conversation
router.get(
  '/:conversationId/nodes',
  [param('conversationId').isUUID().withMessage('Invalid conversation ID')],
  conversationController.listConversationNodes
);

// Create node (Move Forward)
router.post(
  '/:conversationId/nodes',
  [
    param('conversationId').isUUID().withMessage('Invalid conversation ID'),
    body('parent_node_id').isUUID().withMessage('Invalid parent node ID'),
    body('type').isIn(['mainline', 'sub-topic']).withMessage('Invalid node type'),
    body('content').isString().withMessage('Content is required')
  ],
  conversationController.createNode
);

// Create shark explanation (sub-topic)
router.post(
  '/:conversationId/nodes/:nodeId/sub-topics',
  [
    param('conversationId').isUUID().withMessage('Invalid conversation ID'),
    param('nodeId').isUUID().withMessage('Invalid node ID'),
    body('content').isString().withMessage('Content is required')
  ],
  conversationController.createSharkExplanation
);

// Get specific node
router.get(
  '/:conversationId/nodes/:nodeId',
  [
    param('conversationId').isUUID().withMessage('Invalid conversation ID'),
    param('nodeId').isUUID().withMessage('Invalid node ID')
  ],
  conversationController.getNode
);

// Prompt refine (edit message)
router.put(
  '/:conversationId/nodes/:nodeId/messages/:messageId',
  [
    param('conversationId').isUUID().withMessage('Invalid conversation ID'),
    param('nodeId').isUUID().withMessage('Invalid node ID'),
    param('messageId').isUUID().withMessage('Invalid message ID'),
    body('content').isString().withMessage('Content is required')
  ],
  conversationController.promptRefine
);

// Revert prompt refine
router.post(
  '/:conversationId/nodes/:nodeId/revert',
  [
    param('conversationId').isUUID().withMessage('Invalid conversation ID'),
    param('nodeId').isUUID().withMessage('Invalid node ID')
  ],
  conversationController.revertPromptRefine
);

// Get node summary
router.get(
  '/:conversationId/nodes/:nodeId/summary',
  [
    param('conversationId').isUUID().withMessage('Invalid conversation ID'),
    param('nodeId').isUUID().withMessage('Invalid node ID')
  ],
  conversationController.getNodeSummary
);

// Update user summary
router.put(
  '/:conversationId/nodes/:nodeId/summary',
  [
    param('conversationId').isUUID().withMessage('Invalid conversation ID'),
    param('nodeId').isUUID().withMessage('Invalid node ID'),
    body('user_summary').isString().withMessage('User summary is required')
  ],
  conversationController.updateUserSummary
);

// Fork conversation
router.post(
  '/:conversationId/fork',
  [
    param('conversationId').isUUID().withMessage('Invalid conversation ID'),
    body('start_node_id').isUUID().withMessage('Start node ID is required'),
    body('end_node_id').isUUID().withMessage('End node ID is required'),
    body('title').optional().isString()
  ],
  conversationController.forkConversation
);

export default router;