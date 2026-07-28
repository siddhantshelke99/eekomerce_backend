import { ConnectionOptions } from 'bullmq';
import { env } from './env.js';

export const redisOptions: ConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ for workers
  enableReadyCheck: false,
};
