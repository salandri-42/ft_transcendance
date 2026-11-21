# Dev
FROM node:20-alpine AS base
RUN apk add --no-cache openssl netcat-openbsd
WORKDIR /app
COPY package*.json ./

FROM base AS development
ENV NODE_ENV=development
RUN npm install && npm cache clean --force
COPY . .
RUN npx prisma generate
COPY ./script/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]

# Prod
FROM base AS build
RUN npm ci && npm cache clean --force
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
CMD ["node", "dist/main"]