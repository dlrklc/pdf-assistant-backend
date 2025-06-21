# PDF Q&A Assistant Backend

This is the backend for PDF Q&A Assistant. It processes user queries, retrieves relevant context from a Pinecone vector database, and generates responses using Google Gemini models.

## Features

- **Document Embedding**: Upload PDF documents to generate embeddings and store them in Pinecone for retrieval.
- **Contextual Question Answering**: Retrieve relevant context from Pinecone and use Gemini models to answer user queries.
- **REST API**: Exposes endpoints for chat and document upload.

## What makes it different
-	Google Gemini API instead of OpenAI (less common, more challenging)
-	Few-shot prompting to guide LLM’s responses for better consistency
-	Built in TypeScript

## Prerequisites

- Node.js (v16 or higher)
- TypeScript
- Pinecone account and API key
- Google Gemini API key

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/dlrklc/pdf-assistant-backend.git
   cd pdf-assistant-backend
2. Install dependencies:
   
   ```bash
   npm install
4. Create a .env file in the root directory and configure the following variables:
   
   ```bash
   GOOGLE_API_KEY=your_openai_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX=your_pinecone_index_name
   PORT=5000
6. Build the project
   
   ```bash
   npm run build

## Usage
Start the server:

```bash
npm start
```
The server will run on the port specified in the .env file (default: 5000).

## Dependencies
Express: Web framework for building RESTful APIs.

LangChain: Framework for building applications with large language models (LLMs).

Google Gemini: Used for generating text embeddings and responses.

Pinecone: Vector database for storing and querying text embeddings.

Multer: Middleware for handling multipart/form-data (file uploads).

pdf-parse: Utility for extracting text content from PDF files.

