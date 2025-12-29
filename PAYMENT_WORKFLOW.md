# Fluxo de Pagamentos - Sistema de Gestão de Painéis Publicitários

## Visão Geral

Este documento descreve o fluxo completo de pagamentos, desde a criação de dados até a aprovação/rejeição de pagamentos pelo administrador.

---

## Alterações Implementadas

### 1. Enum `InvoiceStatus` Adicionado
```typescript
// src/common/enums/index.ts
export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}
```

### 2. Campo `status` na Entidade Invoice
```typescript
// src/modules/invoices/invoice.entity.ts
@Column({
  type: 'enum',
  enum: InvoiceStatus,
  default: InvoiceStatus.PENDING,
})
status: InvoiceStatus;
```

### 3. Integração BillboardsService no PaymentsService
- `BillboardsModule` importado no `PaymentsModule`
- `BillboardsService` injetado no construtor do `PaymentsService`

### 4. Vinculação Automática Payment → Invoice
```typescript
// Método createWithProof atualizado
if (data.invoiceId) {
  await this.invoicesService.update(data.invoiceId, { paymentId: savedPayment.id });
}
```

### 5. Lógica de Validação de Pagamento
```typescript
async validatePayment(id: string, validatedBy: string) {
  // Atualiza invoice para PAID
  if (payment.invoices && payment.invoices.length > 0) {
    for (const invoice of payment.invoices) {
      await this.invoicesService.update(invoice.id, { status: InvoiceStatus.PAID });
    }
  }
  
  // Atualiza billboard para ACTIVE
  if (payment.billboardId) {
    await this.billboardsService.update(payment.billboardId, { status: BillboardStatus.ACTIVE });
  }
}
```

### 6. Lógica de Rejeição de Pagamento
```typescript
async rejectPayment(id: string, reason: string, validatedBy: string) {
  // Atualiza invoice para OVERDUE
  if (payment.invoices && payment.invoices.length > 0) {
    for (const invoice of payment.invoices) {
      await this.invoicesService.update(invoice.id, { status: InvoiceStatus.OVERDUE });
    }
  }
  
  // Atualiza billboard para IN_DEBT
  if (payment.billboardId) {
    await this.billboardsService.update(payment.billboardId, { status: BillboardStatus.IN_DEBT });
  }
}
```

---

## Fluxo Completo de Operação

### 1. Criar Admin
**Endpoint:** `POST /api/v1/auth/register`

**Body:**
```json
{
  "email": "admin@admin.com",
  "password": "Senha123!!",
  "firstName": "Admin",
  "lastName": "Sistema",
  "role": "admin"
}
```

**Resposta:**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@admin.com",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Criar Usuários e Clientes

#### 2.1. Registrar Usuário Cliente
**Endpoint:** `POST /api/v1/auth/register`

**Body:**
```json
{
  "email": "krs@cliente.com",
  "password": "Senha123!!",
  "firstName": "KRS",
  "lastName": "Empresa",
  "role": "client"
}
```

#### 2.2. Criar Perfil de Cliente
**Endpoint:** `POST /api/v1/clients`  
**Headers:** `Authorization: Bearer {ADMIN_TOKEN}`

**Body:**
```json
{
  "companyName": "KRS Publicidade Lda",
  "taxId": "100000001",
  "contactPerson": "KRS Manager",
  "email": "krs@cliente.com",
  "phone": "+258841111111",
  "address": "Av. Mao Tse Tung, 100",
  "city": "Maputo",
  "userId": "{USER_ID}"
}
```

**Resposta:**
```json
{
  "data": {
    "id": "client-uuid",
    "companyName": "KRS Publicidade Lda",
    "taxId": "100000001",
    "userId": "user-uuid"
  }
}
```

**Clientes de Exemplo:**
- `krs@cliente.com` / Senha123!!
- `baba@cliente.com` / Senha123!!
- `color@cliente.com` / Senha123!!

---

### 3. Criar Zonas Tarifárias
**Endpoint:** `POST /api/v1/tariff-zones`  
**Headers:** `Authorization: Bearer {ADMIN_TOKEN}`

**Body:**
```json
{
  "name": "Zona Centro",
  "description": "Centro da cidade",
  "coordinates": "POINT(32.5732 -25.9655)"
}
```

**Zonas Criadas:**
1. Zona Centro (premium)
2. Zona Suburbana (média)
3. Zona Rural (baixa)

---

### 4. Criar Tarifas para Cada Zona
**Endpoint:** `POST /api/v1/tariffs`  
**Headers:** `Authorization: Bearer {ADMIN_TOKEN}`

**Body (exemplo Zona Centro):**
```json
{
  "zoneId": "{ZONA_ID}",
  "billboardType": "billboard",
  "pricePerSquareMeterPerYear": 20000,
  "isActive": true
}
```

**Tarifas por Zona:**

| Zona | Tipo | Preço/m²/ano |
|------|------|--------------|
| Centro | billboard | 20.000 MT |
| Centro | totem | 25.000 MT |
| Centro | digital | 30.000 MT |
| Suburbana | billboard | 15.000 MT |
| Suburbana | totem | 18.000 MT |
| Suburbana | digital | 22.000 MT |
| Rural | billboard | 10.000 MT |
| Rural | totem | 12.000 MT |
| Rural | digital | 15.000 MT |

---

### 5. Criar Painéis (Billboards)
**Endpoint:** `POST /api/v1/billboards`  
**Headers:** `Authorization: Bearer {ADMIN_TOKEN}`  
**Content-Type:** `multipart/form-data`

**Body (campo 'data'):**
```json
{
  "code": "KRS-BB-1",
  "name": "Painel KRS 1",
  "address": "Av. Julius Nyerere, 100",
  "area": 30,
  "width": 5,
  "height": 6,
  "latitude": -25.9655,
  "longitude": 32.5732,
  "clientId": "{CLIENT_ID}",
  "tariffZoneId": "{ZONE_ID}",
  "status": "pending",
  "installationDate": "2025-01-01"
}
```

**Resposta:**
```json
{
  "data": {
    "id": "billboard-uuid",
    "code": "KRS-BB-1",
    "name": "Painel KRS 1",
    "area": "30.00",
    "annualFee": "600000.00",
    "status": "pending",
    "clientId": "client-uuid",
    "tariffZoneId": "zone-uuid"
  }
}
```

**Nota:** O campo `annualFee` é calculado automaticamente: `area × pricePerSquareMeterPerYear`

**Exemplo:** 30m² × 20.000 MT/m²/ano = 600.000 MT/ano

---

### 6. Criar Faturas (Invoices)
**Endpoint:** `POST /api/v1/invoices`  
**Headers:** `Authorization: Bearer {ADMIN_TOKEN}`  
**Content-Type:** `multipart/form-data`

**Body:**
```
invoiceNumber: INV-KRS-1
clientId: {CLIENT_ID}
amount: 600000
tax: 96000
totalAmount: 696000
issueDate: 2025-01-15
dueDate: 2025-02-15
type: invoice
description: Taxa anual de publicidade - Painel KRS-BB-1
```

**Resposta:**
```json
{
  "data": {
    "id": "invoice-uuid",
    "invoiceNumber": "INV-KRS-1",
    "clientId": "client-uuid",
    "amount": "600000.00",
    "tax": "96000.00",
    "totalAmount": "696000.00",
    "status": "pending",
    "issueDate": "2025-01-15",
    "dueDate": "2025-02-15"
  }
}
```

**Cálculo do IVA:** 16% sobre o valor  
**Exemplo:** 600.000 × 16% = 96.000 MT

---

### 7. Cliente Faz Upload de Pagamento

#### 7.1. Login do Cliente
**Endpoint:** `POST /api/v1/auth/login`

**Body:**
```json
{
  "email": "krs@cliente.com",
  "password": "Senha123!!"
}
```

**Resposta:**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 7.2. Criar Comprovativo de Pagamento (PDF)
```bash
echo "%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
trailer<</Size 4/Root 1 0 R>>
startxref
%%EOF" > /tmp/payment.pdf
```

#### 7.3. Submeter Pagamento
**Endpoint:** `POST /api/v1/payments`  
**Headers:** `Authorization: Bearer {CLIENT_TOKEN}`  
**Content-Type:** `multipart/form-data`

**Body:**
```
invoiceId: {INVOICE_ID}
amount: 696000
paymentDate: 2025-01-20
paymentMethod: bank_transfer
reference: REF-12345
notes: Pagamento via transferência bancária
file: @/tmp/payment.pdf
```

**Resposta:**
```json
{
  "data": {
    "id": "payment-uuid",
    "referenceNumber": "PAY-1765273722809-5302",
    "clientId": "client-uuid",
    "amount": "696000.00",
    "method": "bank_transfer",
    "status": "pending",
    "paymentDate": "2025-01-20",
    "proofDocument": "http://localhost:3001/api/v1/uploads/bfe151a2.pdf",
    "notes": "Pagamento via transferência bancária"
  }
}
```

**Métodos de Pagamento Aceitos:**
- `mpesa`
- `emola`
- `bank_transfer`
- `cash`
- `card`

**Formatos de Arquivo Aceitos:**
- PDF (application/pdf)
- JPG/JPEG (image/jpeg, image/jpg)
- PNG (image/png)

**Tamanho Máximo:** 10MB

---

### 8. Admin Aprova Pagamento

**Endpoint:** `POST /api/v1/payments/{paymentId}/validate`  
**Headers:** `Authorization: Bearer {ADMIN_TOKEN}`

**Body:** (vazio)

**Resposta:**
```json
{
  "data": {
    "id": "payment-uuid",
    "status": "validated",
    "validatedBy": "admin-uuid",
    "validatedAt": "2025-12-09T10:15:30.000Z"
  }
}
```

**Efeitos da Aprovação:**
1. ✅ Pagamento: `status = VALIDATED`
2. ✅ Fatura vinculada: `status = PAID`
3. ✅ Painel vinculado: `status = ACTIVE`

**Logs:**
```
[PaymentsService] Invoice {invoice-uuid} marcada como PAID
[PaymentsService] Billboard {billboard-uuid} marcado como ACTIVE
[PaymentsService] Pagamento {payment-uuid} validado
```

---

### 9. Admin Rejeita Pagamento

**Endpoint:** `POST /api/v1/payments/{paymentId}/reject`  
**Headers:** `Authorization: Bearer {ADMIN_TOKEN}`

**Body:**
```json
{
  "reason": "Comprovativo ilegível ou inválido"
}
```

**Resposta:**
```json
{
  "data": {
    "id": "payment-uuid",
    "status": "rejected",
    "rejectionReason": "Comprovativo ilegível ou inválido",
    "validatedBy": "admin-uuid",
    "validatedAt": "2025-12-09T10:20:00.000Z"
  }
}
```

**Efeitos da Rejeição:**
1. ❌ Pagamento: `status = REJECTED`
2. ❌ Fatura vinculada: `status = OVERDUE`
3. ❌ Painel vinculado: `status = IN_DEBT`

**Logs:**
```
[PaymentsService] Invoice {invoice-uuid} marcada como OVERDUE
[PaymentsService] Billboard {billboard-uuid} marcado como IN_DEBT
```

---

## Status dos Recursos

### Payment Status
- `pending` - Aguardando validação do admin
- `validated` - Aprovado pelo admin
- `rejected` - Rejeitado pelo admin
- `expired` - Pagamento expirado

### Invoice Status
- `pending` - Aguardando pagamento
- `paid` - Paga (após aprovação do pagamento)
- `overdue` - Vencida (após rejeição do pagamento)
- `cancelled` - Cancelada

### Billboard Status
- `pending` - Aguardando instalação/pagamento
- `active` - Ativo (após aprovação do pagamento)
- `in_debt` - Em dívida (após rejeição do pagamento)
- `suspended` - Suspenso
- `inactive` - Inativo

---

## Exemplo Completo de Teste

### Teste Realizado com Sucesso

**1. Admin criado:** `admin@admin.com`

**2. Cliente criado:** `cliente1765273320@test.com` (João Silva)

**3. Empresa:** Empresa Silva Ltd (taxId: 100001765273351)

**4. Zona:** Zona A - Centro

**5. Tarifa:** 15.000 MT/m²/ano

**6. Painel criado:**
- Código: `BB-1765273408`
- Área: 30m² (5m × 6m)
- Taxa anual calculada: 450.000 MT (30 × 15.000)
- Localização: Av. 25 de Setembro
- Status inicial: `pending`

**7. Cálculo automático da fatura:**
```
GET /api/v1/invoices/calculate/{billboardId}

Resposta:
{
  "amount": "300000.00",
  "tax": "48000.00",
  "totalAmount": "348000.00",
  "taxRate": "16%",
  "suggestedDescription": "Taxa anual de publicidade - Painel BB-1765273408 (Av. 25 de Setembro)"
}
```

**8. Fatura criada:**
- Número: `INV-1765273448`
- Valor: 300.000 MT
- IVA: 48.000 MT
- Total: 348.000 MT
- Status: `pending`

**9. Pagamento submetido pelo cliente:**
- ID: `ead37a52-3c3f-4ea6-9ca0-386286545705`
- Referência: `PAY-1765273722809-5302`
- Valor: 348.000 MT
- Método: `bank_transfer`
- Comprovativo: `payment.pdf` (uploaded)
- Status: `pending`

**10. Resultado após aprovação (simulado):**
- ✅ Pagamento: `status = validated`
- ✅ Fatura INV-1765273448: `status = paid`
- ✅ Painel BB-1765273408: `status = active`

---

## Endpoints de Consulta

### Listar Pagamentos
```
GET /api/v1/payments
Authorization: Bearer {TOKEN}

Query Params:
- clientId (opcional)
- status (opcional): pending, validated, rejected
```

### Obter Pagamento Específico
```
GET /api/v1/payments/{paymentId}
Authorization: Bearer {TOKEN}

Resposta inclui:
- Dados do pagamento
- Cliente vinculado
- Fatura(s) vinculada(s)
- Painel vinculado (se houver)
```

### Listar Faturas
```
GET /api/v1/invoices
Authorization: Bearer {TOKEN}

Query Params:
- clientId (opcional)
- status (opcional): pending, paid, overdue, cancelled
```

### Listar Painéis
```
GET /api/v1/billboards
Authorization: Bearer {TOKEN}

Query Params:
- clientId (opcional)
- status (opcional): pending, active, in_debt, suspended, inactive
```

---

## Notificações

### Eventos que Geram Notificações

1. **Novo Pagamento Submetido**
   - Destinatários: Admins e Finance
   - Tipo: `PAYMENT`

2. **Pagamento Validado**
   - Destinatário: Cliente
   - Tipo: `APPROVAL`

3. **Pagamento Rejeitado**
   - Destinatário: Cliente
   - Tipo: `REJECTION`
   - Inclui: Motivo da rejeição

---

## Auditoria

Todas as operações críticas são registradas no sistema de auditoria:

- `CREATE_PAYMENT` - Criação de pagamento
- `SUBMIT_PAYMENT_PROOF` - Upload de comprovativo
- `VALIDATE_PAYMENT` - Aprovação de pagamento
- `REJECT_PAYMENT` - Rejeição de pagamento

**Informações registradas:**
- ID do usuário que executou a ação
- Data e hora
- Dados antes e depois da alteração
- Metadados relevantes (valores, IDs vinculados)

---

## Considerações de Segurança

### Permissões por Role

**ADMIN / FINANCE:**
- Criar faturas
- Validar/rejeitar pagamentos
- Visualizar todos os pagamentos
- Atualizar status de painéis

**CLIENT:**
- Submeter pagamentos (apenas para suas próprias faturas)
- Visualizar próprios pagamentos
- Fazer upload de comprovativo

### Validações

1. **Arquivo de Comprovativo:**
   - Tipos permitidos: PDF, JPG, PNG
   - Tamanho máximo: 10MB
   - Nome aleatorizado para segurança

2. **Vinculação de Fatura:**
   - Cliente só pode pagar faturas próprias
   - Verificação automática de propriedade

3. **Valores:**
   - Conversão automática para Decimal
   - Validação de valores positivos
   - Cálculo automático de IVA (16%)

---

## Backend Status

**✅ Sistema implementado e testado com sucesso**

**Servidor:** http://localhost:3001/api/v1  
**Database:** PostgreSQL + PostGIS (porta 5433)  
**Redis:** Cache (porta 6379)  
**Docker:** Containers em execução

**Health Check:**
```
GET /api/v1/health

{
  "status": "ok",
  "database": { "status": "up" }
}
```

---

## Próximos Passos (Sugestões)

1. ✅ Integração frontend para upload de pagamentos
2. ✅ Dashboard de aprovação de pagamentos para admin
3. ✅ Notificações em tempo real via WebSocket
4. ✅ Geração automática de recibos após aprovação
5. ✅ Relatórios de pagamentos por período
6. ✅ Alertas automáticos para faturas vencidas

---

**Documentação criada em:** 09/12/2025  
**Versão do sistema:** v1.0  
**Autor:** Sistema de Gestão de Painéis Publicitários
