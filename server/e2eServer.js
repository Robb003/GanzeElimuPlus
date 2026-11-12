// ============================================================
// ELIMUPLUS ISOLATED END-TO-END TEST SERVER
// ============================================================

if (process.env.NODE_ENV === 'production') {
  throw new Error('SECURITY ERROR: E2E server cannot run in production.');
}

if (process.env.NODE_ENV !== 'e2e') {
  throw new Error('SECURITY ERROR: NODE_ENV must be e2e.');
}

if (!process.env.JWT_SECRET) {
  throw new Error('SECURITY ERROR: E2E JWT_SECRET is required.');
}

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('./app');

const PORT = Number(process.env.PORT || 5000);

let mongoServer;
let httpServer;

const startE2EServer = async () => {
  try {
    // Start a temporary MongoDB instance for E2E tests only.
    mongoServer = await MongoMemoryServer.create();

    const mongoUri = mongoServer.getUri();

    if (!mongoUri.includes('127.0.0.1')) {
      throw new Error('Refusing to connect to a non-local test database.');
    }

    await mongoose.connect(mongoUri);

    httpServer = app.listen(PORT, () => {
      console.log(`ElimuPlus isolated E2E API running on port ${PORT}`);
      console.log('Connected to temporary MongoDB test database.');
    });
  } catch (error) {
    console.error('E2E server startup failed:', error.message);
    await shutdown();
    process.exit(1);
  }
};

const shutdown = async () => {
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
    httpServer = null;
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});

startE2EServer();
