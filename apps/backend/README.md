# Billboard Management System - Backend API

Backend REST API for the Billboard Management System built with NestJS, PostgreSQL + PostGIS, and Redis.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (RBAC)
- **User Management**: Multiple user roles (admin, finance, technician, client)
- **Billboard Management**: Complete CRUD operations with geospatial support
- **Geolocation**: PostGIS integration for spatial queries and GeoJSON endpoints
- **Tariff System**: Dynamic pricing based on zone, type, and size
- **Payment Processing**: Payment validation and proof uploads
- **Invoice Generation**: Pro forma invoices and receipts
- **Notifications**: In-app and email notifications with BullMQ queues
- **Reports**: Revenue, debt, and statistical reports
- **API Documentation**: Swagger/OpenAPI documentation

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL 15+ with PostGIS extension
- Redis 7+
- Docker & Docker Compose (optional)

## 🛠️ Installation

### Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Manual Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration

# Run migrations
npm run migration:run

# Start development server
npm run start:dev
```

## 🔧 Environment Variables

See `.env.example` for all required environment variables:

- **Database**: PostgreSQL connection settings
- **Redis**: Redis connection for queues
- **JWT**: Secret keys and expiration times
- **SMTP**: Email configuration
- **Storage**: Cloudflare R2 or local storage
- **Payment APIs**: Mpesa and e-Mola credentials (future)

## 📚 API Documentation

Once the server is running, access the Swagger documentation at:

```
http://localhost:3001/api/docs
```

## 🗂️ Project Structure

```
src/
├── common/              # Shared utilities
│   ├── decorators/      # Custom decorators
│   ├── enums/           # Enums and constants
│   ├── filters/         # Exception filters
│   └── interceptors/    # Response interceptors
├── config/              # Configuration files
├── modules/             # Feature modules
│   ├── auth/            # Authentication & JWT
│   ├── users/           # User management
│   ├── clients/         # Client management
│   ├── billboards/      # Billboard CRUD
│   ├── tariff-zones/    # Geographic zones
│   ├── tariffs/         # Pricing rules
│   ├── payments/        # Payment processing
│   ├── invoices/        # Invoice generation
│   ├── notifications/   # Notification system
│   ├── reports/         # Reports and analytics
│   ├── geospatial/      # GeoJSON and spatial queries
│   └── health/          # Health checks
├── app.module.ts        # Root module
└── main.ts              # Application entry point
```

## 🔐 Authentication

### Register a new user

```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "client"
}
```

### Login

```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### Use the token in subsequent requests

```bash
Authorization: Bearer <your-jwt-token>
```

## 🎯 User Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| **admin** | System administrator | Full access to all endpoints |
| **finance** | Financial team | Payments, invoices, reports |
| **technician** | Technical team | Billboards, locations, maintenance |
| **client** | Billboard owner | Own billboards and payments |

## 🗺️ Geospatial Features

### Get billboards as GeoJSON

```bash
GET /api/geospatial/billboards/geojson
```

### Find billboards nearby

```bash
GET /api/billboards/nearby?longitude=-25.9655&latitude=32.5832&radiusKm=5
```

### Get tariff zones

```bash
GET /api/geospatial/tariff-zones/geojson
```

## 📊 Reports

### Revenue report

```bash
GET /api/reports/revenue?startDate=2024-01-01&endDate=2024-12-31
```

### Billboards in debt

```bash
GET /api/reports/billboards-in-debt
```

### Geographic distribution

```bash
GET /api/reports/billboards-by-district
```

## 🔔 Notifications

Notifications are processed asynchronously using BullMQ:

- **In-app notifications**: Real-time notifications in the application
- **Email notifications**: Sent via SMTP (configurable)
- **Automatic alerts**: Payment due dates, suspensions, etc.

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Build for Production

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

## 🐳 Docker Commands

```bash
# Build image
docker build -t billboard-backend .

# Run container
docker run -p 3001:3001 --env-file .env billboard-backend

# Access container shell
docker exec -it billboard_backend sh

# View database
docker exec -it billboard_postgres psql -U postgres -d billboard_management
```

## 📝 Database Migrations

```bash
# Generate migration
npm run migration:generate -- src/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## 🔍 Health Check

```bash
GET /api/health
```

Returns the status of the database connection.

## 🚧 Future Enhancements

- [ ] Complete Mpesa and e-Mola payment integration
- [ ] PDF generation for invoices and receipts
- [ ] Advanced analytics dashboard
- [ ] Real-time WebSocket notifications
- [ ] File upload to Cloudflare R2
- [ ] Automated backup system
- [ ] Rate limiting and security hardening

## 📄 License

Proprietary - Municipality of Maputo

## 👨‍💻 Development

For development guidelines and contribution:

1. Follow the existing code structure
2. Use TypeScript strictly
3. Add Swagger documentation to new endpoints
4. Write unit tests for services
5. Update this README when adding features

---

**Developed for Municipality of Maputo** 🇲🇿
