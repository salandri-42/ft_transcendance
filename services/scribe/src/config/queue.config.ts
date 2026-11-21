import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  // Paramètres par défaut des jobs
  defaultJobOptions: {
    attempts: 3,  // 3 tentatives en cas d'échec
    backoff: {
      type: 'exponential',
      delay: 5000,  // 5s, puis 10s, puis 20s
    },
    removeOnComplete: 100,  // Garde les 100 derniers jobs complétés
    removeOnFail: 200,      // Garde les 200 derniers jobs échoués
  },
  // Rate limiting
  limiter: {
    max: 10,      // Max 10 jobs
    duration: 60000,  // par minute
  },
}));