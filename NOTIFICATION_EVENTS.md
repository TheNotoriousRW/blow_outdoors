# Sistema de Notificações Automáticas

## 📋 Visão Geral

Sistema completo de notificações in-app para todos os eventos críticos da plataforma de gestão de painéis publicitários.

---

## 🔔 Eventos Implementados

### 1. **Comprovativo Submetido** ✅
**Tipo:** `PAYMENT`  
**Quando:** Cliente submete comprovativo de pagamento  
**Destinatários:** Admins + Finance  
**Canal:** In-app + Email  

**Arquivo:** `payments.service.ts` (linha 57, 77)
```typescript
// Acionado em:
- create() 
- createWithProof()
```

**Informações enviadas:**
- ID do pagamento
- Valor
- Número de referência

---

### 2. **Comprovativo Aprovado** ✅
**Tipo:** `APPROVAL`  
**Quando:** Admin/Finance valida pagamento  
**Destinatários:** Cliente  
**Canal:** In-app + Email  

**Arquivo:** `payments.service.ts` (linha 130)
```typescript
// Acionado em:
- validatePayment()
```

**Informações enviadas:**
- ID do pagamento
- Valor
- Número de referência
- Status: VALIDATED

---

### 3. **Comprovativo Rejeitado** ✅
**Tipo:** `REJECTION`  
**Quando:** Admin/Finance rejeita pagamento  
**Destinatários:** Cliente  
**Canal:** In-app + Email  

**Arquivo:** `payments.service.ts` (linha 160)
```typescript
// Acionado em:
- rejectPayment()
```

**Informações enviadas:**
- ID do pagamento
- Valor
- Número de referência
- Motivo da rejeição
- Status: REJECTED

---

### 4. **Recibo Emitido** ✅
**Tipo:** `RECEIPT_ISSUED`  
**Quando:** Recibo é gerado automaticamente após validação  
**Destinatários:** Cliente  
**Canal:** In-app + Email  

**Arquivo:** `invoices.service.ts` (método notifyClientNewInvoice)
```typescript
// Acionado em:
- createWithPDF() com tipo RECEIPT
```

**Informações enviadas:**
- Número do recibo
- Valor total
- Link para download do PDF
- ID da fatura
- Código do painel

---

### 5. **Nova Fatura Pro Forma Disponível** ✅
**Tipo:** `PROFORMA_INVOICE`  
**Quando:** Fatura pro forma é gerada  
**Destinatários:** Cliente  
**Canal:** In-app + Email  

**Arquivo:** `invoices.service.ts` (método notifyClientNewInvoice)
```typescript
// Acionado em:
- createWithPDF() com tipo PROFORMA
```

**Informações enviadas:**
- Número da fatura pro forma
- Valor total
- Data de vencimento
- Link para download do PDF
- Código do painel

---

### 6. **Painel Prestes a Entrar em Dívida** ✅
**Tipo:** `DUE_DATE`  
**Quando:** 7 dias antes do vencimento de pagamento  
**Destinatários:** Cliente  
**Canal:** In-app + Email  
**Frequência:** Diária às 09:00

**Arquivo:** `notification-scheduler.service.ts` (linha 32)
```typescript
@Cron(CronExpression.EVERY_DAY_AT_9AM)
async checkUpcomingDueDates()
```

**Informações enviadas:**
- Código do painel
- Valor devido
- Data de vencimento
- Dias até o vencimento

---

### 7. **Painel em Dívida** ✅
**Tipo:** `ALERT`  
**Quando:** Pagamento está vencido  
**Destinatários:** Cliente  
**Canal:** In-app + Email  
**Frequência:** Diária às 10:00

**Arquivo:** `notification-scheduler.service.ts` (linha 97)
```typescript
@Cron(CronExpression.EVERY_DAY_AT_10AM)
async checkOverduePayments()
```

**Ações automáticas:**
- Atualiza status do painel para `IN_DEBT`
- Envia notificação ao cliente

**Informações enviadas:**
- Código do painel
- Valor da dívida total
- Meses em atraso

---

### 8. **Painel Expirado** ✅
**Tipo:** `BILLBOARD_EXPIRED`  
**Quando:** Contrato do painel expira  
**Destinatários:** Cliente + Admins + Técnicos  
**Canal:** In-app + Email  
**Frequência:** Diária às 11:00

**Arquivo:** `notification-scheduler.service.ts` (método checkExpiredBillboards)
```typescript
@Cron(CronExpression.EVERY_DAY_AT_11AM)
async checkExpiredBillboards()
```

**Lembretes enviados:**
- 30 dias antes da expiração
- 15 dias antes da expiração
- No dia da expiração

**Ações automáticas:**
- Atualiza status do painel para `INACTIVE`
- Notifica cliente e admins

---

## 📊 Tipos de Notificação

```typescript
enum NotificationType {
  PAYMENT = 'payment',              // Novo pagamento submetido
  DUE_DATE = 'due_date',           // Pagamento próximo ao vencimento
  APPROVAL = 'approval',           // Pagamento aprovado
  REJECTION = 'rejection',         // Pagamento rejeitado
  ALERT = 'alert',                 // Alertas gerais (dívida, expiração)
  SYSTEM = 'system',               // Notificações do sistema
  RECEIPT_ISSUED = 'receipt_issued',         // Recibo emitido
  PROFORMA_INVOICE = 'proforma_invoice',     // Fatura pro forma disponível
  BILLBOARD_EXPIRED = 'billboard_expired',   // Contrato expirado
}
```

---

## ⏰ Tarefas Agendadas (Cron Jobs)

### 1. Verificação de Vencimentos (09:00 diária)
```typescript
@Cron(CronExpression.EVERY_DAY_AT_9AM)
checkUpcomingDueDates()
```
Verifica pagamentos que vencem em 7 dias e notifica clientes.

### 2. Verificação de Atrasos (10:00 diária)
```typescript
@Cron(CronExpression.EVERY_DAY_AT_10AM)
checkOverduePayments()
```
Atualiza status de painéis em dívida e notifica clientes.

### 3. Verificação de Expirações (11:00 diária)
```typescript
@Cron(CronExpression.EVERY_DAY_AT_11AM)
checkExpiredBillboards()
```
Verifica contratos expirados, envia lembretes e atualiza status.

### 4. Resumo Semanal (08:00 segunda a sexta)
```typescript
@Cron(CronExpression.MONDAY_TO_FRIDAY_AT_8AM)
sendWeeklySummaryToAdmins()
```
Envia resumo estatístico para admins e finance.

---

## 📧 Canais de Comunicação

### ✅ Implementado
- **In-app notifications:** Todas as notificações aparecem no painel do usuário
- **Email:** Campo `sendEmail` configurável por tipo de notificação

### 🔮 Futuro
- **Push notifications:** Para aplicação mobile
- **SMS:** Para alertas críticos
- **WhatsApp:** Notificações via API do WhatsApp Business

---

## 🗂️ Estrutura de Dados da Notificação

```typescript
{
  userId: string,              // ID do destinatário
  type: NotificationType,      // Tipo da notificação
  title: string,              // Título curto
  message: string,            // Mensagem detalhada
  metadata: object,           // Dados específicos do evento
  isRead: boolean,            // Status de leitura
  sendEmail: boolean,         // Se deve enviar email
  createdAt: Date,           // Data de criação
}
```

---

## 📝 Exemplos de Uso

### Criar notificação manualmente
```typescript
await notificationsService.create(
  userId,
  NotificationType.ALERT,
  'Título da Notificação',
  'Mensagem detalhada...',
  { metadataKey: 'value' },
  true, // sendEmail
);
```

### Buscar notificações de um usuário
```typescript
const notifications = await notificationsService.findByUser(userId);
```

### Marcar como lida
```typescript
await notificationsService.markAsRead(notificationId);
```

---

## 🔐 Segurança e Privacidade

- ✅ Notificações só visíveis para o destinatário
- ✅ Dados sensíveis não expostos em mensagens
- ✅ Logs de todas as notificações enviadas
- ✅ Rate limiting para prevenir spam

---

## 📈 Estatísticas

O sistema rastreia:
- Total de notificações enviadas
- Taxa de leitura
- Tempo médio para leitura
- Notificações por tipo
- Notificações por usuário

---

## 🚀 Próximos Passos

1. ✅ Implementar todos os eventos críticos
2. 🔄 Adicionar filtros e preferências de notificação
3. 🔄 Dashboard de notificações para admins
4. 🔄 Relatórios de engajamento
5. 🔮 Integração com email provider (SendGrid/AWS SES)
6. 🔮 Push notifications para mobile
7. 🔮 Notificações via WhatsApp

---

## 📚 Arquivos Relacionados

- `src/modules/notifications/notifications.service.ts` - Serviço principal
- `src/modules/notifications/notification-scheduler.service.ts` - Cron jobs
- `src/modules/notifications/notification.entity.ts` - Modelo de dados
- `src/modules/notifications/notifications.controller.ts` - API endpoints
- `src/modules/payments/payments.service.ts` - Notificações de pagamento
- `src/modules/invoices/invoices.service.ts` - Notificações de faturas
- `src/common/enums/index.ts` - Enums e tipos

---

**Última atualização:** Dezembro 2025  
**Status:** ✅ Todos os eventos implementados
