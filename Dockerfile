# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies
COPY package.json yarn.lock ./
RUN yarn install

# Copy the rest of the application source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN yarn build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install only production dependencies
COPY package.json yarn.lock ./
RUN yarn install --production

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Copy the Prisma schema and generated client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
COPY docker-entrypoint.sh ./

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/src/main"]
