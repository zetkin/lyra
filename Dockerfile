##################################################
# 1) BUILD STAGE
##################################################
FROM node:18-alpine AS builder

WORKDIR /app

# Copy only the necessary files for install
COPY package.json package-lock.json ./
COPY webapp/package.json webapp/

# Install dependencies in a single layer to leverage caching
# npm ci is better for reproducible builds than npm install
RUN npm ci

# Copy the rest of the source code
COPY . .

RUN npm --workspace webapp run build

##################################################
# 2) RUNTIME STAGE
##################################################
FROM node:18-alpine AS runner

RUN apk add --no-cache git openssh && \
    addgroup -g 1001 nodejs && \
    adduser -G nodejs -u 1001 -D nodeuser

WORKDIR /app

# Copy over the production build from builder stage
COPY --from=builder /app/webapp/.next/standalone ./
COPY --from=builder /app/webapp/.next/static ./webapp/.next/static
# Copy over the configuration
COPY --from=builder /app/config /app/config

RUN mkdir -p /home/nodeuser/.ssh && \
    ssh-keyscan -t rsa,ed25519 github.com >> /home/nodeuser/.ssh/known_hosts && \
    chown -R nodeuser:nodejs /home/nodeuser/.ssh && \
    chown -R nodeuser:nodejs /app

# Switch to non-root user
USER nodeuser

EXPOSE 3000
CMD ["node", "webapp/server.js"]