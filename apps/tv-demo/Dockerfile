FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/tv-sdk/package*.json ./packages/tv-sdk/
COPY apps/tv-demo/package*.json ./apps/tv-demo/

RUN npm ci

COPY packages/tv-sdk/ ./packages/tv-sdk/
COPY apps/tv-demo/ ./apps/tv-demo/

RUN npm run build --workspace=packages/tv-sdk
RUN npm run build --workspace=apps/tv-demo

FROM node:20-alpine AS runner
WORKDIR /app
ENV PORT=8080
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/tv-sdk ./packages/tv-sdk
COPY --from=builder /app/apps/tv-demo ./apps/tv-demo

EXPOSE 8080
CMD ["npm", "start", "--workspace=apps/tv-demo"]
