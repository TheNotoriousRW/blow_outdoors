# 🧪 Guia de Testes - Novas Funcionalidades

## 📝 Pré-requisitos

1. Backend rodando em `http://localhost:3001`
2. Token de autenticação de um usuário ADMIN
3. Alguns dados de teste no sistema (painéis, pagamentos, clientes)

---

## 🔐 Obter Token de Autenticação

```bash
# Login como ADMIN
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# Salve o accessToken retornado
export TOKEN="seu_token_aqui"
```

---

## 📊 1. Testar Exportação CSV de Relatórios

### Relatório de Receita
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/reports/revenue/export/csv?startDate=2025-01-01&endDate=2025-12-31" \
  -o revenue-report.csv

# Verificar arquivo gerado
cat revenue-report.csv
```

### Painéis em Dívida
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/reports/billboards-in-debt/export/csv" \
  -o billboards-in-debt.csv

cat billboards-in-debt.csv
```

### Distribuição por Distrito
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/reports/billboards-by-district/export/csv" \
  -o billboards-by-district.csv
```

### Estatísticas de Clientes
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/reports/client-statistics/export/csv" \
  -o client-statistics.csv
```

### Pagamentos Detalhados
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/reports/payments/export/csv?startDate=2025-01-01&endDate=2025-12-31" \
  -o payments-detailed.csv
```

---

## 📄 2. Testar Exportação PDF de Relatórios

### Relatório de Receita (PDF)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/reports/revenue/export/pdf?startDate=2025-01-01&endDate=2025-12-31" \
  -o revenue-report.pdf

# Abrir PDF no navegador padrão (Linux)
xdg-open revenue-report.pdf
```

### Painéis em Dívida (PDF)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/reports/billboards-in-debt/export/pdf" \
  -o billboards-in-debt.pdf

xdg-open billboards-in-debt.pdf
```

### Pagamentos Detalhados (PDF)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/reports/payments/export/pdf?startDate=2025-01-01&endDate=2025-12-31" \
  -o payments-detailed.pdf

xdg-open payments-detailed.pdf
```

---

## 🔔 3. Testar Sistema de Notificações Automáticas

### Verificar Logs do Scheduler
Os cron jobs executam automaticamente:
- **9:00 AM**: Verifica pagamentos próximos ao vencimento
- **10:00 AM**: Verifica pagamentos vencidos
- **8:00 AM** (Seg-Sex): Resumo semanal para admins

```bash
# Ver logs em tempo real
cd "/home/thenotoriousdev/Desktop/TheNotoriousDev/Blow Management/Gestão de paineis publicitarios/apps/backend"
npm run start:dev

# Procure por:
# [NotificationSchedulerService] Running scheduled check...
# [NotificationSchedulerService] Sent X notifications
```

### Simular Cenários de Teste

#### Cenário 1: Painel Próximo ao Vencimento
```bash
# 1. Criar painel com dívida
# 2. Aguardar execução do cron (9:00 AM) OU reiniciar servidor
# 3. Verificar notificações do cliente

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/notifications" | jq
```

#### Cenário 2: Painel em Dívida
```bash
# 1. Criar painel com pagamento vencido
# 2. Aguardar cron das 10:00 AM
# 3. Verificar se status mudou para IN_DEBT

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/billboards/BILLBOARD_ID" | jq '.status'
```

#### Cenário 3: Resumo Semanal para Admins
```bash
# Verificar notificações recebidas
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/notifications" | jq '.[] | select(.type == "system")'
```

---

## 🗑️ 4. Testar Sistema de Soft-Delete

### Criar Painel para Teste
```bash
curl -X POST http://localhost:3001/api/v1/billboards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST-001",
    "name": "Painel Teste Soft Delete",
    "type": "outdoor",
    "size": "medium",
    "address": "Avenida Teste, 123",
    "district": "KaMpfumo",
    "location": {
      "type": "Point",
      "coordinates": [-25.9667, 32.5833]
    }
  }'

# Salve o ID retornado
export BILLBOARD_ID="id_retornado"
```

### Soft Delete (Desativar)
```bash
curl -X DELETE http://localhost:3001/api/v1/billboards/$BILLBOARD_ID \
  -H "Authorization: Bearer $TOKEN"

# Resposta esperada:
# { "message": "Billboard deleted successfully (soft delete)" }
```

### Verificar que Painel NÃO Aparece em Listagens
```bash
# Lista todos os painéis ativos
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/billboards" | jq '.[] | select(.id == "'$BILLBOARD_ID'")'

# Não deve retornar nada
```

### Verificar no Mapa (GeoJSON)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/geospatial/billboards/geojson" \
  | jq '.features[] | select(.properties.id == "'$BILLBOARD_ID'")'

# Não deve aparecer
```

### Restaurar Painel
```bash
curl -X PATCH http://localhost:3001/api/v1/billboards/$BILLBOARD_ID/restore \
  -H "Authorization: Bearer $TOKEN"

# Resposta esperada:
# { "message": "Billboard restored successfully", "billboard": {...} }
```

### Verificar que Painel Reaparece
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/billboards" | jq '.[] | select(.id == "'$BILLBOARD_ID'")'

# Agora deve retornar o painel
```

### Hard Delete (Permanente - Use com Cuidado!)
```bash
curl -X DELETE http://localhost:3001/api/v1/billboards/$BILLBOARD_ID/permanent \
  -H "Authorization: Bearer $TOKEN"

# ATENÇÃO: Isto remove permanentemente do banco de dados!
```

---

## 📈 5. Testes Integrados - Workflow Completo

### Workflow: Cliente com Dívida → Notificação → Pagamento → Relatório

```bash
# 1. Criar cliente e painel
curl -X POST http://localhost:3001/api/v1/billboards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST-WORKFLOW-001",
    "name": "Painel Workflow Teste",
    "type": "outdoor",
    "size": "medium",
    "clientId": "SEU_CLIENT_ID",
    "address": "Av. Workflow, 456",
    "district": "KaMpfumo",
    "location": {"type": "Point", "coordinates": [-25.9667, 32.5833]},
    "installationDate": "2025-01-01"
  }'

export BILLBOARD_ID="id_retornado"

# 2. Calcular dívida
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/payments/calculate-debt/$BILLBOARD_ID" | jq

# 3. Aguardar cron job notificar sobre dívida (ou reiniciar servidor)

# 4. Cliente submete pagamento
curl -X POST http://localhost:3001/api/v1/payments/with-proof \
  -H "Authorization: Bearer $TOKEN" \
  -F "clientId=SEU_CLIENT_ID" \
  -F "billboardId=$BILLBOARD_ID" \
  -F "amount=5000" \
  -F "method=bank_transfer" \
  -F "paymentDate=2025-12-02" \
  -F "file=@/path/to/comprovativo.pdf"

export PAYMENT_ID="id_retornado"

# 5. Admin valida pagamento
curl -X PATCH http://localhost:3001/api/v1/payments/$PAYMENT_ID/validate \
  -H "Authorization: Bearer $TOKEN"

# 6. Cliente recebe notificação com recibo (verificar email/notificações)

# 7. Gerar relatório de pagamentos validados
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/reports/payments/export/pdf?startDate=2025-12-01&endDate=2025-12-31" \
  -o payment-report.pdf

xdg-open payment-report.pdf
```

---

## ✅ Checklist de Validação

### Exportação CSV
- [ ] Revenue report gera arquivo CSV válido
- [ ] Billboards in debt lista corretamente
- [ ] Billboards by district agrupa por distrito
- [ ] Client statistics mostra todos os clientes
- [ ] Payments report inclui todos os campos

### Exportação PDF
- [ ] Revenue PDF tem formatação profissional
- [ ] Billboards in debt PDF tem tabelas estruturadas
- [ ] Payments PDF tem layout paisagem
- [ ] PDFs incluem totalizadores
- [ ] PDFs têm data de geração

### Notificações Automáticas
- [ ] Cron job executa nos horários corretos
- [ ] Notificações são criadas no banco
- [ ] Emails são enviados (se configurado)
- [ ] Status de painéis é atualizado
- [ ] Logs aparecem no console

### Soft-Delete
- [ ] DELETE faz soft-delete (isActive = false)
- [ ] Painéis inativos não aparecem em listagens
- [ ] GeoJSON não inclui inativos
- [ ] RESTORE funciona corretamente
- [ ] PERMANENT DELETE remove do banco

---

## 🐛 Troubleshooting

### Erro: "Cannot find module 'pdfkit'"
```bash
cd apps/backend
npm install pdfkit @types/pdfkit
```

### Erro: Cron jobs não executam
- Verificar se `ScheduleModule` está no `app.module.ts`
- Verificar logs do servidor
- Reiniciar servidor

### Erro: PDFs não geram
- Verificar se pasta `uploads/reports/` existe
- Verificar permissões de escrita
- Verificar logs de erro

### Erro: Notificações não são enviadas
- Verificar Redis está rodando
- Verificar configuração de email (SMTP)
- Verificar fila Bull no Redis

---

## 📞 Suporte

Se encontrar problemas, verificar:
1. Logs do servidor (`npm run start:dev`)
2. Logs do Redis
3. Permissões de arquivos em `/uploads/`
4. Variáveis de ambiente no `.env`

**Todas as funcionalidades estão prontas para uso! 🚀**
