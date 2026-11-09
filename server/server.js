
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB before accepting requests
    await connectDB();

    app.listen(PORT, () => {
      console.log('\n===============================================================');
      console.log(' ELIMUPLUS BACK-END REST CORE IS ACTIVE');
      console.log(` Secure API Gateway running on: http://localhost:${PORT}`);
      console.log('===============================================================\n');
    });

  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
