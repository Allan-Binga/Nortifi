# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm ci

# Copy full app source code (make sure prisma is included)
COPY . .

# Stage 2: Final image
FROM node:22-alpine

WORKDIR /app

# Copy only what's needed from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app ./

EXPOSE 6300

#Migrate And Start Application
CMD npm start
