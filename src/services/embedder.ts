import '../env';

import fs from 'fs';

import { pineconeIndex } from './pinecone';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone';
import type { Role, UserContext } from './user.service';

export interface EmbedDocumentOptions {
  filePath: string;
  userContext: UserContext;
  //Optional document tags
  tags?: string[];
  //Optional explicit allow-lists
  allowedRoles?: Role[];
  allowedUsers?: string[];
}

export async function processAndEmbedDocument(options: EmbedDocumentOptions) {
  const { filePath, userContext, tags = [], allowedRoles, allowedUsers } = options;

  if (!userContext?.workspaceId || !userContext?.userId) {
    throw new Error('Missing user context (fail closed)');
  }

  let dataBuffer: Buffer;
  try {
    dataBuffer = fs.readFileSync(filePath);
  } catch (error) {
    throw new Error(`Failed to read file: ${error}`);
  }

  let rawText: string;

  // Lazy import
  const pdfParse = (await import('pdf-parse')).default;
  const pdf = await pdfParse(dataBuffer);
  rawText = pdf.text;

  const chunks = chunkText(rawText);

  const embedder = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    model: 'text-embedding-004',
  });

  const embeddings = await embedder.embedDocuments(chunks);

  const upserts = [];

  for (let i = 0; i < embeddings.length; i++) {
    let embeddingPerChunk = [];
    for (let j = 0; j < embeddings[0].length; j++) {
      embeddingPerChunk.push(embeddings[i][j]);
    }
    upserts.push({
          id: `doc-${uuidv4()}`,
          values: embeddingPerChunk,
          text: chunks[i],
    })
  }

  const vectors: PineconeRecord<RecordMetadata>[] = upserts.map(
    (chunk) => ({
        id: chunk.id,
        values: chunk.values,
        metadata: {
          text: chunk.text,
          // RBAC metadata 
          workspace_id: userContext.workspaceId,
          owner_id: userContext.userId,
          allowed_roles: allowedRoles ?? userContext.roles,
          allowed_users: allowedUsers ?? [userContext.userId],
          tags,
        },
    })
    );

  const BATCH_SIZE = 50;
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE);
    try {
      await pineconeIndex.upsert(batch);
    } catch (error) {
      console.error('Pinecone upsert error:', error);
      throw error;
    }
  }
}

function chunkText(input: string, chunkSize: number = 500): string[] {
  const chunks: string[] = [];

  let start = 0;
  while (start < input.length) {
    const end = start + chunkSize;

    // Try to end chunk at the nearest sentence boundary before chunkSize
    let chunk = input.slice(start, end);

    const lastPeriod = chunk.lastIndexOf('.');
    if (lastPeriod !== -1 && end < input.length) {
      chunk = chunk.slice(0, lastPeriod + 1);
      start += lastPeriod + 1;
    } else {
      start += chunk.length;
    }

    chunks.push(chunk.trim());
  }

  return chunks;
}
