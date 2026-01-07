import express, { RequestHandler } from 'express';
import multer from 'multer';
import fs from 'fs';
import { processAndEmbedDocument } from '../services/embedder';
import { authenticate } from '../middlewares/authenticate';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/', authenticate as RequestHandler, upload.single('file'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return void res.status(400).json({ error: 'File is required' });
  }

  if(file.mimetype != 'application/pdf'){
    return void res.status(415).json({ error: 'Only PDF files are supported.' });
  }

  try {
    await processAndEmbedDocument(file.path);
    fs.unlinkSync(file.path); // Clean up after upload
    return void res.json({ status: 'Embedded and stored in Pinecone' });
  } catch (err) {
    console.error(err);
    return void res.status(500).json({ error: 'Embedding failed' });
  }
});

export default router;
