# 🚀 Deployment Guide - Billboard Management System

Guia completo para deploy do sistema em produção.

## 📋 Pré-requisitos de Produção

### Servidor
- Ubuntu 22.04 LTS ou superior
- Mínimo 4GB RAM
- 20GB de espaço em disco
- Acesso SSH
- Docker e Docker Compose instalados

### Domínios e Certificados
- Domínio configurado (ex: api.paineis-maputo.gov.mz)
- Certificado SSL/TLS (Let's Encrypt recomendado)

### Serviços Externos
- Conta SMTP para emails (Gmail, SendGrid, etc.)
- Conta Cloudflare R2 (opcional, para uploads)
- Credenciais Mpesa API
- Credenciais e-Mola API

## 🔧 Configuração do Servidor

### 1. Instalar Docker e Docker Compose

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker --version
docker-compose --version
```

### 2. Configurar Firewall

```bash
# Permitir SSH
sudo ufw allow 22

# Permitir HTTP e HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Habilitar firewall
sudo ufw enable
```

### 3. Criar Estrutura de Diretórios

```bash
# Criar diretório da aplicação
sudo mkdir -p /var/www/billboard-management
cd /var/www/billboard-management

# Criar diretórios para dados
sudo mkdir -p data/postgres
sudo mkdir -p data/redis
sudo mkdir -p data/uploads
sudo mkdir -p logs
```

## 📦 Deploy da Aplicação

### 1. Clonar ou Transferir Código

```bash
# Opção 1: Git (recomendado)
git clone [repository-url] /var/www/billboard-management
cd /var/www/billboard-management

# Opção 2: Upload via SCP
# No seu computador local:
# scp -r "Gestão de paineis publicitarios" user@server:/var/www/billboard-management
```

### 2. Configurar Variáveis de Ambiente

```bash
cd /var/www/billboard-management/apps/backend

# Copiar template
cp .env.example .env.production

# Editar arquivo de produção
nano .env.production
```

**Configurações Essenciais:**

```env
# Application
NODE_ENV=production
PORT=3001
API_PREFIX=api

# Database (use senhas fortes!)
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=billboard_user
DATABASE_PASSWORD=STRONG_PASSWORD_HERE
DATABASE_NAME=billboard_production
DATABASE_SYNC=false
DATABASE_LOGGING=false

# JWT (use chaves seguras - gere com: openssl rand -base64 32)
JWT_SECRET=SUPER_SECRET_KEY_HERE_CHANGE_ME
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=ANOTHER_SECRET_KEY_HERE
JWT_REFRESH_EXPIRES_IN=30d

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=STRONG_REDIS_PASSWORD

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=paineis@municipio-maputo.gov.mz
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@municipio-maputo.gov.mz

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=billboard-management-prod

# Mapbox
MAPBOX_ACCESS_TOKEN=your-mapbox-token

# Payment APIs
MPESA_API_KEY=your-mpesa-key
MPESA_PUBLIC_KEY=your-mpesa-public-key
EMOLA_API_KEY=your-emola-key
EMOLA_SECRET_KEY=your-emola-secret

# CORS
CORS_ORIGIN=https://paineis.municipio-maputo.gov.mz

# Logging
LOG_LEVEL=info
```

### 3. Criar docker-compose.production.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.4
    container_name: billboard_postgres_prod
    restart: always
    environment:
      POSTGRES_USER: ${DATABASE_USER}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: ${DATABASE_NAME}
    volumes:
      - /var/www/billboard-management/data/postgres:/var/lib/postgresql/data
      - ./docker-init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - billboard_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: billboard_redis_prod
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - /var/www/billboard-management/data/redis:/data
    networks:
      - billboard_network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: billboard_backend_prod
    restart: always
    env_file:
      - .env.production
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - /var/www/billboard-management/data/uploads:/app/uploads
      - /var/www/billboard-management/logs:/app/logs
    networks:
      - billboard_network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  billboard_network:
    driver: bridge
```

### 4. Build e Iniciar

```bash
cd /var/www/billboard-management/apps/backend

# Build das imagens
docker-compose -f docker-compose.production.yml build

# Iniciar serviços
docker-compose -f docker-compose.production.yml up -d

# Verificar status
docker-compose -f docker-compose.production.yml ps

# Ver logs
docker-compose -f docker-compose.production.yml logs -f backend
```

### 5. Executar Migrations

```bash
# Entrar no container
docker-compose -f docker-compose.production.yml exec backend sh

# Executar migrations
npm run migration:run

# Sair
exit
```

## 🔒 Configurar NGINX como Reverse Proxy

### 1. Instalar NGINX

```bash
sudo apt install nginx -y
```

### 2. Configurar Site

```bash
sudo nano /etc/nginx/sites-available/billboard-api
```

**Configuração:**

```nginx
upstream backend_api {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name api.paineis-maputo.gov.mz;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.paineis-maputo.gov.mz;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.paineis-maputo.gov.mz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.paineis-maputo.gov.mz/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logs
    access_log /var/log/nginx/billboard-api-access.log;
    error_log /var/log/nginx/billboard-api-error.log;

    # Client upload size
    client_max_body_size 20M;

    location / {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

### 3. Habilitar Site

```bash
# Criar symlink
sudo ln -s /etc/nginx/sites-available/billboard-api /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar NGINX
sudo systemctl restart nginx
```

### 4. Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot --nginx -d api.paineis-maputo.gov.mz

# Renovação automática (já configurado)
sudo certbot renew --dry-run
```

## 🔐 Segurança

### 1. Firewall Adicional

```bash
# Bloquear acesso direto à porta 3001
sudo ufw deny 3001

# Permitir apenas NGINX
sudo ufw allow 'Nginx Full'
```

### 2. Fail2Ban (Proteção contra Brute Force)

```bash
# Instalar
sudo apt install fail2ban -y

# Configurar
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true
```

```bash
# Reiniciar
sudo systemctl restart fail2ban
```

### 3. Backup Automático

```bash
# Criar script de backup
sudo nano /usr/local/bin/backup-billboard.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/billboard"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup do banco de dados
docker exec billboard_postgres_prod pg_dump -U billboard_user billboard_production | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup dos uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/billboard-management/data/uploads

# Remover backups antigos (manter últimos 7 dias)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup concluído: $DATE"
```

```bash
# Dar permissão
sudo chmod +x /usr/local/bin/backup-billboard.sh

# Adicionar ao crontab (todo dia às 2h)
sudo crontab -e
```

Adicionar linha:
```
0 2 * * * /usr/local/bin/backup-billboard.sh
```

## 📊 Monitoramento

### 1. Ver Logs em Tempo Real

```bash
# Logs do backend
docker-compose -f docker-compose.production.yml logs -f backend

# Logs do NGINX
sudo tail -f /var/log/nginx/billboard-api-access.log
sudo tail -f /var/log/nginx/billboard-api-error.log
```

### 2. Verificar Status dos Containers

```bash
docker-compose -f docker-compose.production.yml ps
```

### 3. Health Check

```bash
curl https://api.paineis-maputo.gov.mz/api/health
```

## 🔄 Atualizações

### Deploy de Nova Versão

```bash
cd /var/www/billboard-management

# Pull das mudanças
git pull origin main

# Rebuild
cd apps/backend
docker-compose -f docker-compose.production.yml build

# Restart com zero downtime
docker-compose -f docker-compose.production.yml up -d --no-deps backend

# Executar migrations se necessário
docker-compose -f docker-compose.production.yml exec backend npm run migration:run
```

## 🆘 Troubleshooting

### Container não inicia

```bash
# Ver logs
docker-compose -f docker-compose.production.yml logs backend

# Verificar se as portas estão livres
sudo netstat -tulpn | grep 3001

# Verificar permissões
ls -la /var/www/billboard-management/data
```

### Erro de conexão ao banco

```bash
# Verificar se o PostgreSQL está rodando
docker-compose -f docker-compose.production.yml ps postgres

# Testar conexão
docker-compose -f docker-compose.production.yml exec postgres psql -U billboard_user -d billboard_production
```

### Performance Lenta

```bash
# Ver uso de recursos
docker stats

# Otimizar PostgreSQL (ajustar no docker-compose)
# shared_buffers, work_mem, effective_cache_size
```

## 📝 Checklist de Deploy

- [ ] Servidor configurado com Docker
- [ ] Firewall configurado
- [ ] Código transferido
- [ ] .env.production configurado com credenciais reais
- [ ] Docker Compose production criado
- [ ] Containers iniciados
- [ ] Migrations executadas
- [ ] NGINX instalado e configurado
- [ ] SSL configurado (Let's Encrypt)
- [ ] Backup automático configurado
- [ ] Fail2Ban instalado
- [ ] Logs sendo monitorados
- [ ] Health check funcionando
- [ ] Documentação atualizada
- [ ] Equipe treinada

---

**Sistema pronto para produção! 🚀**
