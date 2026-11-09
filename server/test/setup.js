
if (process.env.NODE_ENV === 'production') {
  throw new Error(
    'SECURITY ERROR: Jest cannot execute in production.'
  );
}

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'elimuplus-jest-test-secret-only';
