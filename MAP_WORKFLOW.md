# 🗺️ Workflow do Mapa Interativo

## 📋 Visão Geral

Sistema de mapa interativo com diferentes funcionalidades baseadas no papel do usuário (role).

---

## 👤 Workflows por Role

### 🟢 Cliente (CLIENT)

#### **O que vê:**
- ✅ Apenas os seus próprios painéis no mapa
- ✅ Filtro automático por `clientId`
- ❌ Não vê painéis de outros clientes

#### **Interações disponíveis:**
1. **Visualizar painéis no mapa**
   - Endpoint: `GET /api/v1/geospatial/billboards/geojson`
   - Filtro automático pelo backend baseado no JWT token
   
2. **Clicar no marcador → Ver detalhes**
   - Endpoint: `GET /api/v1/billboards/{id}`
   - Retorna informações completas:
     - Dados do painel
     - Histórico de pagamentos
     - Cálculo de dívida atual
     - Faturas/recibos
   
3. **Ver clusters (zoom baixo)**
   - Endpoint: `GET /api/v1/geospatial/billboards/clustered?zoom=8`
   - Agrupa painéis próximos para performance

#### **Permissões:**
- ❌ Não pode criar painéis
- ❌ Não pode editar painéis
- ❌ Não pode ver painéis de outros clientes
- ✅ Pode ver apenas seus dados

---

### 🔴 Admin / Técnico (ADMIN / TECHNICIAN)

#### **O que vê:**
- ✅ **Todos os painéis** no sistema
- ✅ Painéis de todos os clientes
- ✅ Zonas tarifárias (shapefiles/overlays)
- ✅ Clusters inteligentes

#### **Mapa completo com:**

##### 1. **Clusters Dinâmicos**
```http
GET /api/v1/geospatial/billboards/clustered?zoom=8
```
- **Zoom < 8:** Grid grande (1.0°)
- **Zoom 8-10:** Grid médio (0.5°)
- **Zoom 10-12:** Grid pequeno (0.1°)
- **Zoom > 12:** Painéis individuais (sem clustering)

**Resposta do cluster:**
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [32.59, -25.96]
  },
  "properties": {
    "cluster": true,
    "count": 15,
    "billboardIds": ["uuid1", "uuid2", ...],
    "statuses": ["active", "active", "in_debt", ...]
  }
}
```

##### 2. **Overlays - Zonas Tarifárias (PostGIS)**
```http
GET /api/v1/geospatial/tariff-zones/geojson
```
- Retorna polígonos das zonas tarifárias
- Formato: MultiPolygon GeoJSON
- Usar como layer overlay no mapa

**Resposta:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[...]]]
      },
      "properties": {
        "name": "Zona Centro",
        "priceMultiplier": 1.5,
        "districts": ["KaMpfumo"]
      }
    }
  ]
}
```

##### 3. **Shapefiles via PostGIS**
- Geometrias armazenadas no PostgreSQL com extensão PostGIS
- Queries espaciais nativas (ST_Contains, ST_Within, ST_Distance)
- Suporte a SRID 4326 (WGS84)

---

## 🎯 Workflow: "Add Billboard Here" (Admin)

### Passo 1: Clicar no Mapa
```javascript
// Frontend captura coordenadas do clique
map.on('click', (e) => {
  const { lng, lat } = e.lngLat;
  validateLocation(lng, lat);
});
```

### Passo 2: Validar Localização
```http
GET /api/v1/geospatial/validate-location?longitude=32.5892&latitude=-25.9655&minimumDistance=50
Authorization: Bearer {admin_token}
```

**Resposta da validação:**
```json
{
  "valid": false,
  "tariffZone": {
    "id": "uuid",
    "name": "Zona Centro",
    "code": "ZC-01",
    "priceMultiplier": 1.5
  },
  "nearbyBillboards": [
    {
      "id": "uuid",
      "code": "PAINEL-001",
      "name": "Painel Existente",
      "client": { "companyName": "Empresa ABC" }
    }
  ],
  "warnings": [
    "Existem 2 painel(is) num raio de 50m"
  ]
}
```

### Passo 3: Mostrar Informações ao Admin

**Se `valid: true`:**
```
✅ Localização válida
📍 Zona: Zona Centro (Multiplicador: 1.5x)
✅ Nenhum painel próximo
```

**Se `valid: false` (com warnings):**
```
⚠️ Avisos de validação:
- Existem 2 painel(is) num raio de 50m
- Ver painéis próximos: [PAINEL-001, PAINEL-002]

💡 Deseja continuar mesmo assim?
[Sim] [Não]
```

### Passo 4: Obter Zona Tarifária (Opcional)
```http
GET /api/v1/geospatial/tariff-zone/by-coordinates?longitude=32.5892&latitude=-25.9655
```
- Auto-preencher campo `tariffZoneId` no formulário

### Passo 5: Criar Painel via Coordenadas
```http
POST /api/v1/billboards/create-from-map
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "longitude": 32.5892,
  "latitude": -25.9655,
  "type": "digital",
  "size": "large",
  "clientId": "uuid",  // Selecionado pelo admin
  "address": "Av. Julius Nyerere (aproximado)",
  "district": "KaMpfumo"
}
```

**Resposta:**
```json
{
  "data": {
    "id": "new-uuid",
    "code": "PAINEL-123456",  // Auto-gerado
    "name": "Painel PAINEL-123456",  // Auto-gerado
    "location": {
      "type": "Point",
      "coordinates": [32.5892, -25.9655]
    },
    "status": "pending",
    "type": "digital",
    "size": "large"
  }
}
```

---

## 🎨 Implementação Frontend Recomendada

### Bibliotecas Sugeridas
- **Mapbox GL JS** ou **Leaflet** para renderização
- **Turf.js** para operações geoespaciais no frontend
- **React Map GL** (se usando React)

### Camadas do Mapa (Layers)

```javascript
const mapLayers = {
  // 1. Zonas Tarifárias (Overlay)
  tariffZones: {
    type: 'fill',
    source: 'tariff-zones-geojson',
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': 0.2
    }
  },
  
  // 2. Clusters (Zoom < 12)
  billboardClusters: {
    type: 'circle',
    source: 'billboards-clustered',
    filter: ['==', ['get', 'cluster'], true],
    paint: {
      'circle-radius': ['step', ['get', 'count'], 20, 5, 30, 10, 40],
      'circle-color': '#007cbf'
    }
  },
  
  // 3. Painéis Individuais (Zoom > 12)
  individualBillboards: {
    type: 'symbol',
    source: 'billboards-geojson',
    layout: {
      'icon-image': 'billboard-marker',
      'icon-size': 0.8
    }
  }
};
```

### Estado do Mapa por Role

```javascript
const mapConfig = {
  client: {
    allowCreateBillboard: false,
    showAllBillboards: false,
    dataSource: '/api/v1/geospatial/billboards/geojson', // Filtrado pelo backend
    canEditBillboards: false
  },
  
  admin: {
    allowCreateBillboard: true,
    showAllBillboards: true,
    dataSource: '/api/v1/geospatial/billboards/clustered?zoom={zoom}',
    canEditBillboards: true,
    showTariffZones: true,
    enableClickToCreate: true
  },
  
  technician: {
    allowCreateBillboard: true,
    showAllBillboards: true,
    dataSource: '/api/v1/geospatial/billboards/clustered?zoom={zoom}',
    canEditBillboards: true,
    showTariffZones: true,
    enableClickToCreate: true
  }
};
```

---

## 📊 Fluxo de Dados

### Cliente vê mapa:
```
1. Frontend → GET /api/v1/geospatial/billboards/geojson
2. Backend detecta role=CLIENT no JWT
3. Backend filtra por clientId automaticamente
4. Retorna apenas painéis do cliente
5. Frontend renderiza marcadores
```

### Admin vê mapa:
```
1. Frontend → GET /api/v1/geospatial/billboards/clustered?zoom=8
2. Backend retorna todos os painéis (sem filtro)
3. Backend agrupa em clusters (se zoom < 12)
4. Frontend renderiza clusters ou painéis individuais

Paralelo:
1. Frontend → GET /api/v1/geospatial/tariff-zones/geojson
2. Backend retorna polígonos das zonas
3. Frontend renderiza como overlay semi-transparente
```

### Admin cria painel:
```
1. Admin clica no mapa → captura (lng, lat)
2. Frontend → GET /api/v1/geospatial/validate-location
3. Backend verifica zona tarifária e painéis próximos
4. Frontend mostra modal com validação
5. Admin preenche formulário
6. Frontend → POST /api/v1/billboards/create-from-map
7. Backend cria painel com GeoJSON Point
8. Frontend atualiza mapa com novo marcador
```

---

## 🔐 Segurança

### Filtros Automáticos
- ✅ CLIENT role: Backend força `clientId` baseado no JWT
- ✅ ADMIN/TECHNICIAN: Sem filtros, vê tudo
- ✅ Validação de ownership em `GET /billboards/{id}`

### Permissões de Criação
- ✅ Apenas ADMIN e TECHNICIAN podem criar painéis
- ✅ Endpoint `/create-from-map` protegido com `@Roles()`
- ✅ Validação de coordenadas no backend

---

## 🚀 Performance

### Clustering
- **Zoom 1-8:** ~100 clusters em vez de 1000+ painéis
- **Zoom 8-12:** ~500 clusters
- **Zoom 12+:** Painéis individuais

### Otimizações
1. **Backend clustering** (não no frontend)
2. **Lazy loading** de detalhes ao clicar
3. **Cache** de zonas tarifárias (mudam raramente)
4. **Debounce** em zoom/pan events

---

## 📝 Checklist de Implementação

### Backend ✅
- [x] Filtro automático por clientId no GeoJSON
- [x] Endpoint de clustering por zoom level
- [x] Validação de localização
- [x] Busca de zona tarifária por coordenadas
- [x] Endpoint para criar painel via mapa
- [x] Verificação de painéis próximos

### Frontend (Recomendações)
- [ ] Integrar Mapbox/Leaflet
- [ ] Implementar clustering visual
- [ ] Overlay de zonas tarifárias
- [ ] Modal de "Add Billboard Here"
- [ ] Formulário de validação de localização
- [ ] Popup de detalhes ao clicar no marcador
- [ ] Diferentes visões por role (CLIENT vs ADMIN)
- [ ] Ícones diferentes por status (active, in_debt, etc)

---

## 🎯 Endpoints Resumo

| Endpoint | Role | Descrição |
|----------|------|-----------|
| `GET /billboards/geojson` | Todos | Painéis como GeoJSON (filtrado por role) |
| `GET /billboards/clustered?zoom=X` | Todos | Clustering dinâmico |
| `GET /tariff-zones/geojson` | Todos | Zonas tarifárias |
| `GET /tariff-zone/by-coordinates` | Todos | Encontrar zona por lat/lng |
| `GET /validate-location` | Admin/Tech | Validar antes de criar |
| `GET /nearby-billboards` | Todos | Painéis próximos |
| `POST /billboards/create-from-map` | Admin/Tech | Criar via mapa |

---

**Status:** ✅ Completamente implementado no backend  
**Próximo:** Implementação no frontend com mapa interativo
