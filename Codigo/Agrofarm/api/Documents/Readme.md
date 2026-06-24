# API — Documentação Técnica

Servidor HTTP do AgroFarm construído com **Node.js + Express**, organizado em camadas **Controller → Service → Repository → Prisma**, com validação **Zod** e formatação de respostas via **Views**.

---

## Índice

- [Tecnologias](#tecnologias)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Camadas da aplicação](#camadas-da-aplicação)
- [Fluxo de uma requisição](#fluxo-de-uma-requisição)
- [Modelo de dados](#modelo-de-dados)
- [Rotas da API](#rotas-da-api)
- [Regras de negócio](#regras-de-negócio)
- [Jobs agendados](#jobs-agendados)
- [Integrações externas](#integrações-externas)
- [Autenticação e autorização](#autenticação-e-autorização)
- [Padrão de erros](#padrão-de-erros)
- [Testes](#testes)
- [Como rodar](#como-rodar)
- [Variáveis de ambiente](#variáveis-de-ambiente)

---

## Tecnologias

| Tecnologia | Versão / Uso |
| ---------- | ------------ |
| Node.js | Runtime (20+) |
| Express | Framework HTTP |
| Prisma 5 | ORM — PostgreSQL |
| PostgreSQL + PostGIS | Banco (Neon) — geometrias de talhões |
| Zod | Validação de entrada |
| JWT | Autenticação stateless |
| Bcrypt | Hash de senhas |
| Pino | Logging estruturado |
| node-cron | Jobs (lembretes, cotações) |
| Google Gemini | Chat IA e insights |
| Evolution API | WhatsApp |
| Resend | E-mail (recuperação de senha) |
| @turf/turf | Cálculos geoespaciais |
| Vitest 3 | Testes |

---

## Estrutura de pastas

```text
Agrofarm/api/
├── index.js                   # Entry point Vercel (exporta app)
├── prisma/
│   └── schema.prisma          # Modelo de dados (fonte da verdade)
├── src/
│   ├── server.js              # Entrada — sobe HTTP + jobs
│   ├── app.js                 # Express — middlewares + rotas
│   ├── config/                # env, cors
│   ├── database/
│   │   ├── client.js          # PrismaClient singleton
│   │   └── seeds/             # admin, demo, mega-demo
│   ├── routes/                # Definição de URLs
│   ├── controllers/           # req/res — orquestra services
│   ├── services/              # Regras de negócio
│   ├── repositories/          # Queries Prisma
│   ├── views/                 # Formatação de respostas JSON
│   ├── schemas/               # Schemas Zod por domínio
│   ├── middlewares/           # auth, validator, error, logger, rate-limit
│   ├── jobs/                  # Cron (lembretes, cotação)
│   ├── shared/
│   │   ├── errors/            # AppError
│   │   ├── navigation/        # menu.config.js
│   │   ├── cultura/           # status, hectares de talhões
│   │   ├── estoque/           # saldo de sacas
│   │   └── utils/             # jwt, bcrypt, logger, email
│   ├── utils/                 # lembrete.recorrencia, lembrete.utils
│   └── tests/
│       ├── unit/
│       └── integration/
├── scripts/                   # evolution-cli, test-gemini-key
├── docker-compose.evolution.yml
├── .env.example
└── package.json
```

> Não há pasta `models/` — o schema Prisma define a estrutura de dados.

---

## Camadas da aplicação

### `server.js`
- Importa `app.js`, sobe na porta configurada.
- Inicializa jobs (`lembretes.job.js`, `cotacao-update.job.js`, `cotacao-cleanup.job.js`, `arquivamento-mapa.job.js`).

### `app.js`
- Middlewares globais: Helmet, CORS, JSON parser, logger.
- Monta rotas em `/api` via `routes/index.js`.
- `error.middleware.js` registrado por último.

### Controllers
Recebem `req`/`res`, delegam ao service e retornam via view. Erros propagados com `next(error)`.

| Controller | Responsabilidade |
| ---------- | -------------- |
| `auth.controller` | Login, cadastro, logout, me, recuperação de senha |
| `usuario.controller` | CRUD de usuários |
| `fazenda.controller` | CRUD de fazendas + detalhe/KPIs |
| `fazendaCultura.controller` | Vínculo cultura ↔ fazenda |
| `poligono.controller` | Talhões no mapa |
| `poligonoHistorico.controller` | Histórico/arquivamento de áreas |
| `cultura.controller` | Catálogo global |
| `colheita.controller` | Colheitas por safra |
| `gasto.controller` | Gastos operacionais |
| `lucro.controller` | Vendas e arrendamento |
| `estoque.controller` | Saldo e entregas de arrendamento |
| `insumo.controller` | Insumos/atividades |
| `lembrete.controller` | Lembretes, calendário, WhatsApp |
| `dashboard.controller` | KPIs consolidados |
| `cotacao.controller` | Dólar, euro, mercado |
| `simulacao.controller` | Simulação fiscal e histórico |
| `insights.controller` | Snapshots de IA |
| `chatbot.controller` | Sessões e mensagens do chat |
| `notificacao.controller` | Notificações in-app |
| `noticia.controller` | Feed RSS agro |

### Services
Concentram **regras de negócio**. Lançam `AppError` quando uma regra é violada.

Exemplos relevantes:
- **`fazendaCultura.service`** — exige talhão mapeado antes de vincular cultura; hectares calculados dos polígonos.
- **`lucro.service`** — valida estoque disponível antes de registrar venda.
- **`gasto.service`** — vincula gasto a colheita existente; gerencia status PAGO/PENDENTE.
- **`lembrete.service`** — recorrência, envio WhatsApp, status automático.
- **`simulacao.service`** — cálculo de abatimento com taxas IBPT, câmbio e corretagem.
- **`geometry.service`** — área de polígonos via Turf/PostGIS.
- **`chatbot.service`** — contexto da fazenda + Gemini para respostas naturais.

### Repositories
Única camada com acesso direto ao Prisma. Queries isoladas por domínio.

### Views
Formatam entidades para JSON de resposta — removem campos sensíveis e padronizam nomes (`camelCase`).

### Schemas (Zod)
Validam `body`, `query` e `params` via `validator.middleware.js`. Retornam 400 com mensagens claras.

### Middlewares

| Middleware | Função |
| ---------- | ------ |
| `auth.middleware` | Valida JWT, anexa `req.usuario` |
| `authorize(role)` | Restringe por papel (ex.: ADMIN) |
| `validator.middleware` | Valida com schema Zod |
| `error.middleware` | Captura erros, retorna JSON padronizado |
| `logger.middleware` | Log de requisições |
| `limitador.middleware` | Rate limiting (login) |

---

## Fluxo de uma requisição

```text
Cliente HTTP
     │
     ▼
routes/index.js  →  rota específica
     │
     ▼
auth.middleware  →  JWT válido?
validator        →  body/query válidos?
     │
     ▼
controller       →  chama service
     │
     ▼
service          →  regra de negócio
     │
     ▼
repository       →  Prisma → PostgreSQL
     │
     ▼
view             →  formata JSON
     │
     ▼
res.json({ status: "success", data: ... })

── Em caso de erro ──
service lança AppError → controller next(error) → error.middleware → 4xx/5xx
```

---

## Modelo de dados

Definido em `prisma/schema.prisma`. Entidades principais:

| Entidade | Descrição |
| -------- | --------- |
| `usuarios` | Usuários com role ADMIN/FUNCIONARIO |
| `usuarios_fazendas` | Vínculo N:N usuário ↔ fazenda |
| `fazendas` | Propriedades (própria, arrendada de/para terceiros) |
| `fazenda_culturas` | Cultura vinculada à fazenda + status operacional |
| `culturas` | Catálogo global (nome, cor, hectares) |
| `poligonos_fazenda` | Talhões georreferenciados (PostGIS) |
| `poligonos_fazenda_historico` | Áreas arquivadas após colheita |
| `colheitas` | Safras (fazenda, cultura, área, sacas, ano) |
| `gastos` | Despesas vinculadas a colheita |
| `lucros` | Vendas (colheita) ou arrendamento |
| `entregas_arrendamento` | Entregas de sacas em contratos de arrendamento |
| `insumos_atividades` | Registro de insumos por funcionário |
| `lembretes` | Lembretes com recorrência e WhatsApp |
| `notificacoes` | Alertas in-app |
| `cotacoes` | Cache de cotações USD/EUR |
| `simulacoes` | Histórico de simulações salvas |
| `insight_snapshots` | Cache de insights Gemini |
| `chat_sessoes` / `chat_mensagens` | Histórico do chat IA |

### Enums relevantes

| Enum | Valores |
| ---- | ------- |
| `role` | ADMIN, FUNCIONARIO |
| `tipo_fazenda` | PROPRIA, ARRENDADA_DE_TERCEIROS, ARRENDADA_PARA_TERCEIROS |
| `status_gasto` | PAGO, PENDENTE |
| `status_lembrete` | PENDENTE, ENVIADO, CANCELADO |
| `status_cultura` | PLANTIO, ADUBACAO, PULVERIZACAO, COLHEITA, SECAGEM |
| `recorrencia_lembrete` | NENHUMA, SEMANAL, MENSAL, TRIMESTRAL, ANUAL, OUTROS |
| `origem_lucro` | VENDA_COLHEITA, ARRENDAMENTO |

---

## Rotas da API

Prefixo base: **`/api`**. Autenticação via `Authorization: Bearer <token>` salvo indicação contrária.

### Saúde

| Método | Rota |
| ------ | ---- |
| GET | `/health` |

### Autenticação — `/auth`

| Método | Rota | Auth |
| ------ | ---- | ---- |
| POST | `/login` | — |
| POST | `/change-initial-password` | — |
| POST | `/cadastro` | JWT + ADMIN |
| POST | `/logout` | — |
| GET | `/recuperacao-config` | — |
| POST | `/esqueci-senha` | — |
| POST | `/redefinir-senha` | — |
| POST | `/change-password` | JWT |
| GET | `/me` | JWT |

### Usuários — `/usuarios` (ADMIN)

| Método | Rota |
| ------ | ---- |
| GET | `/` |
| GET | `/:id` |
| PUT | `/:id` |
| DELETE | `/:id` |

### Fazendas — `/fazendas`

| Método | Rota | Auth |
| ------ | ---- | ---- |
| GET | `/` | JWT |
| GET | `/:id` | JWT |
| GET | `/:id/detalhe` | JWT |
| POST | `/` | ADMIN |
| PUT | `/:id` | ADMIN |
| DELETE | `/:id` | ADMIN |
| GET | `/:fazendaId/culturas` | JWT |
| POST | `/:fazendaId/culturas` | JWT |
| PUT | `/:fazendaId/culturas/:id` | JWT |
| DELETE | `/:fazendaId/culturas/:id` | JWT |
| GET | `/:fazendaId/historico-mapa` | JWT |
| GET | `/:fazendaId/historico-mapa/:historicoId` | JWT |
| POST | `/:fazendaId/historico-mapa/:historicoId/restaurar` | JWT |

### Culturas — `/culturas`

| Método | Rota | Auth |
| ------ | ---- | ---- |
| GET | `/` | JWT |
| POST | `/` | ADMIN |
| PUT | `/:id` | ADMIN |
| DELETE | `/:id` | ADMIN |

### Polígonos — `/poligonos`

| Método | Rota |
| ------ | ---- |
| GET | `/` (query: `fazendaId`) |
| GET | `/:id` |
| POST | `/` |
| PUT | `/:id` |
| DELETE | `/:id` |
| POST | `/exportar` |
| POST | `/importar` |

### Colheitas — `/colheitas`

| Método | Rota |
| ------ | ---- |
| GET | `/` |
| GET | `/fazenda/:fazendaId` |
| GET | `/:id` |
| POST | `/` |
| PUT | `/:id` |
| DELETE | `/:id` |

### Gastos — `/gastos`

| Método | Rota |
| ------ | ---- |
| GET | `/` |
| GET | `/resumo` |
| GET | `/colheita/:colheitaId` |
| POST | `/` |
| PUT | `/:id` |
| DELETE | `/:id` |

### Lucros — `/lucros`

| Método | Rota |
| ------ | ---- |
| GET | `/` |
| GET | `/total` |
| GET | `/colheita/:colheitaId` |
| POST | `/` |
| PUT | `/:id` |
| DELETE | `/:id` |

### Estoque — `/estoque`

| Método | Rota |
| ------ | ---- |
| GET | `/` |
| GET | `/resumo` |
| GET | `/colheita/:colheitaId` |
| GET | `/arrendamentos-pendentes` |
| PATCH | `/arrendamento/:entregaId/confirmar` |
| PATCH | `/arrendamento/:entregaId/status` |

### Insumos — `/insumos`

| Método | Rota |
| ------ | ---- |
| GET | `/` |
| POST | `/` |
| PUT | `/:id` |
| DELETE | `/:id` |

### Lembretes — `/lembretes`

| Método | Rota | Auth |
| ------ | ---- | ---- |
| GET | `/` | JWT |
| GET | `/dia?data=YYYY-MM-DD` | JWT |
| GET | `/calendario?mes=&ano=` | JWT |
| GET | `/whatsapp/status` | — |
| POST | `/whatsapp/provisionar` | — |
| GET | `/:id` | JWT |
| POST | `/` | JWT |
| PUT | `/:id` | JWT |
| PATCH | `/:id/status` | JWT |
| DELETE | `/:id` | JWT |
| DELETE | `/` | JWT |
| POST | `/:id/enviar` | JWT |

### Dashboard — `/dashboard`

| Método | Rota | Query |
| ------ | ---- | ----- |
| GET | `/` | `fazendaId` (uuid ou `todas`) |

### Cotação — `/cotacao`

| Método | Rota |
| ------ | ---- |
| GET | `/dolar` |
| GET | `/euro` |
| GET | `/mercado` |

### Simulação — `/simulacao`

| Método | Rota |
| ------ | ---- |
| GET | `/dividas` |
| GET | `/historico` |
| POST | `/calcular-sacas` |
| POST | `/salvar` |
| DELETE | `/:id` |

### IA / Insights — `/ia`

| Método | Rota |
| ------ | ---- |
| GET | `/insights` |
| POST | `/insights/refresh` |

### Chatbot — `/chatbot`

| Método | Rota |
| ------ | ---- |
| GET | `/resumo` |
| GET | `/consultas-factuais` |
| GET | `/sessoes` |
| GET | `/sessoes/:id/mensagens` |
| PATCH | `/sessoes/:id` |
| DELETE | `/sessoes/:id` |
| POST | `/mensagens` |

### Notificações — `/notificacoes`

| Método | Rota |
| ------ | ---- |
| GET | `/` |
| PATCH | `/lidas` |
| PATCH | `/:id/lida` |

### Notícias — `/noticias`

| Método | Rota |
| ------ | ---- |
| GET | `/` |

---

## Regras de negócio

### Fazendas
- Tipo obrigatório: `PROPRIA`, `ARRENDADA_DE_TERCEIROS` ou `ARRENDADA_PARA_TERCEIROS`.
- Fazendas arrendadas podem ter cultura, quantidade de sacas e periodicidade de entrega.
- Funcionários só enxergam fazendas vinculadas (`usuarios_fazendas`).

### Culturas e vínculo
- Nome único no catálogo global; cor gerada automaticamente.
- Vincular cultura à fazenda exige **ao menos um talhão** dessa cultura no mapa.
- Hectares do vínculo são a **soma dos talhões** — não informados manualmente.
- Status operacional: PLANTIO, ADUBACAO, PULVERIZACAO, COLHEITA; SECAGEM apenas para café.

### Mapa / Polígonos
- Geometria PostGIS `Polygon, SRID 4326`.
- Área calculada automaticamente (`geometry.service` + Turf).
- Histórico arquiva talhões colhidos sem perder geometria.

### Colheitas
- Fazenda e cultura devem existir e estar vinculados.
- Sacas produzidas alimentam estoque.

### Gastos
- Vinculados a `colheitaId`.
- Status `PAGO` ou `PENDENTE`.
- Tipo livre (VARCHAR); `tipoPersonalizado` quando tipo = "OUTRO".

### Lucros
- `VENDA_COLHEITA`: valida estoque disponível (colheita − vendas).
- `ARRENDAMENTO`: vinculado à fazenda, com fluxo de recebimento.

### Estoque
- Saldo = sacas colhidas − sacas vendidas (por colheita/cultura).
- Entregas de arrendamento com confirmação de status.

### Lembretes
- `usuarioId` inferido do JWT — nunca confiar no body.
- Recorrência: SEMANAL, MENSAL, TRIMESTRAL, ANUAL, OUTROS (custom).
- Envio WhatsApp via Evolution API; job cron processa pendentes.
- Endpoints `/dia` e `/calendario` exigem query params validados (400 se ausentes).

### Simulação
- Calcula valor líquido após taxas (IBPT por NCM da cultura).
- Suporta BRL, USD e EUR com câmbio manual ou da API.
- Histórico persistido em `simulacoes`.

### Chat / Insights
- Contexto montado a partir de dados reais da fazenda (colheitas, gastos, estoque).
- Snapshots de insights cacheados em `insight_snapshots`.
- Chaves Gemini separadas: `GEMINI_API_KEY_CHATBOT` e `GEMINI_API_KEY_INSIGHTS`.

---

## Jobs agendados

| Job | Arquivo | Função |
| --- | ------- | ------ |
| Lembretes | `jobs/lembretes.job.js` | Envia lembretes pendentes via WhatsApp |
| Cotação update | `jobs/cotacao-update.job.js` | Atualiza cache USD/EUR |
| Cotação cleanup | `jobs/cotacao-cleanup.job.js` | Reset semanal do histórico |
| Arquivamento mapa | `jobs/arquivamento-mapa.job.js` | Arquiva talhões após colheita |

Na **Vercel**, os mesmos fluxos são disparados por cron HTTP em `/api/crons/*` (`crons.routes.js`).

---

## Integrações externas

| Serviço | Uso | Config |
| ------- | --- | ------ |
| Neon PostgreSQL | Banco principal | `DATABASE_URL`, `DIRECT_URL` |
| Google Gemini | Chat + Insights | `GEMINI_API_KEY_*` |
| Evolution API | WhatsApp | `EVOLUTION_*` |
| IBPT / Valraw | Taxas na simulação | `IBPT_*` |
| Resend | E-mail transacional | `RESEND_API_KEY`, `RESEND_FROM` |
| Open-Meteo / geocoding | Clima nas notícias | serviço em `shared/noticias/` |
| RSS externos | Feed de notícias | `noticia.sources.js` |

---

## Autenticação e autorização

1. Login retorna JWT + objeto `usuario` + `menu` filtrado por role.
2. `auth.middleware` decodifica token e popula `req.usuario`.
3. `authorize('ADMIN')` restringe rotas administrativas.
4. Menu dinâmico definido em `shared/navigation/menu.config.js` → `buildMenuForRole(role)`.
5. Funcionários têm acesso filtrado por `fazendasVinculadas` nos services.

---

## Padrão de erros

```json
{
  "status": "error",
  "message": "Descrição clara",
  "issues": []
}
```

| HTTP | Situação |
| ---- | -------- |
| 400 | Validação Zod ou regra de negócio |
| 401 | Token ausente/inválido |
| 403 | Papel insuficiente |
| 404 | Recurso inexistente |
| 409 | Conflito (duplicidade) |
| 500 | Erro interno |

Sucesso:

```json
{
  "status": "success",
  "data": { }
}
```

---

## Testes

```bash
npm test
npm run test:coverage
```

Estrutura:
- **`tests/unit/`** — services, schemas, utils (mocks de repository).
- **`tests/integration/`** — fluxo HTTP completo por domínio.

Arquivos notáveis: `lembrete.recorrencia.spec.js`, `simulacao.service.spec.js`, `geometry.service.spec.js`, `dashboard.service.spec.js`.

---

## Como rodar

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:seed
npm run dev
```

> Banco Neon já provisionado. Usar `db:generate`, não `migrate dev`, sem alinhamento da equipe.

---

## Variáveis de ambiente

Ver [`.env.example`](../.env.example). Grupos principais:

| Grupo | Variáveis |
| ----- | --------- |
| Servidor | `PORT`, `NODE_ENV`, `CORS_ORIGIN`, `WEB_APP_URL` |
| Banco | `DATABASE_URL`, `DIRECT_URL` |
| Auth | `JWT_SECRET`, `JWT_EXPIRES_IN`, `RESEND_API_KEY`, `RESEND_FROM`, `WEB_APP_URL` |
| IA | `GEMINI_API_KEY_CHATBOT`, `GEMINI_API_KEY_INSIGHTS` |
| WhatsApp | `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE` |
| Simulação | `IBPT_ENABLED`, `IBPT_UF`, `IBPT_TOKEN`, … |
| Cotação | `COTACAO_CLEANUP_CRON`, `COTACAO_CLEANUP_TIMEZONE` |
