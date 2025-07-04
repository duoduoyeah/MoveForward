import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';

// Import routes
import authRoutes from './routes/auth.routes';
import conversationRoutes from './routes/conversation.routes';
import userRoutes from './routes/user.routes';
import fileRoutes from './routes/file.routes';
import { errorHandler } from './middleware/error.middleware';

// Load environment variables
config();

// Create Express app
const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Required for cookies
})); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies
app.use(morgan('dev')); // Request logging

// Static files (for file uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/files', fileRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
}); 