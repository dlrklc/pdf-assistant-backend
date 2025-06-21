import express from 'express';
import dotenv from 'dotenv';
import chatRouter from './routes/chat';
import uploadRouter from './routes/upload';
import cors from 'cors';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/chat', chatRouter);
app.use('/api/upload', uploadRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
