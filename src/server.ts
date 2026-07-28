import { buildApp } from './app.js';
import { env } from './config/env.js';

async function startServer() {
  const app = await buildApp();

  try {
    const address = await app.listen({
      port: env.PORT,
      host: env.HOST,
    });
    app.log.info(`🚀 Server running in ${env.NODE_ENV} mode at ${address}`);
    if (env.NODE_ENV !== 'production') {
      app.log.info(`📚 OpenAPI Documentation available at ${address}/docs`);
    }
  } catch (err) {
    app.log.error(err as Error);
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}. Shutting down gracefully...`);
    try {
      await app.close();
      app.log.info('Server closed successfully.');
      process.exit(0);
    } catch (err) {
      app.log.error(err as Error, 'Error during graceful shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void startServer();
