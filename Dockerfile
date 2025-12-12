FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* tsconfig.json next.config.mjs postcss.config.mjs tailwind.config.ts ./
COPY prisma ./prisma

RUN npm install
RUN npm run prisma:generate

COPY src ./src
COPY public ./public 2>/dev/null || true

ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/prisma/dev.db"
ENV JWT_SECRET="change-me-in-prod"

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]

