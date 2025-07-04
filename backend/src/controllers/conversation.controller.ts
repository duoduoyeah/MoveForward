import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { ApiError } from '../middleware/error.middleware';
import { generateLLMResponse } from '../services/llm.service';

/**
 * List all conversations for the current user
 */
export const listConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('User not authenticated', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const conversations = await prisma.conversation.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        stateNodes: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const total = await prisma.conversation.count({
      where: {
        userId,
        deletedAt: null,
      },
    });

    // Format the response
    const formattedConversations = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      created_at: conv.createdAt,
      last_message_at: conv.stateNodes[0]?.createdAt || conv.createdAt,
    }));

    res.status(200).json({
      total,
      data: formattedConversations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new conversation
 */
export const createConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('User not authenticated', 401);
    }

    const { title } = req.body;

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title: title || 'New Conversation',
      },
    });

    res.status(201).json({
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      createdAt: conversation.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific conversation
 */
export const getConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError('User not authenticated', 401);
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!conversation) {
      throw new ApiError('Conversation not found', 404);
    }

    res.status(200).json({
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      createdAt: conversation.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete a conversation
 */
export const deleteConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError('User not authenticated', 401);
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!conversation) {
      throw new ApiError('Conversation not found', 404);
    }

    await prisma.conversation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * List all nodes in a conversation
 */
export const listConversationNodes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError('User not authenticated', 401);
    }

    // Check if conversation exists and belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
        deletedAt: null,
      },
    });

    if (!conversation) {
      throw new ApiError('Conversation not found', 404);
    }

    // Get all nodes with their messages
    const nodes = await prisma.conversationStateNode.findMany({
      where: {
        conversationId,
        deletedAt: null,
      },
      include: {
        messages: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            sequenceNumber: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Format the response
    const formattedNodes = nodes.map((node) => ({
      id: node.id,
      conversation_id: node.conversationId,
      parent_node_id: node.parentNodeId,
      type: node.type,
      summary: node.summary,
      created_at: node.createdAt,
      history_count: node.historyCount,
      messages: node.messages.map((msg) => ({
        id: msg.id,
        author: msg.author,
        content: msg.content,
        sequence_number: msg.sequenceNumber,
        created_at: msg.createdAt,
      })),
    }));

    res.status(200).json({ data: formattedNodes });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new node (Move Forward action)
 */
export const createNode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { conversationId } = req.params;
    const { parent_node_id, type, content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError('User not authenticated', 401);
    }

    // Check if conversation exists and belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
        deletedAt: null,
      },
    });

    if (!conversation) {
      throw new ApiError('Conversation not found', 404);
    }

    // If parent_node_id is provided, check if it exists
    if (parent_node_id) {
      const parentNode = await prisma.conversationStateNode.findUnique({
        where: { id: parent_node_id },
      });

      if (!parentNode) {
        throw new ApiError('Parent node not found', 404);
      }
    }

    // Create a new node
    const node = await prisma.conversationStateNode.create({
      data: {
        conversationId,
        parentNodeId: parent_node_id,
        type,
        historyCount: 1,
      },
    });

    // Create user message
    const userMessage = await prisma.message.create({
      data: {
        stateNodeId: node.id,
        author: 'user',
        content,
        sequenceNumber: 1,
      },
    });

    // Generate AI response (in a real app, call your LLM service)
    const assistantContent = await generateLLMResponse(content);

    // Create assistant message
    const assistantMessage = await prisma.message.create({
      data: {
        stateNodeId: node.id,
        author: 'assistant',
        content: assistantContent,
        sequenceNumber: 2,
      },
    });

    // Generate summary
    const summary = await generateLLMResponse(`Summarize this conversation: User: ${content} Assistant: ${assistantContent}`);

    // Update node with summary
    await prisma.conversationStateNode.update({
      where: { id: node.id },
      data: { summary },
    });

    // Create summary record
    await prisma.summary.create({
      data: {
        stateNodeId: node.id,
        systemSummary: summary,
      },
    });

    res.status(201).json({
      id: node.id,
      conversation_id: node.conversationId,
      parent_node_id: node.parentNodeId,
      type: node.type,
      summary,
      created_at: node.createdAt,
      messages: [
        {
          id: userMessage.id,
          author: userMessage.author,
          content: userMessage.content,
          sequence_number: userMessage.sequenceNumber,
          created_at: userMessage.createdAt,
        },
        {
          id: assistantMessage.id,
          author: assistantMessage.author,
          content: assistantMessage.content,
          sequence_number: assistantMessage.sequenceNumber,
          created_at: assistantMessage.createdAt,
        },
      ],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a sub-topic node (Shark Explanation)
 */
export const createSharkExplanation = async (req: Request, res: Response, next: NextFunction) => {
  // This is similar to createNode but sets the parent_node_id to the specified nodeId
  // and sets the type to 'sub-topic'
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { conversationId, nodeId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError('User not authenticated', 401);
    }

    // Implement the Shark Explanation logic - similar to createNode but with fixed parent and type
    // (Implementation would be similar to createNode)
    
    // Placeholder response
    res.status(501).json({ message: 'Feature not implemented yet' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific node with its messages
 */
export const getNode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId, nodeId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError('User not authenticated', 401);
    }

    // Check if conversation exists and belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
        deletedAt: null,
      },
    });

    if (!conversation) {
      throw new ApiError('Conversation not found', 404);
    }

    // Get the node with its messages
    const node = await prisma.conversationStateNode.findFirst({
      where: {
        id: nodeId,
        conversationId,
        deletedAt: null,
      },
      include: {
        messages: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            sequenceNumber: 'asc',
          },
        },
      },
    });

    if (!node) {
      throw new ApiError('Node not found', 404);
    }

    // Format the response
    const formattedNode = {
      id: node.id,
      conversation_id: node.conversationId,
      parent_node_id: node.parentNodeId,
      type: node.type,
      summary: node.summary,
      created_at: node.createdAt,
      messages: node.messages.map((msg) => ({
        id: msg.id,
        author: msg.author,
        content: msg.content,
        sequence_number: msg.sequenceNumber,
        created_at: msg.createdAt,
      })),
    };

    res.status(200).json(formattedNode);
  } catch (error) {
    next(error);
  }
};

/**
 * Refine a user message and get new assistant response
 */
export const promptRefine = async (req: Request, res: Response, next: NextFunction) => {
  // Placeholder for prompt refine implementation
  res.status(501).json({ message: 'Feature not implemented yet' });
};

/**
 * Revert to previous messages after prompt refine
 */
export const revertPromptRefine = async (req: Request, res: Response, next: NextFunction) => {
  // Placeholder for revert prompt refine implementation
  res.status(501).json({ message: 'Feature not implemented yet' });
};

/**
 * Get system and user summaries for a node
 */
export const getNodeSummary = async (req: Request, res: Response, next: NextFunction) => {
  // Placeholder for getting node summary implementation
  res.status(501).json({ message: 'Feature not implemented yet' });
};

/**
 * Update user summary for a node
 */
export const updateUserSummary = async (req: Request, res: Response, next: NextFunction) => {
  // Placeholder for updating user summary implementation
  res.status(501).json({ message: 'Feature not implemented yet' });
};

/**
 * Create a new conversation from selected nodes
 */
export const forkConversation = async (req: Request, res: Response, next: NextFunction) => {
  // Placeholder for fork conversation implementation
  res.status(501).json({ message: 'Feature not implemented yet' });
};