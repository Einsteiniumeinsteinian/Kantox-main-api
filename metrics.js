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