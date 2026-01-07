// src/app.ts
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// routes
import chatRouter from './routes/chat';
import uploadRouter from './routes/upload';
import loginRouter from './routes/login';

app.use('/api/chat', chatRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/login', loginRouter);

export default app;
