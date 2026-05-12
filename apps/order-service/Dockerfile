FROM node:24-alpine

WORKDIR /app
COPY package*.json ./
COPY apps/order-service/package.json apps/order-service/package.json
COPY apps/notification-service/package.json apps/notification-service/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm install
COPY . .
RUN npm run build

CMD ["npm", "run", "start", "-w", "@portfolio/order-service"]
