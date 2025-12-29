# 🏙️ Sistema de Gestão de Painéis Publicitários - Município de Maputo

Sistema web completo para gestão de painéis publicitários no município de Maputo, incluindo controle de clientes, pagamentos, localização geoespacial e relatórios financeiros.

![Maputo Municipality](./Logotipo%20/Brasão_Maputo.jpg)

## 🎨 Identidade Visual

- **Cores principais:**
  - Branco: `#FFFFFF`
  - Verde: `#00a651` (cor oficial do município)
- **Logotipo:** Brasão oficial do Município de Maputo

## 🏗️ Arquitetura

### Stack Tecnológico

#### Backend
- **Framework:** NestJS (Node.js + TypeScript)
- **Database:** PostgreSQL 15+ com extensão PostGIS
- **Cache & Queues:** Redis + BullMQ
- **Autenticação:** JWT + RBAC (Role-Based Access Control)
- **Documentação:** Swagger/OpenAPI
- **Containerização:** Docker & Docker Compose

#### Frontend (Planejado)
- **Framework:** Next.js 14+ (React + TypeScript)
- **Styling:** Tailwind CSS
- **Maps:** Mapbox GL JS
- **State Management:** React Query + Zustand
- **Forms:** React Hook Form + Zod

#### Infraestrutura
- **Storage:** Cloudflare R2 (para uploads)
- **Email:** SMTP (configurável)
- **Payment APIs:** Mpesa e e-Mola (integração futura)

## ✨ Funcionalidades

### 🔐 Autenticação e Autorização
- Sistema JWT com refresh tokens
- 4 níveis de acesso (Admin, Financeiro, Técnico, Cliente)
- Proteção de rotas por role
- Recuperação de senha

### 👥 Gestão de Utilizadores
- CRUD completo de usuários
- Perfis por role
- Histórico de login
- Gestão de permissões

### 🏢 Gestão de Clientes
- Cadastro de empresas/proprietários
- NUIT (Tax ID) único
- Associação com painéis
- Histórico de pagamentos

### 📊 Gestão de Painéis Publicitários
- CRUD completo de painéis
- Estados: Ativo, Pendente, Suspenso, Em Dívida
- Tipos: Outdoor, Billboard, Totem, Digital, Luminoso
- Tamanhos padronizados
- Localização geográfica (lat/long)
- Fotos e documentação

### 🗺️ Funcionalidades Geoespaciais
- PostGIS para queries espaciais
- Endpoints GeoJSON
- Busca por proximidade (radius search)
- Busca dentro de polígonos
- Cálculo de distâncias
- Suporte a shapefiles
- Visualização em mapas interativos

### 💰 Sistema de Tarifas
- Zonas tarifárias geográficas
- Preços dinâmicos por:
  - Zona geográfica
  - Tipo de painel
  - Tamanho do painel
- Multiplicadores por zona
- Histórico de alterações

### 💳 Gestão de Pagamentos
- Registro de pagamentos
- Upload de comprovativos
- Validação por equipe financeira
- Estados: Pendente, Validado, Rejeitado
- Métodos: Mpesa, e-Mola, Transferência, Dinheiro
- Histórico completo

### 📄 Faturas e Recibos
- Emissão de faturas pro forma
- Geração de recibos
- Numeração automática
- Cálculo de IVA
- Download em PDF (planejado)

### 🔔 Sistema de Notificações
- Notificações in-app
- Notificações por email
- Alertas automáticos:
  - Vencimento de pagamentos
  - Painéis suspensos
  - Validação de comprovativos
- Fila assíncrona com BullMQ
- Histórico de notificações

### 📈 Relatórios e Analytics
- Relatório de receitas
- Painéis em dívida
- Distribuição geográfica
- Estatísticas de clientes
- Filtros por período
- Exportação CSV/PDF (planejado)

## 👥 Roles e Permissões (RBAC)

| Role | Descrição | Permissões Principais |
|------|-----------|---------------------|
| **Admin** | Administrador do sistema | Acesso total, gestão de usuários, configurações |
| **Financeiro** | Equipe financeira | Validação de pagamentos, emissão de faturas, relatórios financeiros |
| **Técnico** | Equipe técnica | Gestão de painéis, localização, manutenção, zonas tarifárias |
| **Cliente** | Proprietário de painéis | Visualizar próprios painéis, submeter pagamentos, receber faturas |

## 📦 Instalação e Configuração

### Pré-requisitos

```bash
- Node.js 20+
- PostgreSQL 15+ com PostGIS
- Redis 7+
- Docker & Docker Compose (opcional mas recomendado)
```

### Instalação Rápida com Docker

```bash
# Clone o repositório
git clone [repository-url]
cd "Gestão de paineis publicitarios"

# Entre no diretório do backend
cd apps/backend

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Inicie todos os serviços
docker-compose up -d

# Visualize os logs
docker-compose logs -f backend

# Acesse:
# Backend API: http://localhost:3001
# Swagger Docs: http://localhost:3001/api/docs
```

### Instalação Manual

```bash
# Entre no diretório do backend
cd apps/backend

# Instale as dependências
npm install

# Configure o ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Execute as migrations
npm run migration:run

# Inicie em modo desenvolvimento
npm run start:dev
```

## 📚 Documentação da API

Após iniciar o servidor, acesse a documentação interativa Swagger:

```
http://localhost:3001/api/docs
```

### Endpoints Principais

#### Autenticação
```
POST   /api/auth/register    - Registrar novo usuário
POST   /api/auth/login       - Login
GET    /api/auth/profile     - Perfil do usuário atual
POST   /api/auth/logout      - Logout
```

#### Painéis
```
GET    /api/billboards              - Listar painéis (com filtros)
GET    /api/billboards/:id          - Detalhes do painel
POST   /api/billboards              - Criar painel
PATCH  /api/billboards/:id          - Atualizar painel
DELETE /api/billboards/:id          - Remover painel
PATCH  /api/billboards/:id/status   - Atualizar status
GET    /api/billboards/nearby       - Buscar painéis próximos
```

#### Clientes
```
GET    /api/clients        - Listar clientes
GET    /api/clients/:id    - Detalhes do cliente
POST   /api/clients        - Criar cliente
PATCH  /api/clients/:id    - Atualizar cliente
DELETE /api/clients/:id    - Remover cliente
```

#### Pagamentos
```
GET    /api/payments               - Listar pagamentos
POST   /api/payments               - Registrar pagamento
PATCH  /api/payments/:id/validate  - Validar pagamento
PATCH  /api/payments/:id/reject    - Rejeitar pagamento
```

#### Geoespacial
```
GET    /api/geospatial/billboards/geojson    - Painéis em GeoJSON
GET    /api/geospatial/tariff-zones/geojson  - Zonas em GeoJSON
POST   /api/geospatial/billboards/in-polygon - Buscar em polígono
GET    /api/geospatial/distance              - Calcular distância
```

#### Relatórios
```
GET    /api/reports/revenue               - Relatório de receita
GET    /api/reports/billboards-in-debt    - Painéis em dívida
GET    /api/reports/billboards-by-district - Distribuição por distrito
GET    /api/reports/client-statistics     - Estatísticas de clientes
```

## 🗂️ Estrutura do Projeto

```
.
├── apps/
│   └── backend/              # Backend NestJS
│       ├── src/
│       │   ├── common/       # Utilidades compartilhadas
│       │   ├── config/       # Configurações
│       │   ├── modules/      # Módulos funcionais
│       │   │   ├── auth/     # Autenticação JWT
│       │   │   ├── users/    # Usuários
│       │   │   ├── clients/  # Clientes
│       │   │   ├── billboards/ # Painéis
│       │   │   ├── tariff-zones/ # Zonas
│       │   │   ├── tariffs/  # Tarifas
│       │   │   ├── payments/ # Pagamentos
│       │   │   ├── invoices/ # Faturas
│       │   │   ├── notifications/ # Notificações
│       │   │   ├── reports/  # Relatórios
│       │   │   └── geospatial/ # Geoespacial
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── docker-compose.yml
│       ├── Dockerfile
│       └── package.json
└── Logotipo/                 # Recursos visuais
    └── Brasão_Maputo.jpg
```

## 🎯 Roadmap

### ✅ Backend (Completo)
- [x] Setup inicial do projeto
- [x] Estrutura base NestJS
- [x] Autenticação e autorização (JWT + RBAC)
- [x] Módulo de clientes
- [x] Módulo de painéis publicitários
- [x] Integração com PostGIS
- [x] Sistema de tarifas dinâmicas
- [x] Módulo de pagamentos
- [x] Sistema de notificações (BullMQ)
- [x] Endpoints geoespaciais (GeoJSON)
- [x] Relatórios e analytics
- [x] Docker setup completo
- [x] Swagger documentation

### 🚧 Frontend (Próxima Fase)
- [ ] Setup Next.js 14+ com TypeScript
- [ ] Configuração Tailwind CSS com tema
- [ ] Sistema de autenticação
- [ ] Dashboard admin/gestão
- [ ] Dashboard cliente
- [ ] Integração Mapbox GL
- [ ] Gestão de painéis (CRUD)
- [ ] Sistema de pagamentos
- [ ] Upload de comprovativos
- [ ] Visualização de faturas
- [ ] Notificações em tempo real
- [ ] Relatórios e exportação

### 🔮 Integrações Futuras
- [ ] Integração Mpesa API
- [ ] Integração e-Mola API
- [ ] Geração de PDFs (faturas/recibos)
- [ ] Upload para Cloudflare R2
- [ ] WebSockets para notificações real-time
- [ ] Testes automatizados (Jest + Supertest)
- [ ] CI/CD pipeline
- [ ] Deploy em produção

## 🧪 Testes

```bash
cd apps/backend

# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:cov
```

## 🚀 Deploy

### Produção com Docker

```bash
# Build para produção
docker-compose -f docker-compose.prod.yml up -d

# Ou build manual
npm run build
npm run start:prod
```

### Variáveis de Ambiente Importantes

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=strong-secret-key
SMTP_HOST=smtp.example.com
```

## 📝 Licença

Propriedade do **Município de Maputo** - Todos os direitos reservados

## 👨‍💻 Desenvolvimento

### Contribuindo

1. Siga a estrutura de código existente
2. Use TypeScript rigorosamente
3. Adicione documentação Swagger para novos endpoints
4. Escreva testes unitários
5. Atualize esta documentação quando necessário

### Comandos Úteis

```bash
# Backend
cd apps/backend
npm run start:dev        # Desenvolvimento
npm run build           # Build
npm run lint            # Linting
npm run format          # Formatação

# Docker
docker-compose up -d     # Iniciar serviços
docker-compose logs -f   # Ver logs
docker-compose down      # Parar serviços
```

## 📞 Suporte

Para questões e suporte, contacte a equipe de desenvolvimento do Município de Maputo.

---

**Desenvolvido para o Município de Maputo** 🇲🇿

Sistema de Gestão de Painéis Publicitários - 2024
