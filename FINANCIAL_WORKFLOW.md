# 💰 Workflow Financeiro Automático

## 📋 Visão Geral

Sistema completo de gestão financeira com cálculo automático de taxas, geração de faturas pro forma, validação de pagamentos e auditoria completa.

---

## 🔄 Fluxo Completo do Processo Financeiro

### **1️⃣ Criação de Painel → Cálculo de Taxa**

#### **Como Funciona:**
Quando um painel é criado, o sistema automaticamente:

1. **Identifica a tarifa aplicável** baseado em:
   - 🗺️ Zona tarifária (`tariffZoneId`)
   - 📐 Tamanho do painel (`size`: small, medium, large, extra_large)
   - 🎨 Tipo do painel (`type`: outdoor, billboard, totem, digital, illuminated)

2. **Calcula o valor mensal:**
   ```
   Valor Final = Taxa Base × Multiplicador da Zona
   ```

3. **Gera fatura pro forma automaticamente**

#### **Implementação:**

**Serviço: `TariffsService`**
```typescript
// Método: calculateMonthlyRate()
const rateInfo = await tariffsService.calculateMonthlyRate(
  tariffZoneId,
  billboardType,
  billboardSize
);

// Retorna:
{
  tariff: Tariff,
  baseRate: 10000,           // Taxa base da tarifa
  zoneMultiplier: 1.5,       // Multiplicador da zona
  calculatedRate: 15000      // Valor final = 10000 × 1.5
}
```

**Arquivo:** `apps/backend/src/modules/tariffs/tariffs.service.ts`

---

### **2️⃣ Geração Automática de Fatura Pro Forma**

#### **Quando é Gerada:**

##### **A) Painel Criado:**
- ✅ Automaticamente quando `billboards.create()` é executado
- ✅ Se painel tem `client` e `tariffZone`

##### **B) Período de Faturação:**
- ✅ Todo dia 1 de cada mês às 06:00 AM
- ✅ Cron job: `@Cron('0 6 1 * *')`
- ✅ Gera para todos os painéis com status `ACTIVE`

#### **Conteúdo da Fatura Pro Forma:**
```json
{
  "invoiceNumber": "PRO-2025-000001",
  "type": "proforma",
  "amount": 15000,
  "tax": 2400,              // IVA 16%
  "totalAmount": 17400,     // amount + tax
  "issueDate": "2025-12-02",
  "dueDate": "2026-01-01",  // 30 dias
  "lineItems": [
    {
      "description": "Taxa mensal - Painel PAINEL-001 (digital large)",
      "quantity": 1,
      "unitPrice": 15000,
      "total": 15000
    },
    {
      "description": "IVA (16%)",
      "quantity": 1,
      "unitPrice": 2400,
      "total": 2400
    }
  ],
  "metadata": {
    "billboardId": "uuid",
    "billboardCode": "PAINEL-001",
    "tariffId": "tariff-uuid",
    "baseRate": 10000,
    "zoneMultiplier": 1.5,
    "calculatedRate": 15000
  },
  "pdfUrl": "http://localhost:3001/api/uploads/PRO-2025-000001.pdf"
}
```

#### **Implementação:**

**Serviço: `ProformaGeneratorService`**
```typescript
// Geração manual (quando painel é criado):
await proformaGeneratorService.generateProformaForNewBillboard(billboardId);

// Geração automática mensal (cron job):
@Cron('0 6 1 * *')
async generateMonthlyProformas()
```

**Arquivo:** `apps/backend/src/modules/invoices/proforma-generator.service.ts`

#### **Notificação ao Cliente:**
- 📧 Tipo: `PROFORMA_INVOICE`
- 📄 Inclui link para download do PDF
- ✅ Email configurável

---

### **3️⃣ Cliente Faz Pagamento (Externo)**

#### **Fluxo:**
1. Cliente recebe fatura pro forma via notificação
2. Cliente faz pagamento no banco (externo ao sistema)
3. Cliente obtém comprovativo do banco (PDF/imagem)
4. Cliente acessa portal e submete comprovativo

#### **Submissão via Portal:**

**Endpoint:**
```http
POST /api/v1/payments/with-proof
Authorization: Bearer {client_token}
Content-Type: multipart/form-data

Form Data:
- referenceNumber: "PAY-2025-001"
- clientId: "uuid"
- billboardId: "uuid"
- amount: 17400
- method: "mpesa" | "emola" | "bank_transfer" | "cash" | "card"
- paymentDate: "2025-12-02"
- file: [PDF ou imagem do comprovativo]
```

**Resposta:**
```json
{
  "data": {
    "id": "payment-uuid",
    "referenceNumber": "PAY-2025-001",
    "amount": 17400,
    "status": "pending",
    "proofDocument": "http://localhost:3001/api/uploads/payment-proof-xxx.pdf",
    "createdAt": "2025-12-02T10:00:00Z"
  }
}
```

#### **O que Acontece Automaticamente:**
1. ✅ Pagamento criado com status `PENDING`
2. ✅ Comprovativo armazenado em `/uploads/payments/`
3. ✅ **Notificação enviada para Admins e Finance**
4. ✅ **Registro de auditoria criado** (`SUBMIT_PAYMENT_PROOF`)

**Arquivo:** `apps/backend/src/modules/payments/payments.service.ts` - `createWithProof()`

---

### **4️⃣ Admin Valida Pagamento**

#### **A) Se Aprovado:**

**Endpoint:**
```http
PATCH /api/v1/payments/{id}/validate
Authorization: Bearer {admin_token}
```

**O que Acontece Automaticamente:**

1. ✅ Status muda para `VALIDATED`
2. ✅ **Recibo é gerado automaticamente em PDF**
   ```typescript
   const invoice = await invoicesService.createWithPDF(payment, InvoiceType.RECEIPT);
   // Gera: REC-2025-000001.pdf
   ```
3. ✅ **Cliente recebe notificação** (`RECEIPT_ISSUED`)
   - Tipo: `receipt_issued`
   - Inclui link para download do recibo
4. ✅ **Registro de auditoria criado** (`VALIDATE_PAYMENT`)

**Auditoria Registra:**
```json
{
  "action": "VALIDATE_PAYMENT",
  "entityType": "Payment",
  "entityId": "payment-uuid",
  "oldValues": { "status": "pending" },
  "newValues": {
    "status": "validated",
    "amount": 17400,
    "referenceNumber": "PAY-2025-001",
    "clientId": "client-uuid"
  },
  "user": { "id": "admin-uuid" },
  "createdAt": "2025-12-02T14:30:00Z"
}
```

#### **B) Se Rejeitado:**

**Endpoint:**
```http
PATCH /api/v1/payments/{id}/reject
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "Comprovativo ilegível ou inválido"
}
```

**O que Acontece Automaticamente:**

1. ✅ Status muda para `REJECTED`
2. ✅ **Cliente recebe notificação** (`REJECTION`)
   - Tipo: `rejection`
   - Inclui motivo da rejeição
3. ✅ **Cliente pode reenviar comprovativo**
4. ✅ **Registro de auditoria criado** (`REJECT_PAYMENT`)

**Auditoria Registra:**
```json
{
  "action": "REJECT_PAYMENT",
  "entityType": "Payment",
  "entityId": "payment-uuid",
  "oldValues": { "status": "pending" },
  "newValues": {
    "status": "rejected",
    "rejectionReason": "Comprovativo ilegível ou inválido",
    "amount": 17400
  },
  "user": { "id": "admin-uuid" },
  "createdAt": "2025-12-02T14:35:00Z"
}
```

**Arquivo:** `apps/backend/src/modules/payments/payments.service.ts` - `validatePayment()` / `rejectPayment()`

---

### **5️⃣ Auditoria Completa**

#### **Todos os Passos Registados:**

| Ação | Quando | Entidade | Dados Registrados |
|------|--------|----------|-------------------|
| `CREATE_BILLBOARD` | Painel criado | Billboard | code, type, size, clientId |
| `GENERATE_PROFORMA` | Fatura pro forma gerada | Invoice | invoiceNumber, billboardCode, amount |
| `CREATE_PAYMENT` | Pagamento criado sem comprovativo | Payment | referenceNumber, amount, status |
| `SUBMIT_PAYMENT_PROOF` | Cliente submete comprovativo | Payment | referenceNumber, amount, proofDocument |
| `VALIDATE_PAYMENT` | Admin aprova pagamento | Payment | status: pending → validated |
| `REJECT_PAYMENT` | Admin rejeita pagamento | Payment | status: pending → rejected, reason |

#### **Ver Auditoria:**

**Endpoint:**
```http
GET /api/v1/audit?entityType=Payment&entityId={payment-id}
Authorization: Bearer {admin_token}
```

**Resposta:**
```json
{
  "data": [
    {
      "id": "audit-uuid-1",
      "action": "SUBMIT_PAYMENT_PROOF",
      "entityType": "Payment",
      "entityId": "payment-uuid",
      "user": {
        "id": "client-uuid",
        "email": "cliente@empresa.com",
        "firstName": "João"
      },
      "oldValues": null,
      "newValues": {
        "referenceNumber": "PAY-2025-001",
        "amount": 17400,
        "hasProof": true,
        "proofDocument": "http://..."
      },
      "createdAt": "2025-12-02T10:00:00Z"
    },
    {
      "id": "audit-uuid-2",
      "action": "VALIDATE_PAYMENT",
      "entityType": "Payment",
      "entityId": "payment-uuid",
      "user": {
        "id": "admin-uuid",
        "email": "admin@sistema.com",
        "firstName": "Admin"
      },
      "oldValues": { "status": "pending" },
      "newValues": {
        "status": "validated",
        "amount": 17400
      },
      "createdAt": "2025-12-02T14:30:00Z"
    }
  ]
}
```

**Arquivo:** `apps/backend/src/modules/audit/audit.service.ts`

---

## 📊 Diagrama do Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CRIAÇÃO DE PAINEL                                           │
├─────────────────────────────────────────────────────────────────┤
│ Admin cria painel                                               │
│    ↓                                                            │
│ Sistema calcula taxa (zona × tamanho × tipo)                   │
│    ↓                                                            │
│ Fatura pro forma gerada automaticamente                        │
│    ↓                                                            │
│ Cliente recebe notificação com PDF                             │
│    ↓                                                            │
│ [AUDIT] CREATE_BILLBOARD + GENERATE_PROFORMA                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 2. FATURAÇÃO MENSAL AUTOMÁTICA                                 │
├─────────────────────────────────────────────────────────────────┤
│ Cron job (dia 1 de cada mês às 06:00)                         │
│    ↓                                                            │
│ Busca painéis ativos                                           │
│    ↓                                                            │
│ Gera fatura pro forma para cada painel                         │
│    ↓                                                            │
│ Cliente recebe notificações                                     │
│    ↓                                                            │
│ [AUDIT] GENERATE_PROFORMA (para cada fatura)                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 3. CLIENTE SUBMETE PAGAMENTO                                    │
├─────────────────────────────────────────────────────────────────┤
│ Cliente faz pagamento no banco                                  │
│    ↓                                                            │
│ Cliente obtém comprovativo (PDF/imagem)                        │
│    ↓                                                            │
│ Cliente acessa portal e faz upload                             │
│    ↓                                                            │
│ Pagamento criado com status PENDING                            │
│    ↓                                                            │
│ Admin/Finance recebem notificação                              │
│    ↓                                                            │
│ [AUDIT] SUBMIT_PAYMENT_PROOF                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 4A. ADMIN APROVA PAGAMENTO                                      │
├─────────────────────────────────────────────────────────────────┤
│ Admin valida comprovativo                                       │
│    ↓                                                            │
│ Status muda para VALIDATED                                      │
│    ↓                                                            │
│ Recibo gerado automaticamente (PDF)                            │
│    ↓                                                            │
│ Cliente recebe notificação com recibo                          │
│    ↓                                                            │
│ [AUDIT] VALIDATE_PAYMENT                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 4B. ADMIN REJEITA PAGAMENTO                                     │
├─────────────────────────────────────────────────────────────────┤
│ Admin rejeita com motivo                                        │
│    ↓                                                            │
│ Status muda para REJECTED                                       │
│    ↓                                                            │
│ Cliente recebe notificação com motivo                          │
│    ↓                                                            │
│ Cliente pode reenviar comprovativo                             │
│    ↓                                                            │
│ [AUDIT] REJECT_PAYMENT                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configurações

### **Cálculo de Taxa:**
- Taxa base definida em `Tariff.monthlyPrice`
- Multiplicador da zona em `TariffZone.priceMultiplier`
- IVA fixo: 16%

### **Prazos:**
- Vencimento de fatura pro forma: 30 dias
- Geração mensal: Dia 1 às 06:00 AM

### **Arquivos:**
- Faturas pro forma: `/uploads/invoices/PRO-*.pdf`
- Recibos: `/uploads/invoices/REC-*.pdf`
- Comprovativos: `/uploads/payments/payment-proof-*.pdf`

---

## 🆕 Novos Serviços Criados

### **1. TariffsService - Métodos Adicionados:**
```typescript
// Encontrar tarifa aplicável
findApplicableTariff(tariffZoneId, billboardType, billboardSize)

// Calcular valor mensal
calculateMonthlyRate(tariffZoneId, billboardType, billboardSize)
```

### **2. ProformaGeneratorService (NOVO):**
```typescript
// Gerar fatura pro forma para painel
generateProformaForNewBillboard(billboardId)

// Cron job - Gerar faturas mensais
@Cron('0 6 1 * *')
generateMonthlyProformas()
```

### **3. AuditService - Eventos Adicionados:**
- `CREATE_BILLBOARD`
- `GENERATE_PROFORMA`
- `CREATE_PAYMENT`
- `SUBMIT_PAYMENT_PROOF`
- `VALIDATE_PAYMENT`
- `REJECT_PAYMENT`

---

## ✅ Checklist de Implementação

### **Backend:**
- [x] Cálculo automático de taxa
- [x] Geração de fatura pro forma ao criar painel
- [x] Cron job para faturação mensal
- [x] Endpoint de submissão de comprovativo
- [x] Validação de pagamento com geração de recibo
- [x] Rejeição de pagamento com notificação
- [x] Auditoria completa de todas as ações
- [x] Notificações para todos os eventos

### **Testado:**
- [ ] Criar painel → Gera fatura pro forma
- [ ] Cron job mensal funciona
- [ ] Cliente submete comprovativo
- [ ] Admin aprova → Gera recibo
- [ ] Admin rejeita → Cliente pode reenviar
- [ ] Auditoria registra todos os eventos

---

## 📚 Arquivos Modificados/Criados

### **Criados:**
1. `invoices/proforma-generator.service.ts` - Geração de faturas pro forma

### **Modificados:**
1. `tariffs/tariffs.service.ts` - Cálculo de taxa
2. `billboards/billboards.service.ts` - Integração com proforma
3. `billboards/billboards.module.ts` - Dependências
4. `payments/payments.service.ts` - Auditoria
5. `payments/payments.module.ts` - AuditModule
6. `invoices/invoice.entity.ts` - Campo metadata
7. `invoices/invoices.module.ts` - Novos módulos

---

**Status:** ✅ Workflow Financeiro 100% Implementado  
**Pronto para:** Testes e Deploy
