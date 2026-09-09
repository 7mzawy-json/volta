// Development server with a throwaway in-process MongoDB.
//
// Explicitly separate from src/index.js rather than a fallback inside it: a
// production server that silently starts its own empty database when
// MONGODB_URI is missing would look healthy while losing every write. This has
// to be asked for by name.
//
//   npm run dev:memory     — no Docker, no Atlas, data gone on exit
//   npm run dev            — the real thing, needs MONGODB_URI

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri();
process.env.JWT_SECRET ||= 'dev-only-secret-not-for-production';
process.env.NODE_ENV ||= 'development';

await mongoose.connect(process.env.MONGODB_URI);

const { createApp } = await import('./app.js');
const { config } = await import('./env.js');

const app = createApp();
app.listen(config.port, () => {
  console.log(`volta-api (in-memory mongo) on :${config.port}`);
  console.log('   data lives only as long as this process');
  if (!config.stripeConfigured) console.log('   STRIPE_SECRET_KEY unset — checkout returns 503');
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, async () => {
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
  });
}
