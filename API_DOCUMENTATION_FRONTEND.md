# 📚 API Documentation - Billboard Management System
## Endpoints para Front-End

**Base URL:** `http://localhost:3001/api/v1`

---

## 🔐 AUTENTICAÇÃO

### 1. Registrar Usuário
```http
POST /auth/register
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SenhaForte@123",
  "firstName": "João",
  "lastName": "Silva",
  "phone": "258841234567",
  "role": "client"
}
```

**Response (201):**
```json
{
  "data": {
    "message": "User registered successfully",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "João",
      "lastName": "Silva",
      "role": "client"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 2. Login
```http
POST /auth/login
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SenhaForte@123"
}
```

**Response (200):**
```json
{
  "data": {
    "message": "Login successful",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "João",
      "lastName": "Silva",
      "role": "client"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Importante:**
- `accessToken` expira em 7 dias
- `refreshToken` expira em 30 dias
- Salvar ambos no localStorage/sessionStorage

---

### 3. Refresh Token
```http
POST /auth/refresh
Content-Type: application/json
```

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "data": {
    "message": "Token refreshed successfully",
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Quando usar:** Quando o accessToken expirar (401 Unauthorized)

---

### 4. Obter Perfil
```http
GET /auth/profile
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "João",
    "lastName": "Silva",
    "role": "client",
    "phone": "258841234567",
    "isActive": true,
    "createdAt": "2025-12-01T10:00:00Z"
  }
}
```

---

### 5. Logout
```http
POST /auth/logout
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "data": {
    "message": "Logout successful"
  }
}
```

---

## 📊 DASHBOARD

### 6. Dashboard Geral (Role-based)
```http
GET /dashboard
Authorization: Bearer {accessToken}
```

**Response para CLIENT (200):**
```json
{
  "data": {
    "billboards": {
      "total": 5,
      "active": 3,
      "suspended": 1,
      "inDebt": 1
    },
    "payments": {
      "pending": 2,
      "validated": 8,
      "rejected": 1,
      "totalPending": 15000.00
    },
    "invoices": {
      "total": 10,
      "unpaid": 2
    },
    "notifications": {
      "unread": 3,
      "recent": [
        {
          "id": "uuid",
          "title": "Pagamento Validado",
          "message": "Seu pagamento de 5000 MT foi validado",
          "type": "APPROVAL",
          "isRead": false,
          "createdAt": "2025-12-02T10:00:00Z"
        }
      ]
    }
  }
}
```

**Response para ADMIN (200):**
```json
{
  "data": {
    "billboards": {
      "total": 45,
      "active": 35,
      "suspended": 5,
      "inDebt": 5
    },
    "payments": {
      "pending": 12,
      "validated": 150,
      "rejected": 8,
      "totalRevenue": 2450000.00
    },
    "clients": {
      "total": 25,
      "withBillboards": 20
    },
    "invoices": {
      "total": 180,
      "unpaid": 15
    }
  }
}
```

---

## 🏠 PAINÉIS PUBLICITÁRIOS

### 7. Listar Painéis (com filtros)
```http
GET /billboards?status=active&district=KaMpfumo
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `status` (opcional): active | pending | suspended | in_debt | inactive
- `district` (opcional): Nome do distrito
- `type` (opcional): outdoor | billboard | totem | digital | illuminated
- `clientId` (opcional): UUID do cliente (apenas ADMIN)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "BILL-001",
      "name": "Painel Av. Julius Nyerere",
      "type": "digital",
      "size": "large",
      "status": "active",
      "address": "Av. Julius Nyerere, 123",
      "district": "KaMpfumo",
      "neighborhood": "Baixa",
      "location": {
        "type": "Point",
        "coordinates": [32.5892, -25.9655]
      },
      "client": {
        "id": "uuid",
        "companyName": "Empresa XYZ Lda"
      },
      "createdAt": "2025-12-01T10:00:00Z"
    }
  ]
}
```

**Nota:** CLIENT vê apenas seus próprios painéis automaticamente.

---

### 8. Detalhes Completos do Painel
```http
GET /billboards/{id}
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "code": "BILL-001",
    "name": "Painel Av. Julius Nyerere",
    "type": "digital",
    "size": "large",
    "status": "active",
    "address": "Av. Julius Nyerere, 123",
    "district": "KaMpfumo",
    "neighborhood": "Baixa",
    "location": {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [32.5892, -25.9655]
      },
      "properties": {
        "address": "Av. Julius Nyerere, 123",
        "district": "KaMpfumo",
        "neighborhood": "Baixa"
      }
    },
    "client": {
      "id": "uuid",
      "companyName": "Empresa XYZ Lda",
      "email": "contato@empresa.com",
      "phone": "258841234567"
    },
    "tariffZone": {
      "id": "uuid",
      "name": "Zona A - Centro",
      "districts": ["KaMpfumo", "KaMaxakeni"]
    },
    "currentTariff": {
      "id": "uuid",
      "monthlyRate": 5000.00,
      "yearlyRate": 54000.00,
      "penaltyRate": 2,
      "effectiveDate": "2025-01-01"
    },
    "financialSummary": {
      "monthlyRate": 5000.00,
      "monthsSinceInstall": 3,
      "totalOwed": 15000.00,
      "totalPaid": 10000.00,
      "currentDebt": 5000.00,
      "monthsInDebt": 1,
      "nextPaymentDue": "2025-01-01T00:00:00Z"
    },
    "paymentHistory": [
      {
        "id": "uuid",
        "amount": 5000.00,
        "method": "bank_transfer",
        "status": "validated",
        "referenceNumber": "PAY-001",
        "paymentDate": "2025-11-01",
        "validatedAt": "2025-11-02T10:00:00Z",
        "hasProof": true
      }
    ],
    "paymentStatistics": {
      "total": 2,
      "validated": 1,
      "pending": 1,
      "rejected": 0
    },
    "installationDate": "2025-10-01",
    "createdAt": "2025-10-01T10:00:00Z"
  }
}
```

**Uso no Front-End:**
- Mostrar mapa com `location` (GeoJSON)
- Exibir `financialSummary` em cards/gráficos
- Listar `paymentHistory` em tabela
- Destacar `currentDebt` se > 0
- Mostrar alerta se `nextPaymentDue` está próximo

---

## 💰 PAGAMENTOS

### 9. Calcular Dívida Antes de Pagar
```http
GET /payments/calculate-debt/{billboardId}
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "data": {
    "billboardId": "uuid",
    "billboardCode": "BILL-001",
    "monthlyRate": 5000.00,
    "installationDate": "2025-10-01T00:00:00Z",
    "monthsSinceInstall": 3,
    "totalOwed": 15000.00,
    "totalPaid": 10000.00,
    "currentDebt": 5000.00,
    "monthsInDebt": 1,
    "penaltyAmount": 100.00,
    "taxAmount": 816.00,
    "totalWithPenaltiesAndTax": 5916.00,
    "nextPaymentDue": "2025-01-01T00:00:00Z",
    "breakdown": {
      "baseAmount": 5000.00,
      "penalties": 100.00,
      "tax": 816.00,
      "total": 5916.00
    }
  }
}
```

**Uso no Front-End:**
- Mostrar `breakdown` antes de submeter pagamento
- Exibir warning se há `penaltyAmount`
- Destacar `totalWithPenaltiesAndTax` como valor a pagar

---

### 10. Submeter Pagamento com Cálculo Automático (CLIENT)
```http
POST /payments/submit-with-debt-calculation/{billboardId}
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Form Data:**
```
file: [arquivo PDF/JPG/PNG] (obrigatório)
```

**Response (200):**
```json
{
  "data": {
    "message": "Pagamento submetido com sucesso! Aguardando validação.",
    "payment": {
      "id": "uuid",
      "referenceNumber": "PAY-1733154000-1234",
      "amount": 5916.00,
      "status": "pending",
      "paymentDate": "2025-12-02",
      "dueDate": "2025-01-01",
      "notes": "Pagamento automático - Dívida: 5000 MT + Penalidades: 100 MT + IVA: 816 MT",
      "proofDocument": "http://localhost:3001/api/v1/uploads/payment-proof-123456.pdf"
    },
    "debtCalculation": {
      "breakdown": {
        "baseAmount": 5000.00,
        "penalties": 100.00,
        "tax": 816.00,
        "total": 5916.00
      }
    }
  }
}
```

**Fluxo no Front-End:**
1. Cliente clica em "Pagar Dívida" no painel
2. Sistema chama `GET /calculate-debt/{id}` e mostra breakdown
3. Cliente faz upload do comprovativo
4. Sistema chama `POST /submit-with-debt-calculation/{id}`
5. Mostra mensagem de sucesso
6. Admin recebe notificação automaticamente

---

### 11. Resumo de Dívidas do Cliente (CLIENT)
```http
GET /payments/my-debt-summary
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "data": {
    "totalBillboards": 5,
    "totalDebt": 12000.00,
    "totalWithPenaltiesAndTax": 13992.00,
    "billboardsInDebt": 3
  }
}
```

**Uso:** Mostrar no dashboard resumo de dívidas totais

---

### 12. Listar Pagamentos
```http
GET /payments?status=pending
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `status` (opcional): pending | validated | rejected
- `clientId` (opcional): UUID (apenas ADMIN)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "referenceNumber": "PAY-001",
      "amount": 5000.00,
      "method": "bank_transfer",
      "status": "pending",
      "paymentDate": "2025-12-01",
      "proofDocument": "url-do-comprovativo",
      "client": {
        "companyName": "Empresa XYZ"
      },
      "billboard": {
        "code": "BILL-001",
        "address": "Av. Julius Nyerere"
      },
      "createdAt": "2025-12-01T10:00:00Z"
    }
  ]
}
```

---

### 13. Validar Pagamento (ADMIN/FINANCE)
```http
PATCH /payments/{id}/validate
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "validated",
    "validatedAt": "2025-12-02T10:00:00Z",
    "validatedBy": "admin-user-id"
  }
}
```

**Efeito:** Cliente recebe notificação automática de validação

---

### 14. Rejeitar Pagamento (ADMIN/FINANCE)
```http
PATCH /payments/{id}/reject
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```json
{
  "reason": "Comprovativo ilegível. Por favor, envie um documento mais claro."
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "rejected",
    "rejectionReason": "Comprovativo ilegível...",
    "validatedAt": "2025-12-02T10:00:00Z"
  }
}
```

**Efeito:** Cliente recebe notificação com motivo da rejeição

---

## 🔔 NOTIFICAÇÕES

### 15. Listar Notificações
```http
GET /notifications
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "APPROVAL",
      "title": "Pagamento Validado",
      "message": "Seu pagamento de 5000 MT foi validado com sucesso! Referência: PAY-001",
      "data": {
        "paymentId": "uuid",
        "amount": 5000,
        "status": "validated"
      },
      "isRead": false,
      "createdAt": "2025-12-02T10:00:00Z"
    },
    {
      "id": "uuid",
      "type": "PAYMENT",
      "title": "Novo Pagamento Submetido",
      "message": "Pagamento de 5000 MT foi submetido. Referência: PAY-001",
      "isRead": false,
      "createdAt": "2025-12-02T09:00:00Z"
    }
  ]
}
```

**Tipos de Notificação:**
- `PAYMENT` - Novo pagamento (para admin)
- `APPROVAL` - Pagamento validado (para cliente)
- `ALERT` - Pagamento rejeitado ou alertas (para cliente)
- `DUE_DATE` - Vencimento próximo
- `SYSTEM` - Mensagens do sistema

---

### 16. Marcar Notificação como Lida
```http
PATCH /notifications/{id}/read
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "isRead": true,
    "readAt": "2025-12-02T10:30:00Z"
  }
}
```

---

### 17. Marcar Todas como Lidas
```http
POST /notifications/mark-all-read
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "data": {
    "message": "All notifications marked as read"
  }
}
```

---

## 📄 FATURAS

### 18. Listar Faturas
```http
GET /invoices
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-2025-001",
      "type": "RECEIPT",
      "amount": 5000.00,
      "tax": 800.00,
      "totalAmount": 5800.00,
      "issueDate": "2025-12-01",
      "dueDate": "2025-12-31",
      "pdfUrl": "url-do-pdf",
      "payment": {
        "referenceNumber": "PAY-001",
        "status": "validated"
      },
      "createdAt": "2025-12-01T10:00:00Z"
    }
  ]
}
```

---

### 19. Detalhes da Fatura
```http
GET /invoices/{id}
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "invoiceNumber": "INV-2025-001",
    "type": "RECEIPT",
    "amount": 5000.00,
    "tax": 800.00,
    "totalAmount": 5800.00,
    "issueDate": "2025-12-01",
    "dueDate": "2025-12-31",
    "pdfUrl": "http://localhost:3001/api/v1/invoices/download/uuid.pdf",
    "description": "Pagamento mensal de painel publicitário",
    "lineItems": [
      {
        "description": "Taxa mensal - BILL-001",
        "quantity": 1,
        "unitPrice": 5000.00,
        "total": 5000.00
      }
    ],
    "payment": {
      "referenceNumber": "PAY-001",
      "amount": 5000.00,
      "status": "validated"
    }
  }
}
```

---

## 📊 RELATÓRIOS (ADMIN/FINANCE)

### 20. Relatório de Receitas
```http
GET /reports/revenue?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "data": {
    "totalRevenue": 245000.00,
    "validatedPayments": 150,
    "averagePayment": 1633.33,
    "byMonth": [
      {
        "month": "2025-01",
        "revenue": 20000.00,
        "payments": 12
      }
    ]
  }
}
```

---

### 21. Painéis em Dívida
```http
GET /reports/billboards-in-debt
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "data": [
    {
      "billboard": {
        "id": "uuid",
        "code": "BILL-001",
        "address": "Av. Julius Nyerere"
      },
      "client": {
        "companyName": "Empresa XYZ"
      },
      "debtAmount": 5000.00,
      "monthsInDebt": 2,
      "lastPaymentDate": "2025-10-01"
    }
  ]
}
```

---

## 🗺️ GEOESPACIAL

### 22. Painéis em GeoJSON
```http
GET /geospatial/billboards/geojson?district=KaMpfumo
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
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
          "code": "BILL-001",
          "name": "Painel Av. Julius Nyerere",
          "status": "active",
          "address": "Av. Julius Nyerere, 123",
          "district": "KaMpfumo"
        }
      }
    ]
  }
}
```

**Uso:** Integrar com Mapbox/Leaflet para visualização em mapa

---

## 🔒 AUTORIZAÇÃO

### Headers Obrigatórios

Todos os endpoints (exceto login/register) requerem:

```http
Authorization: Bearer {accessToken}
```

### Roles e Permissões

| Endpoint | CLIENT | FINANCE | TECHNICIAN | ADMIN |
|----------|--------|---------|------------|-------|
| Dashboard | ✅ (próprios dados) | ✅ (todos) | ✅ (todos) | ✅ (todos) |
| Listar Painéis | ✅ (próprios) | ✅ (todos) | ✅ (todos) | ✅ (todos) |
| Detalhes Painel | ✅ (próprios) | ✅ (todos) | ✅ (todos) | ✅ (todos) |
| Calcular Dívida | ✅ | ✅ | ✅ | ✅ |
| Submeter Pagamento | ✅ | ❌ | ❌ | ❌ |
| Validar Pagamento | ❌ | ✅ | ❌ | ✅ |
| Rejeitar Pagamento | ❌ | ✅ | ❌ | ✅ |
| Criar Painel | ❌ | ❌ | ✅ | ✅ |
| Editar Painel | ❌ | ❌ | ✅ | ✅ |
| Relatórios | ❌ | ✅ | ❌ | ✅ |

---

## ⚠️ TRATAMENTO DE ERROS

### Códigos de Status

| Código | Significado | Ação |
|--------|-------------|------|
| 200 | OK | Sucesso |
| 201 | Created | Recurso criado |
| 400 | Bad Request | Validar campos do formulário |
| 401 | Unauthorized | Fazer login ou refresh token |
| 403 | Forbidden | Usuário sem permissão |
| 404 | Not Found | Recurso não encontrado |
| 500 | Internal Error | Mostrar erro genérico |

### Exemplo de Erro (401)

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "timestamp": "2025-12-02T10:00:00Z",
  "path": "/api/v1/payments"
}
```

### Interceptor Recomendado (Axios)

```javascript
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expirou, tentar refresh
      const refreshToken = localStorage.getItem('refreshToken');
      try {
        const { data } = await axios.post('/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        // Retry request original
        return axios(error.config);
      } catch {
        // Refresh falhou, fazer logout
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 🎨 FLUXOS PRINCIPAIS DO FRONT-END

### Fluxo 1: Login e Dashboard
```
1. POST /auth/login
2. Salvar accessToken e refreshToken
3. GET /auth/profile
4. GET /dashboard
5. Renderizar dashboard com estatísticas
```

### Fluxo 2: Ver Detalhes de Painel
```
1. GET /billboards (lista)
2. Click em painel
3. GET /billboards/{id} (detalhes completos)
4. Renderizar: mapa, financeiro, histórico pagamentos
```

### Fluxo 3: Submeter Pagamento (CLIENT)
```
1. Na página do painel, click "Pagar Dívida"
2. GET /payments/calculate-debt/{billboardId}
3. Mostrar modal com breakdown:
   - Base: 5000 MT
   - Penalidades: 100 MT
   - IVA: 816 MT
   - Total: 5916 MT
4. Cliente faz upload do comprovativo
5. POST /payments/submit-with-debt-calculation/{billboardId}
6. Mostrar sucesso: "Pagamento submetido! Aguardando validação."
7. Refresh notifications (cliente verá quando admin validar)
```

### Fluxo 4: Validar Pagamento (ADMIN)
```
1. GET /payments?status=pending
2. Ver lista de pagamentos pendentes
3. Click em pagamento
4. Ver detalhes + comprovativo
5. PATCH /payments/{id}/validate (ou reject)
6. Cliente recebe notificação automática
```

### Fluxo 5: Notificações em Tempo Real
```
1. Polling: GET /notifications a cada 30s
2. Mostrar badge com número de não lidas
3. Click em notificação: PATCH /notifications/{id}/read
4. Navegar para recurso relacionado (se aplicável)
```

---

## 📱 COMPONENTES SUGERIDOS PARA REACT

### DashboardCard
```jsx
<DashboardCard 
  title="Painéis Ativos"
  value={dashboard.billboards.active}
  total={dashboard.billboards.total}
  icon={<BillboardIcon />}
/>
```

### BillboardMap
```jsx
<BillboardMap 
  geojsonUrl="/geospatial/billboards/geojson"
  onMarkerClick={(billboard) => navigate(`/billboards/${billboard.id}`)}
/>
```

### PaymentBreakdown
```jsx
<PaymentBreakdown 
  debt={debtCalculation}
  onSubmit={(file) => submitPayment(billboardId, file)}
/>
```

### NotificationBell
```jsx
<NotificationBell 
  unreadCount={notifications.unread}
  notifications={notifications.recent}
  onRead={(id) => markAsRead(id)}
/>
```

---

## 🚀 PRÓXIMAS FEATURES

- ✅ Login & Autenticação
- ✅ Dashboard
- ✅ Painéis com detalhes completos
- ✅ Cálculo de dívida
- ✅ Workflow de pagamento
- ✅ Notificações automáticas
- 🔄 **PDFs de faturas** (em desenvolvimento)
- ⏳ Email automático
- ⏳ Webhooks para integrações

---

**Documentação gerada em:** 02/12/2025  
**Versão da API:** 2.0.0  
**Suporte:** dev@municipio-maputo.gov.mz
