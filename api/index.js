// Vercel serverless entry point.
// Vercel auto-detects any file under /api as a serverless function.
// This re-exports the existing Express app (server/index.js) unchanged —
// Vercel's Node runtime calls Express apps directly with (req, res).
import app from '../server/index.js';

export default app;
