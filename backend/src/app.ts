import express from 'express';
import cors from 'cors';
import path from 'path';
import documentRoutes from './routes/document.routes';
import { errorHandler } from './middleware/error.middleware';
import { config } from './config/config';

const app = express();

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically for image previews
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'SUCCESS', message: 'Dock-Ex OCR Backend is healthy.' });
});

// Routes
app.use('/api/documents', documentRoutes);

// Error Handler
app.use(errorHandler);

export default app;
