# Dev
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
ENV NODE_ENV=development
RUN npm install && npm cache clean --force
COPY . .
CMD ["npm", "run", "start:dev"]

# Prod
FROM base AS build
RUN npm ci && npm cache clean --force
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
CMD ["node", "dist/main"]
