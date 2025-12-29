# 🔌 API Endpoints - Referência Rápida

Base URL: `http://localhost:3001/api/v1`

---

## 🔐 Autenticação

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| POST | `/auth/login` | Público | Login com email/senha |
| POST | `/auth/register` | Público | Registrar novo usuário |
| POST | `/auth/refresh` | Público | Renovar access token |
| POST | `/auth/logout` | Autenticado | Logout do sistema |
| GET | `/auth/profile` | Autenticado | Perfil do usuário atual |

---

## 📊 Dashboard

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/dashboard` | Todos | Dashboard (auto-detecta role) |
| GET | `/dashboard/client` | CLIENT | Dashboard do cliente |
| GET | `/dashboard/admin` | ADMIN, FINANCE | Dashboard administrativo |

---

## 🏢 Painéis (Billboards)

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/billboards` | Todos | Listar painéis (auto-filtra por cliente) |
| GET | `/billboards/:id` | Todos | Detalhes do painel + histórico |
| GET | `/billboards/nearby` | Todos | Painéis próximos (lat, lng, radius) |
| POST | `/billboards` | ADMIN, TECH | Criar novo painel |
| PATCH | `/billboards/:id` | ADMIN, TECH | Editar painel |
| PATCH | `/billboards/:id/status` | ADMIN, FINANCE | Alterar status |
| DELETE | `/billboards/:id` | ADMIN | Soft delete |
| PATCH | `/billboards/:id/restore` | ADMIN | Restaurar painel deletado |
| DELETE | `/billboards/:id/permanent` | ADMIN | Hard delete permanente |

**Query Params** (`/billboards`):
- `status`: active, pending, suspended, in_debt, inactive
- `clientId`: UUID do cliente
- `district`: Nome do distrito
- `type`: outdoor, billboard, totem, digital, etc.

---

## 💰 Pagamentos

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/payments` | Todos | Listar pagamentos (auto-filtra) |
| GET | `/payments/:id` | Todos | Detalhes do pagamento |
| POST | `/payments` | Todos | Criar pagamento |
| POST | `/payments/with-proof` | Todos | Pagamento com comprovativo |
| POST | `/payments/submit-with-debt-calculation/:billboardId` | CLIENT | Submeter pagamento com cálculo automático |
| PATCH | `/payments/:id/attach-proof` | Todos | Anexar comprovativo |
| PATCH | `/payments/:id/validate` | ADMIN, FINANCE | Validar pagamento |
| PATCH | `/payments/:id/reject` | ADMIN, FINANCE | Rejeitar pagamento |
| GET | `/payments/calculate-debt/:billboardId` | Todos | Calcular dívida atual |
| GET | `/payments/my-debt-summary` | CLIENT | Resumo de dívidas do cliente |

**Query Params** (`/payments`):
- `clientId`: UUID do cliente
- `status`: pending, validated, rejected, expired

---

## 📄 Faturas (Invoices)

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/invoices` | Todos | Listar faturas (auto-filtra) |
| GET | `/invoices/:id` | Todos | Detalhes da fatura |
| GET | `/invoices/download/:filename` | Todos | Download do PDF |
| POST | `/invoices` | ADMIN, FINANCE | Criar fatura |

---

## 📊 Relatórios

### Visualização JSON

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/reports/revenue` | ADMIN, FINANCE, CLIENT | Relatório de receita |
| GET | `/reports/billboards-in-debt` | ADMIN, FINANCE, CLIENT | Painéis em dívida |
| GET | `/reports/billboards-by-district` | Todos | Distribuição por distrito |
| GET | `/reports/client-statistics` | ADMIN, FINANCE, CLIENT | Estatísticas de clientes |

**Query Params**:
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD

### Exportação CSV

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/reports/revenue/export/csv` | ADMIN, FINANCE | ⬇️ CSV de receita |
| GET | `/reports/billboards-in-debt/export/csv` | ADMIN, FINANCE | ⬇️ CSV de dívidas |
| GET | `/reports/billboards-by-district/export/csv` | ADMIN, FINANCE | ⬇️ CSV por distrito |
| GET | `/reports/client-statistics/export/csv` | ADMIN, FINANCE | ⬇️ CSV de clientes |
| GET | `/reports/payments/export/csv` | ADMIN, FINANCE | ⬇️ CSV de pagamentos |

### Exportação PDF

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/reports/revenue/export/pdf` | ADMIN, FINANCE | 📄 PDF de receita |
| GET | `/reports/billboards-in-debt/export/pdf` | ADMIN, FINANCE | 📄 PDF de dívidas |
| GET | `/reports/payments/export/pdf` | ADMIN, FINANCE | 📄 PDF de pagamentos |

---

## 🔔 Notificações

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/notifications` | Todos | Notificações do usuário |
| POST | `/notifications` | ADMIN, FINANCE | Criar notificação manual |
| PATCH | `/notifications/:id/read` | Todos | Marcar como lida |
| POST | `/notifications/mark-all-read` | Todos | Marcar todas como lidas |
| DELETE | `/notifications/:id` | Todos | Deletar notificação |

**Query Params** (`/notifications`):
- `onlyUnread`: true/false

---

## 👥 Clientes

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/clients` | ADMIN, FINANCE | Listar todos os clientes |
| GET | `/clients/:id` | Todos | Detalhes do cliente |
| POST | `/clients` | ADMIN | Criar cliente |
| PATCH | `/clients/:id` | ADMIN, FINANCE | Editar cliente |
| DELETE | `/clients/:id` | ADMIN | Deletar cliente |

---

## 🗺️ Geoespacial

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/geospatial/billboards/geojson` | Todos | GeoJSON de todos os painéis |
| GET | `/geospatial/tariff-zones/geojson` | Todos | GeoJSON das zonas tarifárias |
| POST | `/geospatial/billboards/in-polygon` | ADMIN, TECH | Painéis dentro de polígono |
| GET | `/geospatial/distance` | Todos | Calcular distância entre pontos |

**Query Params** (`/geospatial/distance`):
- `fromLon`, `fromLat`: Coordenadas de origem
- `toLon`, `toLat`: Coordenadas de destino

---

## 💵 Tarifas

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/tariffs` | Todos | Listar tarifas |
| GET | `/tariffs/:id` | Todos | Detalhes da tarifa |
| POST | `/tariffs` | ADMIN, FINANCE | Criar tarifa |
| PATCH | `/tariffs/:id` | ADMIN, FINANCE | Editar tarifa |

---

## 🗺️ Zonas Tarifárias

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/tariff-zones` | Todos | Listar zonas |
| GET | `/tariff-zones/:id` | Todos | Detalhes da zona |
| POST | `/tariff-zones` | ADMIN | Criar zona |
| PATCH | `/tariff-zones/:id` | ADMIN | Editar zona |

---

## 📋 Auditoria

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/audit` | ADMIN | Logs de auditoria |
| GET | `/audit/entity/:entityType/:entityId` | ADMIN | Histórico de entidade específica |

**Query Params** (`/audit`):
- `userId`: UUID do usuário
- `action`: create, update, delete, etc.
- `entityType`: billboard, payment, client, etc.
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD

---

## 📤 Uploads

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| POST | `/uploads` | Todos | Upload de arquivo |
| GET | `/uploads/:filename` | Todos | Download de arquivo |

---

## 🏥 Health Check

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/health` | Público | Status do sistema |
| GET | `/health/database` | Público | Status do banco de dados |

---

## 📝 Exemplos de Requisições

### Login
```javascript
const response = await fetch('http://localhost:3001/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  })
});

const { accessToken, refreshToken, user } = await response.json();
```

### Listar Painéis do Cliente
```javascript
const response = await fetch('http://localhost:3001/api/v1/billboards', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const billboards = await response.json();
```

### Submeter Pagamento com Comprovativo
```javascript
const formData = new FormData();
formData.append('billboardId', 'billboard-uuid');
formData.append('file', fileInput.files[0]);

const response = await fetch(
  `http://localhost:3001/api/v1/payments/submit-with-debt-calculation/${billboardId}`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  }
);
```

### Exportar Relatório CSV
```javascript
const response = await fetch(
  'http://localhost:3001/api/v1/reports/revenue/export/csv?startDate=2025-01-01&endDate=2025-12-31',
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'revenue-report.csv';
a.click();
```

### Obter Dados para Mapa
```javascript
const response = await fetch(
  'http://localhost:3001/api/v1/geospatial/billboards/geojson',
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);

const geojson = await response.json();
// Use com Leaflet, Mapbox, etc.
```

---

## 🔒 Headers Obrigatórios

### Autenticação
```
Authorization: Bearer {accessToken}
```

### Content-Type (POST/PATCH)
```
Content-Type: application/json
```

### Multipart (Upload de Arquivos)
```
Content-Type: multipart/form-data
```

---

## ⚠️ Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado |
| 400 | Bad Request (dados inválidos) |
| 401 | Não autenticado |
| 403 | Não autorizado (sem permissão) |
| 404 | Não encontrado |
| 409 | Conflito (ex: email já existe) |
| 500 | Erro interno do servidor |

---

## 🎯 Filtros por Role

### CLIENT
- Vê apenas seus próprios painéis
- Vê apenas seus próprios pagamentos
- Vê apenas suas próprias faturas
- Pode submeter pagamentos
- Recebe notificações automáticas

### ADMIN
- Acesso total a todos os recursos
- Pode validar/rejeitar pagamentos
- Pode criar/editar/deletar painéis
- Pode gerenciar clientes
- Acesso a auditoria completa

### FINANCE
- Acesso a relatórios financeiros
- Pode validar/rejeitar pagamentos
- Pode editar clientes
- Acesso a exportações

### TECHNICIAN
- Pode criar/editar painéis
- Pode atualizar status técnico
- Acesso limitado a financeiro

---

## 📚 Documentação Adicional

- **Swagger UI**: `http://localhost:3001/api/docs`
- **OpenAPI JSON**: `http://localhost:3001/api/docs-json`
- **Testing Guide**: Ver `TESTING_GUIDE.md`
- **Project Status**: Ver `PROJECT_STATUS.md`

---

**🚀 API pronta para integração com frontend!**
