# Node Microservices Event Driven

Two NestJS services communicating through RabbitMQ, each with its own MongoDB database.

## Architecture

```text
POST /orders -> Order Service -> MongoDB orders
                         |
                         v
                    RabbitMQ order.created
                         |
                         v
Notification Service -> MongoDB notifications -> structured JSON log
```

There is no direct HTTP call between services.

## Quick start

```bash
npm install
npm run build
docker compose up --build
```

Create an order:

```bash
curl -X POST http://localhost:3001/orders \
  -H "content-type: application/json" \
  -H "x-correlation-id: demo-123" \
  -d '{"customerEmail":"client@example.com","totalCents":12990}'
```

## Runtime endpoints

- Order health: `GET http://localhost:3001/health`
- Notification health: `GET http://localhost:3002/health`
- Metrics: `/metrics` on both services
- RabbitMQ UI: `http://localhost:15674`
- Prometheus: `http://localhost:9090`

## Quality

```bash
npm run typecheck
npm run test
npm run build
```
