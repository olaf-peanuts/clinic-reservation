# ---------- Builder ----------
FROM node:18-alpine AS builder

WORKDIR /app

# ワークスペース全体の package.json と lock をコピーし、依存をインストール
COPY package*.json ./
RUN npm ci

# アプリコードと shared ライブラリをコピー
COPY apps/backend ./apps/backend
COPY libs/shared ./libs/shared
COPY prisma ./prisma
COPY tsconfig.base.json .

WORKDIR /app/apps/backend

# Prisma クライアント生成 + Nest ビルド
RUN npx prisma generate && npm run build

# ---------- Runtime ----------
FROM node:18-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

# Builder からビルド成果物と依存だけをコピー
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]
