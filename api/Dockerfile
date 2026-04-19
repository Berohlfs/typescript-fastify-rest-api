FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm build

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN apk add --no-cache dumb-init \
 && addgroup -S nodejs -g 1001 \
 && adduser -S nodejs -u 1001 -G nodejs

COPY --chown=nodejs:nodejs package.json ./
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

USER nodejs

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
