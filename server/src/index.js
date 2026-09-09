import mongoose from 'mongoose';
import { createApp } from './app.js';
import { config } from './env.js';

// Connect BEFORE listening. A server that accepts requests it cannot serve
// looks healthy to a platform's health check and fails every real call.
await mongoose.connect(config.mongoUri());
console.log('mongo connected');

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`volta-api listening on :${config.port} (${config.nodeEnv})`);
  if (!config.stripeConfigured) console.warn('STRIPE_SECRET_KEY not set — checkout will return 503');
});

// Render sends SIGTERM on deploy. Finish in-flight requests and close the
// database cleanly rather than dropping them mid-write.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  });
}
