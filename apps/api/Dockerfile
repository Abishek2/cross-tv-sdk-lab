FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/tv-sdk/package*.json ./packages/tv-sdk/
COPY apps/api/package*.json ./apps/api/

RUN npm ci

COPY packages/tv-sdk/ ./packages/tv-sdk/
COPY apps/api/ ./apps/api/

RUN npm run build --workspace=packages/tv-sdk
RUN npm run build --workspace=apps/api

FROM node:20-alpine AS runner
WORKDIR /app
ENV PORT=4000
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/tv-sdk ./packages/tv-sdk
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package*.json ./apps/api/

EXPOSE 4000
CMD ["npm", "start", "--workspace=apps/api"]
