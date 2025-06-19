# Main API Service - Node.js Gateway

A Node.js API Gateway service that acts as a proxy and orchestrator for AWS operations, communicating with the auxiliary service to provide unified access to S3 buckets and Systems Manager Parameter Store. This service provides a clean REST API interface with built-in monitoring, health checks, and service versioning.

## Features

- **API Gateway Pattern**: Centralized entry point for AWS operations
- **Service Orchestration**: Coordinates with auxiliary service for AWS operations
- **Version Tracking**: Tracks and reports versions of both main and auxiliary services
- **Health Monitoring**: Comprehensive health checks with dependency validation
- **Prometheus Metrics**: Built-in metrics for monitoring and observability
- **Error Handling**: Robust error handling with detailed error responses
- **Request Tracing**: Request ID generation for distributed tracing
- **Production-ready**: Security headers, CORS, rate limiting, and graceful shutdown

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               Main API Service                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │   Health Routes     │  │   Bucket Routes     │  │  Parameter Routes       │  │
│  │                     │  │                     │  │                         │  │
│  │ • GET /api/health   │  │ • GET /api/s3/      │  │ • GET /api/parameters/  │  │
│  │ • GET /health/ready │  │   buckets           │  │   list                  │  │
│  │                     │  │                     │  │ • GET /api/parameters   │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────────┘  │
│           │                         │                          │                │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                         Controllers Layer                                  │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────────┐  │  │
│  │  │ Health          │ │ Bucket          │ │ Parameter                   │  │  │
│  │  │ Controller      │ │ Controller      │ │ Controller                  │  │  │
│  │  │                 │ │                 │ │                             │  │  │
│  │  │ • checkReadiness│ │ • listBuckets   │ │ • listParameters            │  │  │
│  │  │                 │ │                 │ │ • getParameterValue         │  │  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                      Service Communication Layer                           │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                         Utils Module                               │  │  │
│  │  │  • callAuxiliaryService()    • getAuxiliaryServiceVersion()       │  │  │
│  │  │  • generateRequestId()       • HTTP client with timeout           │  │  │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                      Monitoring & Metrics                                  │  │
│  │  ┌─────────────────┐                           ┌─────────────────────────┐  │  │
│  │  │ Prometheus      │                           │ Request Tracking        │  │  │
│  │  │ Metrics         │                           │                         │  │  │
│  │  │ • HTTP duration │                           │ • Request IDs           │  │  │
│  │  │ • Request count │                           │ • Response times        │  │  │
│  │  │ • Status codes  │                           │ • Error tracking        │  │  │
│  │  └─────────────────┘                           └─────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTP Calls
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Auxiliary Service                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         AWS Operations                                  │  │
│  │  • S3 Bucket Operations        • Parameter Store Operations            │  │
│  │  • Health Checks               • Version Information                   │  │
│  │  • Direct AWS SDK Integration  • Prometheus Metrics                    │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Core Service Endpoints

#### Health Check

```http
GET /api/health
```

**Response:**

```json
"OK"
```

#### Readiness Check

```http
GET /api/health/ready
```

**Successful Response:**

```json
{
  "status": "ready",
  "timestamp": "2023-12-01T12:00:00.000Z",
  "versions": {
    "main-api": "1.0.0",
    "auxiliary-service": "1.0.0"
  },
  "service": "main-api"
}
```

**Failed Response:**

```json
{
  "status": "not ready",
  "error": "Auxiliary service not available",
  "timestamp": "2023-12-01T12:00:00.000Z",
  "versions": {
    "main-api": "1.0.0",
    "auxiliary-service": "unknown"
  },
  "service": "main-api"
}
```

#### Prometheus Metrics

```http
GET /metrics
```

**Response:**

```
# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1",method="GET",route="/api/s3/buckets",status_code="200",app="main-api"} 1
http_request_duration_seconds_bucket{le="0.3",method="GET",route="/api/s3/buckets",status_code="200",app="main-api"} 1
...
```

### AWS Proxy Operations

#### List S3 Buckets

```http
GET /api/s3/buckets
```

**Response:**

```json
{
  "success": true,
  "data": {
    "success": true,
    "data": [
      {
        "name": "my-application-bucket",
        "creationDate": "2023-01-15T10:30:00.000Z"
      },
      {
        "name": "my-backup-bucket",
        "creationDate": "2023-02-20T14:45:00.000Z"
      }
    ],
    "count": 2,
    "timestamp": "2023-12-01T12:00:00.000Z"
  },
  "versions": {
    "main-api": "1.0.0",
    "auxiliary-service": "1.0.0"
  },
  "timestamp": "2023-12-01T12:00:00.000Z"
}
```

#### List Parameters

```http
GET /api/parameters/list
```

**Response:**

```json
{
  "success": true,
  "data": {
    "success": true,
    "data": [
      {
        "name": "/myproject/database/host",
        "type": "String",
        "value": "db.example.com",
        "version": 1,
        "lastModifiedDate": "2023-11-15T09:30:00.000Z"
      }
    ],
    "count": 1,
    "timestamp": "2023-12-01T12:00:00.000Z"
  },
  "versions": {
    "main-api": "1.0.0",
    "auxiliary-service": "1.0.0"
  },
  "timestamp": "2023-12-01T12:00:00.000Z"
}
```

#### Get Specific Parameter

```http
GET /api/parameters?name=database/host
```

**Response:**

```json
{
  "success": true,
  "data": {
    "success": true,
    "data": {
      "name": "/myproject/database/host",
      "value": "db.example.com",
      "type": "String",
      "version": 1,
      "lastModifiedDate": "2023-11-15T09:30:00.000Z",
      "dataType": "text"
    },
    "timestamp": "2023-12-01T12:00:00.000Z"
  },
  "versions": {
    "main-api": "1.0.0",
    "auxiliary-service": "1.0.0"
  },
  "timestamp": "2023-12-01T12:00:00.000Z"
}
```

## Code Structure

### Express Application (`index.js`)

```javascript
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

// Routes
app.use('/api/health', healthRoute);
app.use('/api/s3/buckets', bucketRoutes);
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
```

### Routes

#### Bucket Route (`routes/bucket.route.js`)

```javascript
const express = require('express')
const { listBuckets } = require('../controllers/bucket.controller')
const router = express.Router()

router.get('/', listBuckets)

module.exports = router
```

#### Parameter Route (`routes/parameter.route.js`)

```javascript
const express = require('express')
const { getParameterValue, listParameters } = require('../controllers/parameter.controller')
const router = express.Router({ mergeParams: true })

router.get('/', getParameterValue)
router.get('/list', listParameters)

module.exports = router
```

#### Health Route (`routes/health.route.js`)

```javascript
const express = require('express');
const { checkReadiness } = require('../controllers/health.controller');
const router = express.Router()

router.get('/', (req, res) => res.send('OK'));
router.get('/ready', checkReadiness)

module.exports = router
```

### Controllers

#### Bucket Controller (`controllers/bucket.controller.js`)

```javascript
const { getAuxiliaryServiceVersion, callAuxiliaryService } = require("../utils");

async function listBuckets(req, res) {
  try {
    const auxiliaryVersion = await getAuxiliaryServiceVersion();
    const buckets = await callAuxiliaryService('/aws/s3/buckets');
   
    res.json({
      success: true,
      data: buckets,
      versions: {
        'main-api': process.env.SERVICE_VERSION,
        'auxiliary-service': auxiliaryVersion
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      versions: {
        'main-api': process.env.SERVICE_VERSION,
        'auxiliary-service': await getAuxiliaryServiceVersion()
      },
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = { listBuckets };
```

#### Parameter Controller (`controllers/parameter.controller.js`)

```javascript
const { getAuxiliaryServiceVersion, callAuxiliaryService } = require("../utils");

async function listParameters(req, res) {
  try {
    const auxiliaryVersion = await getAuxiliaryServiceVersion();
    const parameters = await callAuxiliaryService('/aws/parameters/list');
   
    res.json({
      success: true,
      data: parameters,
      versions: {
        'main-api': process.env.SERVICE_VERSION,
        'auxiliary-service': auxiliaryVersion
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      versions: {
        'main-api': process.env.SERVICE_VERSION,
        'auxiliary-service': await getAuxiliaryServiceVersion()
      },
      timestamp: new Date().toISOString()
    });
  }
}

async function getParameterValue(req, res) {
  try {
    const parameterName = req.query.name;
    const auxiliaryVersion = await getAuxiliaryServiceVersion();
    const parameter = await callAuxiliaryService(`/aws/parameters?name=${parameterName}`);
   
    res.json({
      success: true,
      data: parameter,
      versions: {
        'main-api': process.env.SERVICE_VERSION,
        'auxiliary-service': auxiliaryVersion
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      versions: {
        'main-api': process.env.SERVICE_VERSION,
        'auxiliary-service': await getAuxiliaryServiceVersion()
      },
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = { listParameters, getParameterValue };
```

#### Health Controller (`controllers/health.controller.js`)

```javascript
const { default: axios } = require("axios");
const { getAuxiliaryServiceVersion } = require("../utils");

async function checkReadiness(req, res) {
  try {
    // Check if auxiliary service is reachable
    await axios.get(`${process.env.AUXILIARY_SERVICE_URL}/health`, { timeout: 5000 });
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      versions: {
        'main-api': process.env.SERVICE_VERSION,
        'auxiliary-service': await getAuxiliaryServiceVersion()
      },
      service: 'main-api'
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: 'Auxiliary service not available',
      timestamp: new Date().toISOString(),
      versions: {
        'main-api': process.env.SERVICE_VERSION,
        'auxiliary-service': await getAuxiliaryServiceVersion()
      },
      service: 'main-api'
    });
  }
}

module.exports = { checkReadiness };
```

### Utilities

#### Service Communication Utils (`utils/index.js`)

```javascript
const { default: axios } = require("axios");
const AUXILIARY_SERVICE_URL = process.env.AUXILIARY_SERVICE_URL || 'http://localhost:3001'

// Utility function to call auxiliary service
async function callAuxiliaryService(endpoint) {
  try {
    const response = await axios.get(`${AUXILIARY_SERVICE_URL}${endpoint}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'main-api/1.0.0',
        'X-Request-ID': generateRequestId()
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error calling auxiliary service ${endpoint}:`, error.message);
    throw new Error(`Auxiliary service error: ${error.message}`);
  }
}

// Utility function to generate request ID
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Utility function to get auxiliary service version
async function getAuxiliaryServiceVersion() {
  try {
    const response = await callAuxiliaryService('/version');
    return response.version || 'unknown';
  } catch (error) {
    console.error('Failed to get auxiliary service version:', error.message);
    return 'unknown';
  }
}

module.exports = { callAuxiliaryService, getAuxiliaryServiceVersion };
```

#### Prometheus Metrics (`metrics/index.js`)

```javascript
const client = require('prom-client');

function createPrometheusMetrics() {
  // Create a Registry to register the metrics
  const register = new client.Registry();

  // Add a default label which is added to all metrics
  register.setDefaultLabels({
    app: 'main-api'
  });

  // Enable the collection of default metrics
  client.collectDefaultMetrics({ register });

  // Create custom metrics
  const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  });

  const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  });

  // Register custom metrics
  register.registerMetric(httpRequestDuration);
  register.registerMetric(httpRequestsTotal);

  return {
    register,
    httpRequestDuration,
    httpRequestsTotal
  };
}

module.exports = { createPrometheusMetrics };
```

## Environment Variables

### Required Environment Variables

| Variable | Description | Type | Default |
|----------|-------------|------|---------|
| `SERVICE_VERSION` | Main API service version | `string` | `1.0.0` |
| `AUXILIARY_SERVICE_URL` | Auxiliary service endpoint URL | `string` | `http://localhost:3001` |
| `PORT` | Port for the service to listen on | `number` | `3000` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node.js environment | `production` |
| `LOG_LEVEL` | Logging level | `info` |

## Project Structure

```
main-api/
├── controllers/
│   ├── bucket.controller.js        # S3 bucket proxy operations
│   ├── parameter.controller.js     # Parameter Store proxy operations
│   └── health.controller.js        # Health check operations
├── routes/
│   ├── bucket.route.js             # S3 bucket routes
│   ├── parameter.route.js          # Parameter Store routes
│   └── health.route.js             # Health check routes
├── utils/
│   └── index.js                    # Service communication utilities
├── metrics/
│   └── index.js                    # Prometheus metrics setup
├── index.js                        # Main application entry point
├── package.json                    # Node.js dependencies
├── Dockerfile                      # Container configuration
├── .dockerignore                   # Docker build exclusions
├── .env.example                    # Environment variable template
└── README.md                       # This file
```

## Docker Configuration

### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

FROM node:18-alpine AS runtime

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy application files
COPY --chown=nodejs:nodejs . .
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
```

### .dockerignore

```dockerignore
# Dependencies
node_modules/
npm-debug.log*

# Environment files
.env
.env.local
.env.*.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Git
.git/
.gitignore

# Documentation
README.md
docs/

# Testing
test/
coverage/
*.test.js
*.spec.js

# Build artifacts
dist/
build/

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Docker
Dockerfile*
docker-compose*
.dockerignore
```

## Package.json Configuration

```json
{
  "name": "main-api",
  "version": "1.0.0",
  "description": "Main API Gateway service for AWS operations",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "docker:build": "docker build -t main-api .",
    "docker:run": "docker run -p 3000:3000 --env-file .env main-api"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "morgan": "^1.10.0",
    "prom-client": "^15.0.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "eslint": "^8.54.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": [
    "api-gateway",
    "microservices",
    "nodejs",
    "express",
    "aws",
    "kubernetes"
  ]
}
```

## Kubernetes Deployment

### Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: main-api
  namespace: production
  labels:
    app: main-api
    version: v1.0.0
spec:
  replicas: 3
  selector:
    matchLabels:
      app: main-api
  template:
    metadata:
      labels:
        app: main-api
        version: v1.0.0
    spec:
      containers:
      - name: main-api
        image: your-ecr-repo/main-api:1.0.0
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: SERVICE_VERSION
          value: "1.0.0"
        - name: AUXILIARY_SERVICE_URL
          value: "http://auxiliary-service:80"
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
```

### Service Manifest

```yaml
apiVersion: v1
kind: Service
metadata:
  name: main-api
  namespace: production
  labels:
    app: main-api
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: main-api
```

### Ingress Manifest

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: main-api-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: "alb"
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: "arn:aws:acm:us-west-2:123456789012:certificate/your-certificate-arn"
    alb.ingress.kubernetes.io/ssl-redirect: "443"
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: main-api
            port:
              number: 80
```

## Service Communication

### HTTP Client Configuration

The main API service communicates with the auxiliary service using HTTP:

```javascript
// Service discovery and communication
const AUXILIARY_SERVICE_URL = process.env.AUXILIARY_SERVICE_URL || 'http://localhost:3001';

// HTTP client with timeout and headers
const response = await axios.get(`${AUXILIARY_SERVICE_URL}${endpoint}`, {
  timeout: 10000,
  headers: {
    'User-Agent': 'main-api/1.0.0',
    'X-Request-ID': generateRequestId()
  }
});
```

### Request Tracing

Each request includes a unique request ID for distributed tracing:

```javascript
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
```

### Service Discovery

In Kubernetes, services are discovered using DNS:

```bash
# Service URL format
http://auxiliary-service.production.svc.cluster.local:80

# Simplified format (same namespace)
http://auxiliary-service:80
```

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error description",
  "versions": {
    "main-api": "1.0.0",
    "auxiliary-service": "1.0.0"
  },
  "timestamp": "2023-12-01T12:00:00.000Z"
}
```

### HTTP Status Codes

| Status Code | Description | Usage |
|-------------|-------------|-------|
| 200 | Success | Successful operations |
| 404 | Not Found | Parameter not found, endpoint not found |
| 500 | Internal Server Error | Service errors, auxiliary service unavailable |
| 503 | Service Unavailable | Health check failures, dependency unavailable |

### Error Propagation

The service handles errors from the auxiliary service and provides meaningful responses:

```javascript
// Error handling in controllers
try {
  const result = await callAuxiliaryService('/aws/s3/buckets');
  // Success response
} catch (error) {
  // Determine status code based on error type
  const statusCode = error.message.includes('not found') ? 404 : 500;
  
  res.status(statusCode).json({
    success: false,
    error: error.message,
    versions: {
      'main-api': process.env.SERVICE_VERSION,
      'auxiliary-service': await getAuxiliaryServiceVersion()
    },
    timestamp: new Date().toISOString()
  });
}
```

## Monitoring and Observability

### Prometheus Metrics

The service exposes custom metrics for monitoring:

```javascript
// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

// HTTP request counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});
```

### Available Metrics

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `http_request_duration_seconds` | Histogram | HTTP request duration | method, route, status_code |
| `http_requests_total` | Counter | Total HTTP requests | method, route, status_code |
| `nodejs_heap_size_total_bytes` | Gauge | Node.js heap size | - |
| `nodejs_heap_size_used_bytes` | Gauge | Node.js heap usage | - |
| `process_cpu_user_seconds_total` | Counter | CPU usage | - |

### Health Check Integration

Health checks validate both the main service and its dependencies:

```javascript
async function checkReadiness(req, res) {
  try {
    // Test auxiliary service connectivity
    await axios.get(`${process.env.AUXILIARY_SERVICE_URL}/health`, { 
      timeout: 5000 
    });
    
    // Return ready status with service versions
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      versions: {
        'main-api': process.env.SERVICE_VERSION,
        'auxiliary-service': await getAuxiliaryServiceVersion()
      },
      service: 'main-api'
    });
  } catch (error) {
    // Return not ready status
    res.status(503).json({
      status: 'not ready',
      error: 'Auxiliary service not available',
      // ... error response
    });
  }
}
```

## Development Setup

### Local Development

```bash
# Clone repository
git clone https://github.com/your-org/main-api.git
cd main-api

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env

# Start auxiliary service first (in another terminal)
cd ../auxiliary-service
npm run dev

# Start main API development server
npm run dev
```

### Environment File (.env.example)

```bash
# Service Configuration
SERVICE_VERSION=1.0.0
PORT=3000
NODE_ENV=development

# Service Dependencies
AUXILIARY_SERVICE_URL=http://localhost:3001

# Logging
LOG_LEVEL=debug
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Test Examples

```javascript
// Example test for bucket controller
const request = require('supertest');
const app = require('../index');

describe('Bucket Controller', () => {
  test('should list buckets successfully', async () => {
    const response = await request(app)
      .get('/api/s3/buckets')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.versions).toHaveProperty('main-api');
    expect(response.body.versions).toHaveProperty('auxiliary-service');
  });
  
  test('should handle auxiliary service errors', async () => {
    // Mock auxiliary service failure
    const response = await request(app)
      .get('/api/s3/buckets')
      .expect(500);
    
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Auxiliary service error');
  });
});
```

## Docker Build and Deployment

### Build Commands

```bash
# Build the Docker image
docker build -t main-api:1.0.0 .

# Build with build arguments
docker build --build-arg NODE_ENV=production -t main-api:1.0.0 .

# Build and tag for ECR
docker build -t 123456789012.dkr.ecr.us-west-2.amazonaws.com/myproject/main-api:1.0.0 .
```

### Run Commands

```bash
# Run locally with environment file
docker run -p 3000:3000 --env-file .env main-api:1.0.0

# Run with individual environment variables
docker run -p 3000:3000 \
  -e SERVICE_VERSION=1.0.0 \
  -e AUXILIARY_SERVICE_URL=http://auxiliary-service:3001 \
  main-api:1.0.0

# Run with auxiliary service in Docker network
docker network create microservices
docker run -d --name auxiliary-service --network microservices auxiliary-service:1.0.0
docker run -p 3000:3000 --network microservices \
  -e AUXILIARY_SERVICE_URL=http://auxiliary-service:3001 \
  main-api:1.0.0
```

### ECR Deployment

```bash
# Login to ECR
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-west-2.amazonaws.com

# Tag for ECR
docker tag main-api:1.0.0 \
  123456789012.dkr.ecr.us-west-2.amazonaws.com/myproject/main-api:1.0.0

# Push to ECR
docker push 123456789012.dkr.ecr.us-west-2.amazonaws.com/myproject/main-api:1.0.0
```

## Multi-Service Architecture

### Service Communication Flow

```
┌─────────────────┐    HTTP Request    ┌─────────────────┐
│                 │ ──────────────────> │                 │
│   Client/User   │                     │   Main API      │
│                 │ <────────────────── │   Service       │
└─────────────────┘    HTTP Response   └─────────────────┘
                                                │
                                                │ HTTP Request
                                                │ (Internal)
                                                ▼
                                        ┌─────────────────┐
                                        │                 │
                                        │   Auxiliary     │
                                        │   Service       │
                                        │                 │
                                        └─────────────────┘
                                                │
                                                │ AWS API Calls
                                                ▼
                                        ┌─────────────────┐
                                        │                 │
                                        │  AWS Services   │
                                        │  (S3, SSM)      │
                                        │                 │
                                        └─────────────────┘
```

### Deployment Strategy

#### Docker Compose (Development)

```yaml
version: '3.8'
services:
  main-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - SERVICE_VERSION=1.0.0
      - AUXILIARY_SERVICE_URL=http://auxiliary-service:3001
      - NODE_ENV=development
    depends_on:
      - auxiliary-service
    
  auxiliary-service:
    build: ../auxiliary-service
    ports:
      - "3001:3001"
    environment:
      - SERVICE_VERSION=1.0.0
      - AWS_REGION=us-west-2
      - PROJECT_NAME=myproject
      - NODE_ENV=development
```

#### Kubernetes (Production)

```yaml
# Complete application deployment
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: microservices-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'https://github.com/your-org/microservices-manifests'
    targetRevision: HEAD
    path: production
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Security Considerations

### Security Headers

```javascript
// Helmet configuration for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Input Validation

```javascript
const { body, query, validationResult } = require('express-validator');

// Parameter name validation
const validateParameterName = [
  query('name')
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9/_-]+$/)
    .withMessage('Invalid parameter name format'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
        versions: {
          'main-api': process.env.SERVICE_VERSION,
          'auxiliary-service': 'unknown'
        },
        timestamp: new Date().toISOString()
      });
    }
    next();
  }
];

// Apply validation to routes
router.get('/', validateParameterName, getParameterValue);
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP',
    versions: {
      'main-api': process.env.SERVICE_VERSION,
      'auxiliary-service': 'unknown'
    },
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
```

## Performance Optimization

### HTTP Client Optimization

```javascript
// Configure axios with connection pooling
const axios = require('axios');
const http = require('http');
const https = require('https');

const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
});

// Use agents in axios calls
const response = await axios.get(url, {
  httpAgent,
  httpsAgent,
  timeout: 10000
});
```

### Response Caching

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

async function getAuxiliaryServiceVersion() {
  const cacheKey = 'auxiliary-service-version';
  const cachedVersion = cache.get(cacheKey);
  
  if (cachedVersion) {
    return cachedVersion;
  }
  
  try {
    const response = await callAuxiliaryService('/version');
    const version = response.version || 'unknown';
    cache.set(cacheKey, version);
    return version;
  } catch (error) {
    console.error('Failed to get auxiliary service version:', error.message);
    return 'unknown';
  }
}
```

### Memory Usage Optimization

```javascript
// Garbage collection monitoring
if (process.env.NODE_ENV === 'production') {
  const v8 = require('v8');
  
  setInterval(() => {
    const heapStats = v8.getHeapStatistics();
    console.log('Heap used:', heapStats.used_heap_size / 1024 / 1024, 'MB');
    console.log('Heap total:', heapStats.total_heap_size / 1024 / 1024, 'MB');
  }, 60000); // Log every minute
}
```

## Troubleshooting

### Common Issues

1. **Auxiliary Service Connection Failed**

   ```bash
   # Check auxiliary service status
   kubectl get pods -l app=auxiliary-service
   
   # Check service DNS resolution
   kubectl exec -it main-api-pod -- nslookup auxiliary-service
   
   # Test service connectivity
   kubectl exec -it main-api-pod -- curl http://auxiliary-service/health
   ```

2. **Version Information Not Available**

   ```bash
   # Check auxiliary service version endpoint
   curl http://auxiliary-service:3001/version
   
   # Check main API logs
   kubectl logs deployment/main-api
   ```

3. **Health Check Failures**

   ```bash
   # Check readiness probe
   kubectl describe pod main-api-pod
   
   # Test health endpoints manually
   kubectl port-forward pod/main-api-pod 3000:3000
   curl http://localhost:3000/api/health/ready
   ```

### Debug Commands

```bash
# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/ready
curl http://localhost:3000/api/s3/buckets
curl "http://localhost:3000/api/parameters?name=database/host"

# Check service logs
docker logs main-api-container
kubectl logs -f deployment/main-api

# Monitor metrics
curl http://localhost:3000/metrics

# Test service communication
kubectl exec -it main-api-pod -- wget -qO- http://auxiliary-service/health
```

### Performance Monitoring

```bash
# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/s3/buckets

# Check memory usage
kubectl top pods -l app=main-api

# Monitor network traffic
kubectl exec -it main-api-pod -- netstat -an | grep 3001
```

## Best Practices

### API Gateway Pattern

1. **Service Abstraction**: Hide complexity of downstream services
2. **Centralized Logging**: Log all requests with correlation IDs
3. **Circuit Breaker**: Implement circuit breaker for auxiliary service calls
4. **Version Management**: Track and report service versions

### Microservices Communication

1. **Timeout Management**: Set appropriate timeouts for service calls
2. **Retry Logic**: Implement exponential backoff for retries
3. **Service Discovery**: Use Kubernetes DNS for service resolution
4. **Health Checks**: Validate downstream service health

### Security

1. **Input Validation**: Validate all incoming requests
2. **Rate Limiting**: Protect against abuse and DoS attacks
3. **Security Headers**: Use security middleware for protection
4. **Non-root Containers**: Run containers as non-privileged users

### Monitoring

1. **Structured Logging**: Use consistent log format across services
2. **Metrics Collection**: Expose Prometheus metrics for monitoring
3. **Distributed Tracing**: Use correlation IDs for request tracing
4. **Alerting**: Set up alerts for critical service metrics

## Contributing

When contributing to this service:

1. Follow the established code structure and patterns
2. Add appropriate tests for new functionality
3. Update documentation for any API changes
4. Ensure security best practices are followed
5. Test service communication with auxiliary service
6. Verify health check functionality

## License

This project is licensed under the MIT License - see the LICENSE file for details.
