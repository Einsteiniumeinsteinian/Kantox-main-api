require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createPrometheusMetrics } = require('./metrics');
const bucketRoutes = require('./routes/bucket.route')
const parameterRoutes = require('./routes/parameter.route')
const healthRoute = require('./routes/health.route')

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_VERSION = process.env.SERVICE_VERSION || '1.0.0';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.use('/api/health', healthRoute);
app.use('/api/s3/buckets', bucketRoutes );
app.use('/api/parameters', parameterRoutes);

// Prometheus metrics
const { register, httpRequestDuration, httpRequestsTotal } = createPrometheusMetrics();

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();
 
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe(
      { method: req.method, route: req.route?.path || req.path, status_code: res.statusCode },
      duration
    );
    httpRequestsTotal.inc({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
  });
 
  next();
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    versions: {
      'main-api': SERVICE_VERSION,
      'auxiliary-service': 'unknown'
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    versions: {
      'main-api': SERVICE_VERSION,
      'auxiliary-service': 'unknown'
    },
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Main API service running on port ${PORT}`);
});