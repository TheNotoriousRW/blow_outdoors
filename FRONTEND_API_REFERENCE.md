# 🌐 API Reference - Frontend Integration

**Base URL:** `http://localhost:3001`  
**API Version:** `v1`  
**Authentication:** Bearer Token (JWT)

---

## 📋 Índice Rápido

- [🔐 Authentication](#-authentication) - 4 endpoints
- [👥 Users](#-users) - 4 endpoints
- [🏢 Clients](#-clients) - 5 endpoints
- [📊 Billboards](#-billboards) - 6 endpoints
- [🗺️ Tariff Zones](#️-tariff-zones) - 4 endpoints
- [💰 Tariffs](#-tariffs) - 4 endpoints
- [💳 Payments](#-payments) - 7 endpoints
- [📄 Invoices](#-invoices) - 3 endpoints
- [🔔 Notifications](#-notifications) - 4 endpoints
- [📈 Reports](#-reports) - 4 endpoints
- [🗺️ Geospatial](#️-geospatial) - 4 endpoints
- [📤 Uploads](#-uploads) - 4 endpoints
- [🏥 Health](#-health) - 1 endpoint

**Total: 58 endpoints**

---

## 🔐 Authentication

### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "João",
  "lastName": "Silva",
  "phone": "+258 84 123 4567",
  "role": "client"  // admin, finance, field_agent, client
}

Response 201:
{
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "statusCode": 201
}
```

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}

Response 200:
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "João",
      "lastName": "Silva",
      "role": "client"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "statusCode": 200
}
```

### Get Profile
```http
GET /api/v1/auth/profile
Authorization: Bearer {token}

Response 200:
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "João",
    "role": "client",
    "isActive": true
  }
}
```

### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer {token}

Response 200:
{
  "message": "Logged out successfully"
}
```

---

## 👥 Users

### List Users (Admin only)
```http
GET /api/v1/users
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "João",
      "lastName": "Silva",
      "role": "client",
      "isActive": true,
      "createdAt": "2025-12-01T10:00:00.000Z"
    }
  ]
}
```

### Get User by ID
```http
GET /api/v1/users/{id}
Authorization: Bearer {token}
```

### Update User (Admin only)
```http
PATCH /api/v1/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "João Pedro",
  "isActive": false
}
```

### Delete User (Admin only)
```http
DELETE /api/v1/users/{id}
Authorization: Bearer {token}

Response 200:
{
  "message": "User deleted successfully"
}
```

---

## 🏢 Clients

### List Clients
```http
GET /api/v1/clients
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "companyName": "Empresa XYZ Lda",
      "taxId": "123456789",
      "address": "Av. Julius Nyerere, 123",
      "city": "Maputo",
      "contactPerson": "João Silva",
      "isActive": true,
      "user": { ... },
      "billboards": [ ... ]
    }
  ]
}
```

### Get Client by ID
```http
GET /api/v1/clients/{id}
Authorization: Bearer {token}
```

### Create Client
```http
POST /api/v1/clients
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "uuid",
  "companyName": "Empresa ABC Lda",
  "taxId": "987654321",
  "address": "Av. 25 de Setembro, 456",
  "city": "Maputo",
  "district": "KaMpfumo",
  "contactPerson": "Maria Santos",
  "alternativePhone": "+258 82 987 6543"
}
```

### Update Client
```http
PATCH /api/v1/clients/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "address": "Novo endereço",
  "isActive": true
}
```

### Delete Client
```http
DELETE /api/v1/clients/{id}
Authorization: Bearer {token}
```

---

## 📊 Billboards

### List Billboards
```http
GET /api/v1/billboards?status=active&clientId=uuid&district=KaMpfumo
Authorization: Bearer {token}

Query Parameters:
- status: active, inactive, maintenance, in_debt
- clientId: uuid
- district: string
- type: digital, static, led

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "code": "PAINEL-001",
      "name": "Painel Centro Maputo",
      "type": "digital",
      "size": "large",
      "status": "active",
      "address": "Av. Julius Nyerere",
      "district": "KaMpfumo",
      "neighborhood": "Baixa",
      "location": {
        "type": "Point",
        "coordinates": [32.5892, -25.9655]
      },
      "client": { ... },
      "tariffZone": { ... }
    }
  ]
}
```

### Get Billboard by ID
```http
GET /api/v1/billboards/{id}
Authorization: Bearer {token}
```

### Create Billboard
```http
POST /api/v1/billboards
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "PAINEL-002",
  "name": "Painel Av. Marginal",
  "type": "digital",
  "size": "large",
  "address": "Av. Marginal, s/n",
  "district": "KaMpfumo",
  "neighborhood": "Costa do Sol",
  "location": {
    "type": "Point",
    "coordinates": [32.6023, -25.9542]
  },
  "clientId": "uuid",
  "tariffZoneId": "uuid",
  "status": "active"
}
```

### Create Billboard from Map Click (Admin/Technician)
```http
POST /api/v1/billboards/create-from-map
Authorization: Bearer {token}
Roles: ADMIN, TECHNICIAN
Content-Type: application/json

{
  "longitude": 32.5892,
  "latitude": -25.9655,
  "code": "PAINEL-NEW-001",  // Optional - auto-generated if not provided
  "name": "Novo Painel Centro",  // Optional
  "type": "digital",  // Required
  "size": "large",  // Required
  "clientId": "uuid",  // Optional
  "address": "Av. Julius Nyerere",  // Optional
  "district": "KaMpfumo",  // Optional
  "neighborhood": "Baixa"  // Optional
}

Response 201:
{
  "data": {
    "id": "uuid",
    "code": "PAINEL-NEW-001",
    "name": "Novo Painel Centro",
    "location": {
      "type": "Point",
      "coordinates": [32.5892, -25.9655]
    },
    "status": "pending",
    ...
  }
}
```

### Update Billboard
```http
PATCH /api/v1/billboards/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "maintenance",
  "description": "Em manutenção"
}
```

### Update Billboard Status
```http
PATCH /api/v1/billboards/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "active"  // active, inactive, maintenance, in_debt
}
```

### Find Nearby Billboards
```http
GET /api/v1/billboards/nearby?longitude=32.5892&latitude=-25.9655&radius=5
Authorization: Bearer {token}

Query Parameters:
- longitude: number (required)
- latitude: number (required)
- radius: number (km, default: 5)

Response 200:
{
  "data": [
    // Billboards within radius
  ]
}
```

### Delete Billboard
```http
DELETE /api/v1/billboards/{id}
Authorization: Bearer {token}
```

---

## 🗺️ Tariff Zones

### List Tariff Zones
```http
GET /api/v1/tariff-zones
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "name": "Zona Centro",
      "code": "ZC-01",
      "description": "Centro da cidade",
      "priceMultiplier": 1.5,
      "districts": ["KaMpfumo", "KaMaxakeni"],
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [ ... ]
      },
      "isActive": true
    }
  ]
}
```

### Get Zone by ID
```http
GET /api/v1/tariff-zones/{id}
Authorization: Bearer {token}
```

### Create Zone (Admin only)
```http
POST /api/v1/tariff-zones
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Zona Suburbana",
  "code": "ZS-01",
  "description": "Zonas periféricas",
  "priceMultiplier": 1.0,
  "districts": ["Matola", "Machava"],
  "geometry": {
    "type": "MultiPolygon",
    "coordinates": [ ... ]
  }
}
```

### Update Zone (Admin only)
```http
PATCH /api/v1/tariff-zones/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "priceMultiplier": 1.3,
  "isActive": true
}
```

---

## 💰 Tariffs

### List Tariffs
```http
GET /api/v1/tariffs
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "name": "Tarifa Digital Grande",
      "billboardType": "digital",
      "billboardSize": "large",
      "basePrice": 15000.00,
      "zone": { ... },
      "isActive": true
    }
  ]
}
```

### Get Tariff by ID
```http
GET /api/v1/tariffs/{id}
Authorization: Bearer {token}
```

### Create Tariff (Admin/Finance)
```http
POST /api/v1/tariffs
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Tarifa LED Médio",
  "billboardType": "led",
  "billboardSize": "medium",
  "basePrice": 10000.00,
  "zoneId": "uuid"
}
```

### Update Tariff (Admin/Finance)
```http
PATCH /api/v1/tariffs/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "basePrice": 12000.00,
  "isActive": true
}
```

---

## 💳 Payments

### List Payments
```http
GET /api/v1/payments?clientId=uuid&status=pending
Authorization: Bearer {token}

Query Parameters:
- clientId: uuid
- status: pending, validated, rejected

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "referenceNumber": "PAY-20251201-001",
      "amount": 5000.00,
      "method": "mpesa",  // mpesa, emola, bank_transfer, cash, card
      "status": "pending",
      "paymentDate": "2025-12-01",
      "proofDocument": "http://localhost:3001/api/v1/uploads/proof-xxx.pdf",
      "client": { ... },
      "billboard": { ... }
    }
  ]
}
```

### Get Payment by ID
```http
GET /api/v1/payments/{id}
Authorization: Bearer {token}
```

### Create Payment
```http
POST /api/v1/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "referenceNumber": "PAY-20251201-002",
  "clientId": "uuid",
  "billboardId": "uuid",
  "amount": 7500,
  "method": "mpesa",
  "paymentDate": "2025-12-01",
  "notes": "Pagamento mensal"
}
```

### Create Payment with Proof
```http
POST /api/v1/payments/with-proof
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- referenceNumber: string
- clientId: uuid
- billboardId: uuid
- amount: number
- method: mpesa|emola|bank_transfer|cash|card
- paymentDate: date (YYYY-MM-DD)
- notes: string (optional)
- file: PDF/Image (max 10MB)

Response 201:
{
  "data": {
    "id": "uuid",
    "proofDocument": "http://localhost:3001/api/v1/uploads/payment-proof-xxx.pdf",
    ...
  }
}
```

### Attach Proof to Payment
```http
PATCH /api/v1/payments/{id}/attach-proof
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- file: PDF/Image

Response 200:
{
  "data": {
    "id": "uuid",
    "proofDocument": "http://localhost:3001/api/v1/uploads/payment-proof-xxx.pdf",
    ...
  }
}
```

### Validate Payment (Admin/Finance)
```http
PATCH /api/v1/payments/{id}/validate
Authorization: Bearer {token}

Response 200:
{
  "data": {
    "id": "uuid",
    "status": "validated",
    "validatedBy": "admin-uuid",
    "validatedAt": "2025-12-01T10:00:00.000Z"
  }
}
```

### Reject Payment (Admin/Finance)
```http
PATCH /api/v1/payments/{id}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Comprovativo inválido"
}

Response 200:
{
  "data": {
    "id": "uuid",
    "status": "rejected",
    "rejectionReason": "Comprovativo inválido",
    "validatedBy": "admin-uuid"
  }
}
```

---

## 📄 Invoices

### List Invoices
```http
GET /api/v1/invoices
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-2025-001",
      "issueDate": "2025-12-01",
      "dueDate": "2025-12-31",
      "totalAmount": 5000.00,
      "payment": { ... }
    }
  ]
}
```

### Get Invoice by ID
```http
GET /api/v1/invoices/{id}
Authorization: Bearer {token}
```

### Create Invoice (Admin/Finance)
```http
POST /api/v1/invoices
Authorization: Bearer {token}
Content-Type: application/json

{
  "invoiceNumber": "INV-2025-002",
  "paymentId": "uuid",
  "issueDate": "2025-12-01",
  "dueDate": "2025-12-31",
  "totalAmount": 7500.00
}
```

---

## 🔔 Notifications

### List Notifications
```http
GET /api/v1/notifications
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "type": "payment",  // payment, due_date, inspection, billboard, system
      "title": "Novo pagamento recebido",
      "message": "Pagamento de 5000 MZN foi validado",
      "isRead": false,
      "createdAt": "2025-12-01T10:00:00.000Z"
    }
  ]
}
```

### Mark as Read
```http
PATCH /api/v1/notifications/{id}/read
Authorization: Bearer {token}

Response 200:
{
  "data": {
    "id": "uuid",
    "isRead": true,
    "readAt": "2025-12-01T10:05:00.000Z"
  }
}
```

### Mark All as Read
```http
POST /api/v1/notifications/mark-all-read
Authorization: Bearer {token}

Response 200:
{
  "message": "All notifications marked as read",
  "count": 5
}
```

### Delete Notification
```http
DELETE /api/v1/notifications/{id}
Authorization: Bearer {token}
```

---

## 📈 Reports

### Revenue Report
```http
GET /api/v1/reports/revenue?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer {token}

Query Parameters:
- startDate: date (YYYY-MM-DD)
- endDate: date (YYYY-MM-DD)

Response 200:
{
  "data": {
    "totalRevenue": 150000.00,
    "byStatus": [
      {
        "status": "validated",
        "totalRevenue": "120000.00",
        "totalPayments": "15"
      },
      {
        "status": "pending",
        "totalRevenue": "30000.00",
        "totalPayments": "5"
      }
    ],
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-12-31"
    }
  }
}
```

### Billboards in Debt
```http
GET /api/v1/reports/billboards-in-debt
Authorization: Bearer {token}

Response 200:
{
  "data": {
    "total": 3,
    "billboards": [
      {
        "id": "uuid",
        "code": "PAINEL-001",
        "name": "Painel Centro",
        "status": "in_debt",
        "client": { ... }
      }
    ]
  }
}
```

### Billboards by District
```http
GET /api/v1/reports/billboards-by-district
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "district": "KaMpfumo",
      "status": "active",
      "count": "15"
    },
    {
      "district": "KaMaxakeni",
      "status": "active",
      "count": "8"
    }
  ]
}
```

### Client Statistics
```http
GET /api/v1/reports/client-statistics
Authorization: Bearer {token}

Response 200:
{
  "data": {
    "totalClients": 25,
    "activeClients": 20,
    "clientsWithBillboards": [
      {
        "clientId": "uuid",
        "companyName": "Empresa XYZ",
        "billboardCount": "5"
      }
    ]
  }
}
```

---

## 🗺️ Geospatial

### Billboards GeoJSON
```http
GET /api/v1/geospatial/billboards/geojson?status=active
Authorization: Bearer {token}

Query Parameters:
- status: active|inactive|in_debt (optional)

Notes:
- CLIENT role: Returns only their own billboards
- ADMIN/TECHNICIAN: Returns all billboards

Response 200:
{
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [32.5892, -25.9655]
        },
        "properties": {
          "id": "uuid",
          "code": "PAINEL-001",
          "name": "Painel Centro",
          "type": "digital",
          "status": "active",
          "client": { ... }
        }
      }
    ]
  }
}
```

### Billboards Clustered (for Map Performance)
```http
GET /api/v1/geospatial/billboards/clustered?zoom=8
Authorization: Bearer {token}

Query Parameters:
- zoom: Map zoom level (1-20) - required

Notes:
- zoom > 12: Returns individual billboards
- zoom <= 12: Returns clustered data
- CLIENT role: Only their billboards
- ADMIN: All billboards

Response 200:
{
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [32.59, -25.96]
        },
        "properties": {
          "cluster": true,
          "count": 15,
          "billboardIds": ["uuid1", "uuid2", ...],
          "statuses": ["active", "active", "in_debt", ...]
        }
      }
    ]
  }
}
```

### Tariff Zones GeoJSON
```http
GET /api/v1/geospatial/tariff-zones/geojson
Authorization: Bearer {token}

Response 200:
{
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "MultiPolygon",
          "coordinates": [ ... ]
        },
        "properties": {
          "id": "uuid",
          "name": "Zona Centro",
          "priceMultiplier": 1.5
        }
      }
    ]
  }
}
```

### Get Tariff Zone by Coordinates
```http
GET /api/v1/geospatial/tariff-zone/by-coordinates?longitude=32.5892&latitude=-25.9655
Authorization: Bearer {token}

Query Parameters:
- longitude: number (required)
- latitude: number (required)

Response 200:
{
  "id": "uuid",
  "name": "Zona Centro",
  "code": "ZC-01",
  "priceMultiplier": 1.5,
  "districts": ["KaMpfumo"],
  "isActive": true
}

Response 200 (not found):
null
```

### Validate Location for New Billboard (Admin/Technician)
```http
GET /api/v1/geospatial/validate-location?longitude=32.5892&latitude=-25.9655&minimumDistance=50
Authorization: Bearer {token}
Roles: ADMIN, TECHNICIAN

Query Parameters:
- longitude: number (required)
- latitude: number (required)
- minimumDistance: number (meters, default: 50)

Response 200:
{
  "valid": false,
  "tariffZone": {
    "id": "uuid",
    "name": "Zona Centro",
    "code": "ZC-01"
  },
  "nearbyBillboards": [
    {
      "id": "uuid",
      "code": "PAINEL-001",
      "name": "Painel Existente",
      "client": { ... }
    }
  ],
  "warnings": [
    "Existem 2 painel(is) num raio de 50m"
  ]
}
```

### Get Nearby Billboards
```http
GET /api/v1/geospatial/nearby-billboards?longitude=32.5892&latitude=-25.9655&radius=100
Authorization: Bearer {token}

Query Parameters:
- longitude: number (required)
- latitude: number (required)
- radius: number (meters, default: 100)

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "code": "PAINEL-001",
      "name": "Painel Centro",
      "location": { ... },
      "client": { ... }
    }
  ]
}
```

### Billboards in Polygon
```http
POST /api/v1/geospatial/billboards/in-polygon
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "Polygon",
  "coordinates": [
    [
      [32.57, -25.96],
      [32.59, -25.96],
      [32.59, -25.97],
      [32.57, -25.97],
      [32.57, -25.96]
    ]
  ]
}

Response 200:
{
  "data": [
    // Billboards dentro do polígono
  ]
}
```

### Calculate Distance
```http
GET /api/v1/geospatial/distance?fromLon=32.5892&fromLat=-25.9655&toLon=32.5950&toLat=-25.9700
Authorization: Bearer {token}

Query Parameters:
- fromLon, fromLat: coordinates of point 1
- toLon, toLat: coordinates of point 2

Response 200:
{
  "data": {
    "distance": 587.25,
    "unit": "meters",
    "distanceKm": "0.59"
  }
}
```

---

## 📤 Uploads

### Upload Single File
```http
POST /api/v1/uploads/single
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- file: PDF/Image (max 10MB)

Allowed types: JPEG, PNG, WEBP, PDF

Response 201:
{
  "data": {
    "message": "File uploaded successfully",
    "file": {
      "filename": "file-1764617706914-569166484.pdf",
      "originalName": "documento.pdf",
      "mimetype": "application/pdf",
      "size": 12345,
      "url": "http://localhost:3001/api/v1/uploads/file-xxx.pdf",
      "path": "uploads/file-xxx.pdf"
    }
  }
}
```

### Upload Multiple Files
```http
POST /api/v1/uploads/multiple
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- files[]: File (max 10 files, 10MB each)

Response 201:
{
  "data": {
    "message": "3 files uploaded successfully",
    "files": [
      { ... },
      { ... },
      { ... }
    ]
  }
}
```

### Upload Payment Proof
```http
POST /api/v1/uploads/payment-proof
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- file: PDF/Image

Response 201:
{
  "data": {
    "message": "Payment proof uploaded successfully",
    "file": {
      "filename": "payment-proof-xxx.pdf",
      "url": "http://localhost:3001/api/v1/uploads/payment-proof-xxx.pdf",
      ...
    }
  }
}
```

### Download/View File
```http
GET /api/v1/uploads/{filename}
Authorization: Bearer {token}

Response 200:
Content-Type: application/pdf (or image/jpeg, etc)
[Binary file data]
```

### Delete File (Admin/Finance)
```http
DELETE /api/v1/uploads/{filename}
Authorization: Bearer {token}

Response 200:
{
  "message": "File deleted successfully"
}
```

---

## 🏥 Health

### Health Check
```http
GET /api/v1/health

Response 200:
{
  "data": {
    "status": "ok",
    "database": {
      "status": "up"
    }
  },
  "statusCode": 200
}
```

---

## 🔑 Authentication Flow

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'Password123!'
  })
});

const { data } = await loginResponse.json();
const token = data.accessToken;

// 2. Save token (localStorage, sessionStorage, cookies)
localStorage.setItem('token', token);

// 3. Use token in requests
const response = await fetch('http://localhost:3001/api/v1/billboards', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 📝 Response Format

All endpoints return standardized responses:

```json
{
  "data": { ... },           // Response payload
  "statusCode": 200,         // HTTP status code
  "timestamp": "2025-12-01T10:00:00.000Z"  // ISO timestamp
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2025-12-01T10:00:00.000Z"
}
```

---

## 🎯 User Roles & Permissions

| Role | Description | Access Level |
|------|-------------|--------------|
| **admin** | Administrador | Full access |
| **finance** | Financeiro | Payments, invoices, reports |
| **field_agent** | Agente de campo | Billboards, inspections |
| **client** | Cliente | Own data only |

---

## 📚 Additional Resources

- **Swagger UI**: http://localhost:3001/api/docs
- **OpenAPI JSON**: http://localhost:3001/api/docs-json
- **Examples**: See `API_EXAMPLES.md`
- **Deployment**: See `DEPLOYMENT.md`

---

**Total Endpoints: 58**  
**API Version: 1.0**  
**Last Updated: December 1, 2025**
