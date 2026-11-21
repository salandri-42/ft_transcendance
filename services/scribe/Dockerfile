# Dev
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
ENV NODE_ENV=development
RUN npm install && npm cache clean --force
COPY . .
RUN npx hardhat compile
CMD ["npm", "run", "start:dev"]

# Prod
FROM base AS build
RUN npm ci && npm cache clean --force
COPY tsconfig*.json ./
COPY hardhat.config.ts ./
COPY contracts/ ./contracts/
RUN npx hardhat compile
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/artifacts ./artifacts
COPY --from=build /app/node_modules ./node_modules
CMD ["node", "dist/main"]
