# ──────────────────────────
# Stage 1: build Next.js
# ──────────────────────────
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# only copy what we need to install/build
COPY package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs ./
COPY public ./public
COPY src ./src    # your TSX/Route code under src/app

RUN npm ci
RUN npm run build

# ──────────────────────────
# Stage 2: package Python + Node runtimes
# ──────────────────────────
FROM python:3.11-slim

WORKDIR /app

# 1) Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2) Install Node.js runtime (to run Next.js start)
RUN apt-get update \
 && apt-get install -y curl gnupg \
 && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
 && apt-get install -y nodejs \
 && rm -rf /var/lib/apt/lists/*

# 3) Copy in your Flask backend
COPY bot_executor.py instruments.csv strategies/ ./

# 4) Copy in the built Next.js frontend
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/package.json ./package.json
COPY --from=frontend-builder /app/node_modules ./node_modules

# Ports for Flask and Next.js
EXPOSE 8000
EXPOSE 3000

# 5) Launch both services:
#    - Gunicorn serves your Flask API on 0.0.0.0:8000
#    - Next.js serves on 0.0.0.0:3000
CMD ["sh", "-c", "\
    gunicorn bot_executor:app --bind 0.0.0.0:8000 & \
    npm run start -- -p 3000 \
"]
