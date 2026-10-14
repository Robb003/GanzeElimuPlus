const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

//  IMPORT API ROUTER GATEWAYS
const authRoutes = require('./routes/authRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// INIT DATABASE C
// Connects safely to MongoDB cluster instance configured via your .env file
connectDB();

//  GLOBAL ENTERPRISE SECURITY MIDDLEWARE
app.use(cors()); 
app.use(express.json()); // Automatically intercepts and parses incoming JSON payload bundles

//  MOUNT API ROUTE 
app.use('/api/auth', authRoutes);               // Manages login, profiles, and phone identifiers
app.use('/api/applications', applicationRoutes); // Handles secure form submissions and blind clerk screening
app.use('/api/admin', adminRoutes);             // Commands executive budget loops and bulk batch bank disbursements

//  HEALTH CHECK & SYSTEM DIAGNOSTICS ROUTE
app.get('/', (req, res) => {
  res.json({ 
    project: "Project ElimuPlus API Gateway",
    status: "Online",
    region: "Kilifi County, Ganze Sub-County",
    framework: "NodeJS / Express / CommonJS",
    timestamp: new Date()
  });
});

//  GLOBAL RUNTIME CRASH PROTECTION MIDDLEWARE
app.use((err, req, res, next) => {
  console.error(" Unhandled Runtime Exception Intercepted:", err.stack);
  res.status(500).json({ 
    message: "A critical internal server processing error occurred. Access vector dropped safely.",
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// LAUNCH WEB SERVER EVENT LOOP
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n===============================================================`);
  console.log(` ELIMUPLUS BACK-END REST CORE RECONCILIATION ENGINE IS ACTIVE`);
  console.log(` Secure API Gateway running in Dev Mode on: http://localhost:${PORT}`);
  console.log(`===============================================================\n`);
});
