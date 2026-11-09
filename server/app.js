
const express = require('express');
const cors = require('cors');

// IMPORT API ROUTER GATEWAYS
const authRoutes = require('./routes/authRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const privacyRoute = require('./routes/privacyRoute');

const app = express();

// GLOBAL MIDDLEWARE
app.use(cors());
app.use(express.json());

// MOUNT API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/privacy', privacyRoute);

// HEALTH CHECK
app.get('/', (req, res) => {
  res.json({
    project: 'Project ElimuPlus API Gateway',
    status: 'Online',
    region: 'Kilifi County, Ganze Sub-County',
    framework: 'NodeJS / Express / CommonJS',
    timestamp: new Date()
  });
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('Unhandled Runtime Exception:', err.stack);

  res.status(500).json({
    message: 'A critical internal server processing error occurred.',
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : {}
  });
});

module.exports = app;
