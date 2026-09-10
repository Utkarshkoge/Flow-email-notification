FROM node:22-alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies required for building the app
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code and build Remix application
COPY . .
RUN npm run build

# Remove development dependencies to keep the production image lean
RUN npm prune --omit=dev && npm cache clean --force

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "docker-start"]
