import express, { RequestHandler } from 'express';
import multer from 'multer';
import fs from 'fs';
import { processAndEmbedDocument } from '../services/embedder';
import { authenticate } from '../middlewares/authenticate';
import { attachUserContext } from '../services/user-context.service';
import { requirePermission } from '../rbac/guards';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

/**
 * POST /api/upload
 */
router.post(
  '/',
  authenticate as RequestHandler,
  attachUserContext as RequestHandler,
  requirePermission('documents:upload') as RequestHandler,
  upload.single('file'),
  async (req: any, res) => {
  const file = req.file;

  if (!file) {
    return void res.status(400).json({ error: 'File is required' });
  }

  if(file.mimetype != 'application/pdf'){
    return void res.status(415).json({ error: 'Only PDF files are supported.' });
  }

  try {
    await processAndEmbedDocument({
      filePath: file.path,
      userContext: req.userContext,
      tags: [],
    });
    fs.unlinkSync(file.path); // Clean up after upload
    return void res.json({ status: 'Embedded and stored in Pinecone' });
  } catch (err) {
    console.error(err);
    return void res.status(500).json({ error: 'Embedding failed' });
  }
  }
);

/**
 * DELETE /api/upload/:docId
 */
router.delete(
  '/:docId',
  authenticate as RequestHandler,
  attachUserContext as RequestHandler,
  requirePermission('documents:delete') as RequestHandler,
  async (_req, res) => {
    return void res.status(501).json({ error: 'Not implemented yet' });
  }
);

/**
 * POST /api/upload/:docId/reindex
 */
router.post(
  '/:docId/reindex',
  authenticate as RequestHandler,
  attachUserContext as RequestHandler,
  requirePermission('documents:reindex') as RequestHandler,
  async (_req, res) => {
    return void res.status(501).json({ error: 'Not implemented yet' });
  }
);

export default router;
