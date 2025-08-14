const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const vehicleRoutes = require('./routes/vehicles');
const analyticsRoutes = require('./routes/analytics');
const { router: dataRoutes } = require('./routes/data');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/data', dataRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Vehicle Analytics Dashboard API is running' });
});

// Serve static files in production only if they exist
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  const indexPath = path.join(clientBuildPath, 'index.html');
  
  // Check if client build files exist
  if (require('fs').existsSync(indexPath)) {
    app.use(express.static(clientBuildPath));
    
    app.get('*', (req, res) => {
      res.sendFile(indexPath);
    });
  } else {
    // Backend-only deployment - serve API info at root
    app.get('/', (req, res) => {
      res.json({
        message: 'Vehicle Analytics Dashboard API',
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          vehicles: '/api/vehicles',
          analytics: '/api/analytics',
          data: '/api/data'
        },
        documentation: 'This is a backend-only deployment. Frontend should be deployed separately.'
      });
    });
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
