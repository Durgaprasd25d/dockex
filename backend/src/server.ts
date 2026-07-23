import app from './app';
import { connectDB } from './config/db';
import { config } from './config/config';
import { logger } from './utils/logger';

// Connect to DB immediately
connectDB();

if (process.env.VERCEL !== '1') {
  const PORT = config.port;
  app.listen(PORT, () => {
    logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
  });
}

export default app;
