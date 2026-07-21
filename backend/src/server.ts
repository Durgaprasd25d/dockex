import app from './app';
import { connectDB } from './config/db';
import { config } from './config/config';
import { logger } from './utils/logger';

const startServer = async () => {
  await connectDB();

  const PORT = config.port;
  app.listen(PORT, () => {
    logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
  });
};

startServer();
