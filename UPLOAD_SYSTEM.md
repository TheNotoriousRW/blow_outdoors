# 📤 Sistema de Upload de Ficheiros

## ✅ Status: **100% Funcional**

Sistema de upload de ficheiros implementado com storage local e pronto para migração para Cloudflare R2 em produção.

---

## 🎯 Funcionalidades Implementadas

### 1. **Upload de Ficheiros Genéricos**
- ✅ Upload único (`POST /api/v1/uploads/single`)
- ✅ Upload múltiplo até 10 ficheiros (`POST /api/v1/uploads/multiple`)
- ✅ Validação de tipo de ficheiro (JPEG, PNG, WEBP, PDF)
- ✅ Limite de tamanho: 10MB por ficheiro
- ✅ Nomes únicos com timestamp + random

### 2. **Upload de Comprovativo de Pagamento**
- ✅ Endpoint dedicado (`POST /api/v1/uploads/payment-proof`)
- ✅ Integração direta com módulo de Payments
- ✅ Criar pagamento com comprovativo (`POST /api/v1/payments/with-proof`)
- ✅ Anexar comprovativo a pagamento existente (`PATCH /api/v1/payments/:id/attach-proof`)

### 3. **Download e Gestão**
- ✅ Download/visualização de ficheiros (`GET /api/v1/uploads/:filename`)
- ✅ Deleção de ficheiros (Admin/Finance) (`DELETE /api/v1/uploads/:filename`)
- ✅ URLs públicas geradas automaticamente
- ✅ Persistência via Docker volume

---

## 📋 Endpoints Disponíveis

### Upload Único
```bash
POST /api/v1/uploads/single
Content-Type: multipart/form-data

# Body
file: [arquivo]

# Response
{
  "data": {
    "message": "File uploaded successfully",
    "file": {
      "filename": "file-1764617706914-569166484.pdf",
      "originalName": "documento.pdf",
      "mimetype": "application/pdf",
      "size": 1024,
      "url": "http://localhost:3001/api/v1/uploads/file-1764617706914-569166484.pdf",
      "path": "uploads/file-1764617706914-569166484.pdf"
    }
  },
  "statusCode": 201
}
```

### Upload Múltiplo
```bash
POST /api/v1/uploads/multiple
Content-Type: multipart/form-data

# Body (até 10 ficheiros)
files[]: [arquivo1]
files[]: [arquivo2]
files[]: [arquivo3]

# Response
{
  "data": {
    "message": "3 files uploaded successfully",
    "files": [...]
  },
  "statusCode": 201
}
```

### Criar Pagamento com Comprovativo
```bash
POST /api/v1/payments/with-proof
Content-Type: multipart/form-data

# Body
referenceNumber: "PAY-20251201-001"
clientId: "uuid"
billboardId: "uuid"
amount: 5000
method: "mpesa"  # mpesa, emola, bank_transfer, cash, card
paymentDate: "2025-12-01"
notes: "Pagamento mensal"
file: [comprovativo.pdf]

# Response
{
  "data": {
    "id": "uuid",
    "referenceNumber": "PAY-20251201-001",
    "amount": "5000.00",
    "method": "mpesa",
    "proofDocument": "http://localhost:3001/api/v1/uploads/payment-proof-xxx.pdf",
    "status": "pending",
    ...
  },
  "statusCode": 201
}
```

### Anexar Comprovativo a Pagamento Existente
```bash
PATCH /api/v1/payments/:id/attach-proof
Content-Type: multipart/form-data

# Body
file: [comprovativo.pdf]

# Response
{
  "data": {
    "id": "uuid",
    "proofDocument": "http://localhost:3001/api/v1/uploads/payment-proof-xxx.pdf",
    ...
  },
  "statusCode": 200
}
```

### Download de Ficheiro
```bash
GET /api/v1/uploads/:filename
Authorization: Bearer {token}

# Response
# Retorna o ficheiro diretamente (PDF, imagem, etc)
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Length: 12345
```

### Deletar Ficheiro (Admin/Finance)
```bash
DELETE /api/v1/uploads/:filename
Authorization: Bearer {token}

# Response
{
  "message": "File deleted successfully"
}
```

---

## 🔧 Configuração

### Variáveis de Ambiente (.env)
```env
# File Upload
MAX_FILE_SIZE=10485760        # 10MB em bytes
UPLOAD_LOCATION=./uploads     # Diretório de storage local

# Para produção com Cloudflare R2 (futuro)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=billboard-management
```

### Docker Volume
```yaml
# docker-compose.yml
volumes:
  - uploads_data:/app/uploads  # Persistência dos ficheiros
```

---

## 📁 Estrutura de Ficheiros

```
apps/backend/
├── src/
│   └── modules/
│       ├── uploads/
│       │   ├── uploads.module.ts       # Configuração Multer
│       │   ├── uploads.service.ts      # Lógica de gestão
│       │   └── uploads.controller.ts   # Endpoints REST
│       └── payments/
│           ├── payments.module.ts      # Multer integrado
│           ├── payments.service.ts     # Upload + Payment logic
│           └── payments.controller.ts  # Endpoints com upload
└── uploads/                            # Storage local (volume Docker)
    ├── file-*.pdf
    └── payment-proof-*.pdf
```

---

## 🔒 Segurança

### Validações Implementadas
- ✅ **Tipos de ficheiro permitidos**: JPEG, PNG, WEBP, PDF
- ✅ **Tamanho máximo**: 10MB por ficheiro
- ✅ **Autenticação JWT**: Todos os endpoints protegidos
- ✅ **RBAC**: Deleção apenas para Admin/Finance
- ✅ **Nomes únicos**: Previne sobrescrita acidental

### Proteções Futuras (Produção)
- [ ] Scan antivírus (ClamAV)
- [ ] Rate limiting por usuário
- [ ] Watermark em imagens
- [ ] Compressão automática
- [ ] CDN com Cloudflare

---

## 📊 Testes Realizados

### ✅ Testes Funcionais
1. **Upload único de PDF**: ✅ Sucesso
2. **Validação de tipo de ficheiro**: ✅ Rejeita .txt
3. **Criar pagamento com comprovativo**: ✅ Sucesso
4. **Download de ficheiro**: ✅ HTTP 200, Content-Type correto
5. **Persistência no volume Docker**: ✅ Ficheiros mantidos após restart
6. **URL gerada corretamente**: ✅ `/api/v1/uploads/filename`

### 📈 Resultado
- **52 endpoints** → **58 endpoints** (+ 6 de uploads)
- **Storage local** funcional com volume Docker
- **Integração com Payments** 100% operacional

---

## 🚀 Próximos Passos (Produção)

### Migração para Cloudflare R2

1. **Criar conta Cloudflare R2** (gratuita até 10GB)
2. **Obter credenciais**:
   - Account ID
   - Access Key ID
   - Secret Access Key
   - Bucket Name

3. **Instalar SDK** (quando necessário):
```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

4. **Atualizar `uploads.service.ts`**:
```typescript
// Adicionar lógica para detectar NODE_ENV
if (process.env.NODE_ENV === 'production') {
  // Upload para R2
} else {
  // Upload local (dev)
}
```

5. **Configurar .env.production**:
```env
NODE_ENV=production
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=billboard-management-prod
```

---

## 📖 Exemplos de Uso

### cURL - Upload Simples
```bash
curl -X POST http://localhost:3001/api/v1/uploads/payment-proof \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@comprovativo.pdf"
```

### cURL - Pagamento com Comprovativo
```bash
curl -X POST http://localhost:3001/api/v1/payments/with-proof \
  -H "Authorization: Bearer $TOKEN" \
  -F "referenceNumber=PAY-001" \
  -F "clientId=uuid-client" \
  -F "billboardId=uuid-billboard" \
  -F "amount=5000" \
  -F "method=mpesa" \
  -F "paymentDate=2025-12-01" \
  -F "notes=Pagamento mensal" \
  -F "file=@comprovativo.pdf"
```

### JavaScript/TypeScript - Frontend
```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3001/api/v1/uploads/single', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log('File URL:', result.data.file.url);
```

---

## 🎉 Resumo

| Feature | Status | Storage |
|---------|--------|---------|
| Upload único | ✅ | Local |
| Upload múltiplo | ✅ | Local |
| Upload com Payment | ✅ | Local |
| Download/View | ✅ | Local |
| Delete | ✅ | Local |
| Validação tipo | ✅ | - |
| Validação tamanho | ✅ | - |
| Persistência Docker | ✅ | Volume |
| Cloudflare R2 | ⏳ | Futuro |

**Sistema 100% funcional para desenvolvimento e pequena escala!** 🚀
