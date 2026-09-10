FROM node:22-alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Upgrade npm to support npm 11+ lockfiles
RUN npm install -g npm@latest

# Install dependencies required for building the app
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy source code and build Remix application
COPY . .
RUN npm run build

# Remove development dependencies to keep the production image lean
RUN npm prune --omit=dev && npm cache clean --force || true

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "docker-start"]
