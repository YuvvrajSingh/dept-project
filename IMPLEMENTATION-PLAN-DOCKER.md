# Docker Setup Implementation Plan

## Dept Timetable Management System

---

## Overview

This document outlines the Docker containerization plan for deploying the Dept Timetable Management System with three main services: PostgreSQL database, Express.js backend, and Next.js frontend.

### Current Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Next.js Frontend │ ──▶ │  Express Backend │ ──▶ │  PostgreSQL     │
│  (Port 3000)     │     │  (Port 3001)     │     │  (Port 5432)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Target Docker Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Docker Network                              │
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │   Frontend   │     │   Backend    │     │  PostgreSQL   │   │
│  │  (Next.js)   │     │  (Express)   │     │   (Database) │   │
│  │   :3000      │     │   :3001      │     │    :5432      │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
│         │                    │                    │               │
│         └────────────────────┴───────────────────┘               │
│                              │                                   │
│                       ┌──────┴──────┐                          │
│                       │   Nginx     │                          │
│                       │  (Port 80)  │                          │
│                       └────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Container Configuration Files

### 1.1 PostgreSQL Database

#### Docker Configuration

- **Image**: postgres:16-alpine
- **Volume**: postgres_data:/var/lib/postgresql/data
- **Environment Variables**:
  - POSTGRES_USER
  - POSTGRES_PASSWORD
  - POSTGRES_DB

#### Initialization Scripts

- **init.sql**: Schema initialization and seed data

### 1.2 Backend Service (Express.js)

#### Dockerfile

```dockerfile
# stage: base
FROM node:22-alpine AS base
WORKDIR /app

# stage: deps
FROM base AS deps
COPY time-table-backend/package*.json ./
RUN npm ci

# stage: production
FROM base AS production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY time-table-backend/ ./

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]
```

#### Build Arguments

- NODE_ENV: production
- PORT: 3001

#### Environment Variables

| Variable | Description | Default |
|----------|--------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@db:5432/depttimetable |
| JWT_SECRET | Secret key for JWT tokens | (required) |
| JWT_EXPIRES_IN | Token expiration time | 24h |
| CORS_ORIGIN | Allowed frontend origin | http://localhost:3000 |
| NODE_ENV | Environment mode | production |

### 1.3 Frontend Service (Next.js)

#### Dockerfile

```dockerfile
# stage: base
FROM node:22-alpine AS base
WORKDIR /app

# stage: deps
FROM base AS deps
COPY timetable-light/package*.json ./
RUN npm ci

# stage: builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY timetable-light/ ./
ARG NEXT_PUBLIC_API_BACKEND_URL
ENV NEXT_PUBLIC_API_BACKEND_URL=$NEXT_PUBLIC_API_BACKEND_URL
RUN npm run build

# stage: production
FROM base AS production
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY timetable-light/package*.json ./

EXPOSE 3000

CMD ["npm", "run", "start"]
```

#### Build Arguments

- NEXT_PUBLIC_API_BACKEND_URL: Backend API URL

#### Environment Variables

| Variable | Description | Default |
|----------|--------------|---------|
| NEXT_PUBLIC_API_BACKEND_URL | Backend API URL | http://localhost:3001 |
| NODE_ENV | Environment mode | production |

### 1.4 Nginx Reverse Proxy

#### nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Dockerfile

```dockerfile
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Phase 2: Orchestration Configuration

### 2.1 Docker Compose File

#### docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: dept-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-deptuser}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-deptpass}
      POSTGRES_DB: ${DB_NAME:-depttimetable}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-deptuser}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - dept-network

  backend:
    build:
      context: .
      dockerfile: time-table-backend/Dockerfile
    container_name: dept-backend
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${DB_USER:-deptuser}:${DB_PASSWORD:-deptpass}@db:5432/${DB_NAME:-depttimetable}
      JWT_SECRET: ${JWT_SECRET:-your-secret-key}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-24h}
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:80}
      NODE_ENV: production
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3001:3001"
    networks:
      - dept-network

  frontend:
    build:
      context: .
      dockerfile: timetable-light/Dockerfile
      args:
        NEXT_PUBLIC_API_BACKEND_URL: ${API_BACKEND_URL:-http://localhost:3001}
    container_name: dept-frontend
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_BACKEND_URL: ${API_BACKEND_URL:-http://localhost:3001}
      NODE_ENV: production
    depends_on:
      - backend
    ports:
      - "3000:3000"
    networks:
      - dept-network

  nginx:
    build:
      context: ./docker/nginx
      dockerfile: Dockerfile
    container_name: dept-nginx
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - frontend
      - backend
    networks:
      - dept-network

volumes:
  postgres_data:

networks:
  dept-network:
    driver: bridge
```

### 2.2 Environment Files

#### .env

```
# Database
DB_USER=deptuser
DB_PASSWORD=your-secure-password
DB_NAME=depttimetable

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=24h

# URLs
CORS_ORIGIN=http://localhost
API_BACKEND_URL=http://localhost:3001
```

#### .env.example

```
# Database - CHANGE THESE VALUES
DB_USER=deptuser
DB_PASSWORD=CHANGE_ME_IN_PRODUCTION
DB_NAME=depttimetable

# JWT - USE A STRONG, UNIQUE SECRET
JWT_SECRET=CHANGE_ME_USE_32_CHARACTER_MINIMUM
JWT_EXPIRES_IN=24h

# URLs
CORS_ORIGIN=http://localhost
API_BACKEND_URL=http://localhost:3001
```

### 2.3 Database Initialization

#### docker/init.sql

```sql
-- Initial database setup
-- This script runs on first startup to initialize the database

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The schema will be applied via Prisma migrate
-- This file is reserved for any additional initialization
-- Note: Prisma will create tables automatically on migrate
```

#### Prisma Migration Script

```typescript
// scripts/docker-migrate.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Running database migrations...');
  await prisma.$executeRaw`SELECT 1`; // Test connection
  console.log('Database connection successful');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 2.4 Health Check Script

#### scripts/health-check.sh

```bash
#!/bin/bash

# Check backend health
curl -f http://localhost:3001/health || exit 1

# Check frontend health
curl -f http://localhost:3000 || exit 1

exit 0
```

---

## Phase 3: Implementation Tasks

### Task 1: Create Backend Dockerfile

**Location**: `time-table-backend/Dockerfile`

**Steps**:
1. Review existing package.json scripts
2. Create multi-stage Dockerfile
3. Configure build arguments
4. Test build locally

### Task 2: Create Frontend Dockerfile

**Location**: `timetable-light/Dockerfile`

**Steps**:
1. Review Next.js configuration
2. Create multi-stage Dockerfile
3. Configure build arguments for API URL
4. Test build locally

### Task 3: Create Nginx Configuration

**Location**: `docker/nginx/Dockerfile` and `docker/nginx/nginx.conf`

**Steps**:
1. Create nginx.conf with proxy configurations
2. Create Dockerfile for nginx
3. Test configuration

### Task 4: Create Docker Compose File

**Location**: `docker-compose.yml`

**Steps**:
1. Define all services
2. Configure networks and volumes
3. Add health checks
4. Add environment variable handling

### Task 5: Create Environment Files

**Locations**: `.env`, `.env.example`, `docker/init.sql`

**Steps**:
1. Create .env file with secure defaults
2. Create .env.example for documentation
3. Create database initialization script

### Task 6: Create Helper Scripts

**Location**: `docker/scripts/`

**Scripts**:
1. `build.sh` - Build all containers
2. `up.sh` - Start all services
3. `down.sh` - Stop all services
4. `logs.sh` - View logs
5. `shell.sh` - Access container shell
6. `migrate.sh` - Run database migrations
7. `seed.sh` - Seed database

---

## Phase 4: Directory Structure

### Final Structure

```
dept-project/
├── time-table-backend/
│   ├── Dockerfile              # NEW
│   ├── package.json
│   └── ...
├── timetable-light/
│   ├── Dockerfile             # NEW
│   ├── package.json
│   └── ...
├── docker/
│   ├── nginx/
│   │   ├── Dockerfile       # NEW
│   │   └── nginx.conf       # NEW
│   ├── init.sql             # NEW
│   └── scripts/
│       ├── build.sh         # NEW
│       ├── up.sh           # NEW
│       ├── down.sh         # NEW
│       ├── logs.sh          # NEW
│       ├── shell.sh        # NEW
│       ├── migrate.sh       # NEW
│       └── seed.sh         # NEW
├── docker-compose.yml      # NEW
├── .env                    # NEW (add to .gitignore)
├── .env.example           # NEW
├── IMPLEMENTATION-PLAN-DOCKER.md
└── ...
```

---

## Phase 5: Usage Instructions

### Development Commands

```bash
# Start all services in development mode
npm run docker:dev

# Build all containers
npm run docker:build

# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# View logs
npm run docker:logs

# Access backend shell
npm run docker:shell:backend

# Run database migrations
npm run docker:migrate

# Seed database
npm run docker:seed
```

### Production Commands

```bash
# Build and start
docker-compose --env-file .env up --build -d

# View status
docker-compose ps

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Backup database
docker-compose exec db pg_dump -U deptuser depttimetable > backup.sql

# Restore database
docker-compose exec -T db psql -U deptuser depttimetable < backup.sql
```

---

## Phase 6: Security Considerations

### Production Checklist

- [ ] Change default database credentials
- [ ] Use strong JWT_SECRET (minimum 32 characters)
- [ ] Enable SSL/TLS for database connection
- [ ] Configure firewall rules
- [ ] Set up Docker secrets or use environment variables securely
- [ ] Enable Docker daemon authentication
- [ ] Configure resource limits (CPU, memory)
- [ ] Set up log rotation
- [ ] Configure backup strategy
- [ ] Enable Docker content trust

### Environment Variables Best Practices

| Variable | Security Level | Recommendation |
|----------|----------------|---------------|
| DB_PASSWORD | Critical | Use Docker secrets or env file |
| JWT_SECRET | Critical | Use strong random string |
| CORS_ORIGIN | High | Restrict to known domains |
| DATABASE_URL | Critical | Use SSL connection string |

---

## Phase 7: Deployment Options

### Option 1: Single Server (Recommended for Small Deployments)

**Requirements**:
- Ubuntu 22.04 LTS
- 2+ CPU cores
- 4GB+ RAM
- 20GB+ SSD storage

**Steps**:
1. Install Docker and Docker Compose
2. Clone repository
3. Configure environment variables
4. Run deployment commands

### Option 2: Cloud Providers

#### AWS ECS

- Use Amazon ECR for container registry
- Configure ECS task definitions
- Use ALB for load balancing

#### Google Cloud Run

- Use Cloud Run for containerized services
- Use Cloud SQL for PostgreSQL
- Configure Cloud CDN

#### DigitalOcean App Platform

- Use App Platform for containers
- Managed PostgreSQL database

### Option 3: Kubernetes (Enterprise)

- Use Helm charts
- Configure secrets
- Set up ingress controller
- Enable horizontal pod autoscaling

---

## Phase 8: Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Database connection refused | Check DATABASE_URL format, ensure db container is running |
| CORS errors | Check CORS_ORIGIN environment variable |
| JWT token errors | Verify JWT_SECRET matches between services |
| Port conflicts | Check no other services running on ports 80, 3000, 3001, 5432 |
| Build failures | Check Dockerfiles and ensure all files are copied |
| Permission errors | Check file permissions and .env file location |

### Debug Commands

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs -f [service-name]

# Access container shell
docker-compose exec [service-name] sh

# Check network connectivity
docker-compose exec frontend ping backend

# Check environment variables
docker-compose exec backend env

# Check database
docker-compose exec db psql -U deptuser -d depttimetable
```

---

## Phase 9: Testing Checklist

### Pre-Deployment Testing

- [ ] All images build successfully
- [ ] Containers start without errors
- [ ] Database connection works
- [ ] Backend health endpoint returns 200
- [ ] Frontend loads correctly
- [ ] API proxy works through nginx
- [ ] Authentication works
- [ ] All CRUD operations work
- [ ] Auto-scheduler generates timetable
- [ ] PDF export works
- [ ] Logs are accessible

### Performance Testing

- [ ] Load testing with hey or k6
- [ ] Response times under 2 seconds
- [ ] Database query optimization

### Security Testing

- [ ] No sensitive data in logs
- [ ] Environment variables not exposed
- [ ] JWT tokens expire correctly
- [ ] CORS configured properly
- [ ] Rate limiting works

---

## Phase 10: Maintenance

### Backup Schedule

| Frequency | Action |
|-----------|--------|
| Daily | Automated database backup |
| Weekly | Container image update check |
| Monthly | Security updates |

### Update Process

```bash
# Update containers
docker-compose pull
docker-compose up -d

# Update specific service
docker-compose pull backend
docker-compose up -d backend
```

### Monitoring

- Use docker-compose logs for basic logging
- Consider Prometheus + Grafana for production
- Set up alert notifications
- Monitor container resource usage

---

## Conclusion

This implementation plan provides a complete Docker-based deployment solution for the Dept Timetable Management System. Following this plan will enable:

- Easy deployment to any server
- Simple scaling options
- Consistent environments
- Production-ready configuration
- Maintainable infrastructure

### Next Steps

1. Review and approve this plan
2. Begin Phase 1 implementation
3. Test locally
4. Deploy to staging
5. Deploy to production

---

**Document Version**: 1.0  
**Last Updated**: April 2026  
**Author**: Implementation Team