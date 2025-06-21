import { Pinecone } from '@pinecone-database/pinecone';
import 'dotenv/config';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);
