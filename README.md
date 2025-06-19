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
