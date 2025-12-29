# 📡 API Examples - Billboard Management System

Collection of API request examples for testing the Billboard Management System.

## 🔐 Authentication

### Register New User

```http
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "admin@municipio-maputo.gov.mz",
  "password": "Admin@2024!",
  "firstName": "Administrator",
  "lastName": "System",
  "phone": "+258 84 123 4567",
  "role": "admin"
}
```

### Login

```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@municipio-maputo.gov.mz",
  "password": "Admin@2024!"
}
```

### Get Profile

```http
GET http://localhost:3001/api/auth/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

### Logout

```http
POST http://localhost:3001/api/auth/logout
Authorization: Bearer YOUR_JWT_TOKEN
```

## 👥 Users

### List All Users (Admin only)

```http
GET http://localhost:3001/api/users
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get User by ID

```http
GET http://localhost:3001/api/users/{userId}
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🏢 Clients

### Create Client

```http
POST http://localhost:3001/api/clients
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "companyName": "Publicidade Maputo Lda",
  "taxId": "400123456",
  "address": "Av. Julius Nyerere, 1234",
  "city": "Maputo",
  "district": "KaMpfumo",
  "postalCode": "1100",
  "contactPerson": "João Silva",
  "alternativePhone": "+258 82 987 6543",
  "notes": "Cliente premium desde 2020"
}
```

### List All Clients

```http
GET http://localhost:3001/api/clients
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Client by ID

```http
GET http://localhost:3001/api/clients/{clientId}
Authorization: Bearer YOUR_JWT_TOKEN
```

### Update Client

```http
PATCH http://localhost:3001/api/clients/{clientId}
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "address": "Av. Julius Nyerere, 5678",
  "alternativePhone": "+258 82 111 2222"
}
```

## 📊 Billboards

### Create Billboard

```http
POST http://localhost:3001/api/billboards
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "code": "MPT-JN-001",
  "name": "Outdoor Julius Nyerere 1",
  "type": "outdoor",
  "size": "large",
  "width": 8,
  "height": 4,
  "area": 32,
  "address": "Av. Julius Nyerere esquina com Av. 24 de Julho",
  "street": "Av. Julius Nyerere",
  "neighborhood": "Polana",
  "district": "KaMpfumo",
  "location": {
    "type": "Point",
    "coordinates": [32.5832, -25.9655]
  },
  "description": "Painel em área de alto tráfego",
  "status": "active",
  "installationDate": "2024-01-15"
}
```

### List Billboards with Filters

```http
# All billboards
GET http://localhost:3001/api/billboards
Authorization: Bearer YOUR_JWT_TOKEN

# Filter by status
GET http://localhost:3001/api/billboards?status=active
Authorization: Bearer YOUR_JWT_TOKEN

# Filter by district
GET http://localhost:3001/api/billboards?district=KaMpfumo
Authorization: Bearer YOUR_JWT_TOKEN

# Filter by client
GET http://localhost:3001/api/billboards?clientId={clientId}
Authorization: Bearer YOUR_JWT_TOKEN
```

### Find Nearby Billboards

```http
GET http://localhost:3001/api/billboards/nearby?longitude=32.5832&latitude=-25.9655&radiusKm=5
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Billboard by ID

```http
GET http://localhost:3001/api/billboards/{billboardId}
Authorization: Bearer YOUR_JWT_TOKEN
```

### Update Billboard

```http
PATCH http://localhost:3001/api/billboards/{billboardId}
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "status": "active",
  "description": "Painel recém renovado"
}
```

### Update Billboard Status

```http
PATCH http://localhost:3001/api/billboards/{billboardId}/status
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "status": "suspended"
}
```

## 🗺️ Tariff Zones

### Create Tariff Zone

```http
POST http://localhost:3001/api/tariff-zones
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Zona Premium Centro",
  "code": "ZONE-A",
  "description": "Área central de alto valor comercial",
  "priceMultiplier": 2.0,
  "districts": ["KaMpfumo", "KaMaxakeni"],
  "isActive": true
}
```

### List Tariff Zones

```http
GET http://localhost:3001/api/tariff-zones
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Tariff Zone by ID

```http
GET http://localhost:3001/api/tariff-zones/{zoneId}
Authorization: Bearer YOUR_JWT_TOKEN
```

## 💰 Tariffs

### Create Tariff

```http
POST http://localhost:3001/api/tariffs
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Outdoor Grande - Zona A",
  "billboardType": "outdoor",
  "billboardSize": "large",
  "monthlyPrice": 50000.00,
  "yearlyPrice": 540000.00,
  "description": "Tarifa para outdoor grande em zona premium",
  "isActive": true
}
```

### List Tariffs

```http
GET http://localhost:3001/api/tariffs
Authorization: Bearer YOUR_JWT_TOKEN
```

## 💳 Payments

### Create Payment

```http
POST http://localhost:3001/api/payments
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "referenceNumber": "PAY-2024-001",
  "amount": 50000.00,
  "method": "mpesa",
  "paymentDate": "2024-01-15",
  "dueDate": "2024-02-15",
  "notes": "Pagamento mensal Janeiro 2024"
}
```

### List Payments

```http
# All payments
GET http://localhost:3001/api/payments
Authorization: Bearer YOUR_JWT_TOKEN

# Filter by client
GET http://localhost:3001/api/payments?clientId={clientId}
Authorization: Bearer YOUR_JWT_TOKEN

# Filter by status
GET http://localhost:3001/api/payments?status=pending
Authorization: Bearer YOUR_JWT_TOKEN
```

### Validate Payment (Finance/Admin only)

```http
PATCH http://localhost:3001/api/payments/{paymentId}/validate
Authorization: Bearer YOUR_JWT_TOKEN
```

### Reject Payment (Finance/Admin only)

```http
PATCH http://localhost:3001/api/payments/{paymentId}/reject
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "reason": "Comprovativo ilegível ou inválido"
}
```

## 📄 Invoices

### Create Invoice

```http
POST http://localhost:3001/api/invoices
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "invoiceNumber": "INV-2024-001",
  "type": "proforma",
  "amount": 50000.00,
  "tax": 8000.00,
  "totalAmount": 58000.00,
  "issueDate": "2024-01-15",
  "dueDate": "2024-02-15",
  "description": "Fatura Pro Forma - Janeiro 2024"
}
```

### List Invoices

```http
GET http://localhost:3001/api/invoices
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🔔 Notifications

### Get My Notifications

```http
# All notifications
GET http://localhost:3001/api/notifications
Authorization: Bearer YOUR_JWT_TOKEN

# Only unread
GET http://localhost:3001/api/notifications?onlyUnread=true
Authorization: Bearer YOUR_JWT_TOKEN
```

### Mark Notification as Read

```http
PATCH http://localhost:3001/api/notifications/{notificationId}/read
Authorization: Bearer YOUR_JWT_TOKEN
```

### Mark All as Read

```http
POST http://localhost:3001/api/notifications/mark-all-read
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📈 Reports

### Revenue Report

```http
# All time
GET http://localhost:3001/api/reports/revenue
Authorization: Bearer YOUR_JWT_TOKEN

# With date range
GET http://localhost:3001/api/reports/revenue?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer YOUR_JWT_TOKEN
```

### Billboards in Debt

```http
GET http://localhost:3001/api/reports/billboards-in-debt
Authorization: Bearer YOUR_JWT_TOKEN
```

### Billboards by District

```http
GET http://localhost:3001/api/reports/billboards-by-district
Authorization: Bearer YOUR_JWT_TOKEN
```

### Client Statistics

```http
GET http://localhost:3001/api/reports/client-statistics
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🗺️ Geospatial

### Get Billboards as GeoJSON

```http
GET http://localhost:3001/api/geospatial/billboards/geojson
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Tariff Zones as GeoJSON

```http
GET http://localhost:3001/api/geospatial/tariff-zones/geojson
Authorization: Bearer YOUR_JWT_TOKEN
```

### Find Billboards in Polygon

```http
POST http://localhost:3001/api/geospatial/billboards/in-polygon
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "polygon": {
    "type": "Polygon",
    "coordinates": [[
      [32.57, -25.96],
      [32.59, -25.96],
      [32.59, -25.97],
      [32.57, -25.97],
      [32.57, -25.96]
    ]]
  }
}
```

### Calculate Distance

```http
GET http://localhost:3001/api/geospatial/distance?fromLon=32.5832&fromLat=-25.9655&toLon=32.5900&toLat=-25.9700
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🏥 Health Check

```http
GET http://localhost:3001/api/health
```

---

## 📝 Notes

- Replace `YOUR_JWT_TOKEN` with the actual token received from login
- Replace `{clientId}`, `{billboardId}`, etc. with actual UUIDs
- All timestamps are in ISO 8601 format
- Coordinates are in [longitude, latitude] format (GeoJSON standard)
- All monetary values are in Mozambican Metical (MZN)

## 🔧 Testing Tools

### Using cURL

Save token as variable:
```bash
export TOKEN="your-jwt-token-here"

# Then use in requests
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/billboards
```

### Using Postman

1. Create a new collection
2. Add these requests
3. Set Authorization type to "Bearer Token" at collection level
4. Use `{{token}}` variable

### Using Swagger UI

Simply navigate to `http://localhost:3001/api/docs` and test directly in the browser.

---

**Happy Testing! 🚀**
