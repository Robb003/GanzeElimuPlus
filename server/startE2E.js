// Refuse to start E2E services from a production environment.
if (process.env.NODE_ENV === 'production') {
  throw new Error('SECURITY ERROR: E2E startup is forbidden in production.');
}

process.env.NODE_ENV = 'e2e';
process.env.JWT_SECRET = 'elimuplus-e2e-secret-only-not-for-production';
process.env.PORT = '5000';

require('./e2eServer');
