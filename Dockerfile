# ========= Base Node =========
FROM node:20-alpine AS base

# ========= Install Dependencies =========
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

# ========= Builder Layer =========
FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# Desactivar a telemetria do Next.js
ENV NEXT_TELEMETRY_DISABLED 1

# Definir as variáveis de ambiente mínimas requeridas se houver build-time envs necessários
# Neste caso assumimos que o Prisma pode precisar de aceder à string de conexão ou pelo menos não falhar na build
RUN npm run build

# ========= Production Runner =========
FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
# Standalone mode no Next.js mapea os artefactos necessários de build para .next/standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
