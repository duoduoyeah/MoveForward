import { config } from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a response from the LLM
 * @param prompt The user's prompt
 * @returns The generated response
 */
export const generateLLMResponse = async (prompt: string): Promise<string> => {
  try {
    // Default response in case API call fails
    const defaultResponse = "I'm sorry, I couldn't process that request.";
    
    // For development/testing without an API key
    if (!process.env.OPENAI_API_KEY) {
      console.warn('No OPENAI_API_KEY found. Using mock response.');
      if (prompt.includes('Summarize')) {
        return 'This is a summary of the conversation.';
      }
      return 'This is a mock response for development purposes.';
    }

    // Use OpenAI API
    const model = process.env.OPENAI_MODEL || 'gpt-4o';
    
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || defaultResponse;
    return response;
  } catch (error) {
    console.error('Error calling LLM API:', error);
    return "I'm sorry, there was an error processing your request.";
  }
};

/**
 * Generates a summary for a conversation
 * @param messages Array of messages to summarize
 * @returns The generated summary
 */
export const generateSummary = async (messages: { author: string; content: string }[]): Promise<string> => {
  try {
    // Format messages for the prompt
    const formattedMessages = messages
      .map((msg) => `${msg.author.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
    
    const prompt = `Please provide a concise summary (max 3 sentences) of the following conversation:\n\n${formattedMessages}`;
    
    return await generateLLMResponse(prompt);
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Error generating summary.';
  }
};