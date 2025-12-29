# 🚀 Quick Start Guide

## Inicialização Rápida do Sistema

### Opção 1: Docker (Recomendado - Mais Rápido)

```bash
# 1. Entre no diretório do backend
cd "apps/backend"

# 2. Copie e configure o arquivo de ambiente
cp .env.example .env

# 3. (Opcional) Edite o .env se necessário
# Por padrão já vem configurado para desenvolvimento local

# 4. Inicie todos os serviços (PostgreSQL + Redis + Backend)
docker-compose up -d

# 5. Aguarde alguns segundos e verifique os logs
docker-compose logs -f backend

# 6. Acesse a API
# API: http://localhost:3001
# Documentação: http://localhost:3001/api/docs
```

### Opção 2: Instalação Manual

```bash
# 1. Certifique-se de ter instalado:
# - Node.js 20+
# - PostgreSQL 15+ com PostGIS
# - Redis 7+

# 2. Entre no diretório do backend
cd "apps/backend"

# 3. Instale as dependências
npm install

# 4. Configure o banco de dados PostgreSQL
# Crie um database chamado: billboard_management
# Execute o script: docker-init.sql (para criar extensões e tipos)

# 5. Configure o .env
cp .env.example .env
# Edite com suas credenciais de banco de dados

# 6. Execute as migrations (quando disponíveis)
npm run migration:run

# 7. Inicie o servidor
npm run start:dev

# 8. Acesse a API
# API: http://localhost:3001
# Documentação: http://localhost:3001/api/docs
```

## 📝 Primeiros Passos

### 1. Registrar um Usuário Admin

```bash
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "admin@municipio-maputo.gov.mz",
  "password": "Admin@123",
  "firstName": "Admin",
  "lastName": "Sistema",
  "role": "admin"
}
```

### 2. Fazer Login

```bash
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@municipio-maputo.gov.mz",
  "password": "Admin@123"
}
```

**Resposta:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "admin@municipio-maputo.gov.mz",
    "firstName": "Admin",
    "lastName": "Sistema",
    "role": "admin"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Usar o Token

Copie o `accessToken` e use em todas as próximas requisições:

```
Authorization: Bearer <seu-token-aqui>
```

### 4. Explorar a API

Acesse a documentação interativa Swagger:
```
http://localhost:3001/api/docs
```

Lá você pode:
- Ver todos os endpoints disponíveis
- Testar as requisições diretamente
- Ver os modelos de dados
- Autenticar-se clicando em "Authorize"

## 🔧 Comandos Docker Úteis

```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver logs apenas do backend
docker-compose logs -f backend

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados)
docker-compose down -v

# Reiniciar apenas o backend
docker-compose restart backend

# Acessar o shell do container
docker-compose exec backend sh

# Acessar PostgreSQL
docker-compose exec postgres psql -U postgres -d billboard_management

# Ver status dos containers
docker-compose ps

# Rebuild após mudanças no código
docker-compose up -d --build
```

## 🗄️ Comandos do Banco de Dados

```bash
# Acessar o PostgreSQL via docker
docker-compose exec postgres psql -U postgres -d billboard_management

# Listar tabelas
\dt

# Ver estrutura de uma tabela
\d users

# Executar query
SELECT * FROM users;

# Sair
\q
```

## 🧪 Testar a API

### Usando cURL

```bash
# Registrar usuário
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User",
    "role": "client"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'

# Listar painéis (com autenticação)
curl -X GET http://localhost:3001/api/billboards \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Usando a Interface Swagger

1. Acesse `http://localhost:3001/api/docs`
2. Clique em "Authorize" (cadeado no topo direito)
3. Cole seu token JWT
4. Clique em "Authorize"
5. Agora você pode testar qualquer endpoint clicando em "Try it out"

## ⚠️ Troubleshooting

### Erro: "Cannot connect to database"

```bash
# Verifique se o PostgreSQL está rodando
docker-compose ps

# Reinicie o PostgreSQL
docker-compose restart postgres

# Verifique os logs
docker-compose logs postgres
```

### Erro: "Redis connection failed"

```bash
# Verifique se o Redis está rodando
docker-compose ps

# Reinicie o Redis
docker-compose restart redis
```

### Erro: "Port 3001 already in use"

```bash
# Encontre o processo usando a porta
lsof -i :3001

# Ou mude a porta no .env
PORT=3002
```

### Limpar tudo e recomeçar

```bash
# Parar tudo
docker-compose down -v

# Remover imagens
docker-compose rm -f

# Rebuild e restart
docker-compose up -d --build
```

## 📊 Dados de Teste

Após o sistema estar rodando, você pode criar dados de teste manualmente via Swagger ou scripts.

### Exemplo: Criar um Cliente

```bash
POST /api/clients
{
  "companyName": "Publicidade Maputo Lda",
  "taxId": "123456789",
  "address": "Av. Julius Nyerere, 1234",
  "city": "Maputo",
  "district": "KaMpfumo",
  "contactPerson": "João Silva",
  "userId": "uuid-do-usuario-cliente"
}
```

### Exemplo: Criar um Painel

```bash
POST /api/billboards
{
  "code": "MPT-001",
  "name": "Painel Av. Julius Nyerere",
  "type": "outdoor",
  "size": "large",
  "address": "Av. Julius Nyerere esquina com Av. 24 de Julho",
  "district": "KaMpfumo",
  "neighborhood": "Polana",
  "location": {
    "type": "Point",
    "coordinates": [32.5832, -25.9655]
  },
  "width": 8,
  "height": 4,
  "clientId": "uuid-do-cliente"
}
```

## 🎯 Próximos Passos

1. ✅ Explorar a documentação Swagger
2. ✅ Criar usuários de teste para cada role
3. ✅ Cadastrar clientes
4. ✅ Cadastrar painéis com localização
5. ✅ Criar zonas tarifárias
6. ✅ Definir tarifas
7. ✅ Registrar pagamentos
8. ✅ Testar o sistema de notificações
9. ✅ Gerar relatórios

## 📚 Recursos Adicionais

- **Documentação API:** http://localhost:3001/api/docs
- **README Backend:** `/apps/backend/README.md`
- **README Principal:** `/README.md`

---

**Bom desenvolvimento! 🚀**
