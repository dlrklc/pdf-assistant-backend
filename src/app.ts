// src/app.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// routes
import chatRouter from './routes/chat';
import uploadRouter from './routes/upload';
import authRouter from './routes/auth';

app.use('/api/chat', chatRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/auth', authRouter);

export default app;
