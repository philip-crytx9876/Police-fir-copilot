import { Router } from 'express';
import { getSnowflakeDemoData } from '../services/snowflake-service.js';

const router = Router();

router.get('/demo', (_req, res) => {
  res.json(getSnowflakeDemoData());
});

export default router;
