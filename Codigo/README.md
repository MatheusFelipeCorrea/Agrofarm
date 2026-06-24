# Código — AgroFarm

Este diretório concentra todo o código executável do projeto. A aplicação é dividida em dois pacotes independentes dentro de `Agrofarm/`:

| Pacote | Stack | Porta padrão |
| ------ | ----- | ------------ |
| **`api/`** | Node.js · Express · Prisma · PostgreSQL | `3333` |
| **`web/`** | React 19 · Vite 6 · Tailwind CSS 4 | `5173` |

---

## Pré-requisitos

| Ferramenta | Versão mínima | Verificar |
| ---------- | ------------- | --------- |
| Node.js | 20.0.0 | `node -v` |
| npm | 10.0.0 | `npm -v` |
| Git | qualquer | `git --version` |
| Docker | opcional | Evolution API local (WhatsApp) |

---

## Setup inicial

### 1. Clonar e entrar no repositório

```bash
git clone https://github.com/ICEI-PUC-Minas-PMGES-TI/pmg-es-2026-1-ti4-3170100-agrofarm.git
cd pmg-es-2026-1-ti4-3170100-agrofarm/Codigo
```

### 2. Backend (`Agrofarm/api`)

```bash
cd Agrofarm/api
npm install
cp .env.example .env
# Preencher .env com credenciais fornecidas pela equipe
npm run db:generate
npm run db:seed          # primeira vez apenas
npm run dev
```

Servidor em **http://localhost:3333** · health check: `GET /api/health`

### 3. Frontend (`Agrofarm/web`)

```bash
cd ../web
npm install
cp .env.example .env
npm run dev
```

Interface em **http://localhost:5173**

---

## Variáveis de ambiente

### API (`Agrofarm/api/.env`)

| Variável | Obrigatória | Descrição |
| -------- | ----------- | --------- |
| `PORT` | Sim | Porta do servidor (padrão `3333`) |
| `DATABASE_URL` | Sim | Connection string PostgreSQL (Neon) |
| `DIRECT_URL` | Sim | URL direta para migrations/Prisma |
| `JWT_SECRET` | Sim | Segredo para assinatura de tokens |
| `JWT_EXPIRES_IN` | Sim | Expiração do JWT (ex.: `7d`) |
| `CORS_ORIGIN` | Sim | Origens permitidas (ex.: `http://localhost:5173`) |
| `GEMINI_API_KEY_CHATBOT` | Sim* | Chave Gemini para o chat IA |
| `GEMINI_API_KEY_INSIGHTS` | Sim* | Chave Gemini para insights |
| `EVOLUTION_API_URL` | Não | URL da Evolution API (WhatsApp) |
| `EVOLUTION_API_KEY` | Não | Chave de autenticação Evolution |
| `EVOLUTION_INSTANCE` | Não | Nome da instância WhatsApp |
| `IBPT_*` | Não | Configuração de estimativa fiscal na simulação |

\* Necessárias para funcionalidades de IA. Sem elas, chat e insights retornam erro controlado.

Consulte `.env.example` para a lista completa com comentários.

### Web (`Agrofarm/web/.env`)

```env
VITE_API_URL=http://localhost:3333/api
```

---

## Scripts — Backend

| Script | Descrição |
| ------ | --------- |
| `npm run dev` | Servidor com hot reload (`node --watch`) |
| `npm run dev:stable` | Servidor sem watch |
| `npm start` | Produção |
| `npm test` | Testes unitários e de integração (Vitest) |
| `npm run test:coverage` | Cobertura de testes |
| `npm run lint` | ESLint |
| `npm run db:generate` | Gera Prisma Client após mudanças no schema |
| `npm run db:pull` | Sincroniza schema a partir do banco |
| `npm run db:studio` | Interface visual Prisma Studio |
| `npm run db:seed` | Usuário administrador inicial |
| `npm run db:seed:mega` | Dados de demonstração extensos |
| `npm run db:verify` | Verifica conectividade e integridade |
| `npm run evolution:status` | Status da instância WhatsApp |
| `npm run evolution:provisionar -- <numero>` | Provisiona instância + QR Code |
| `npm run cotacao:cleanup` | Limpeza manual do histórico de cotações |

---

## Scripts — Frontend

| Script | Descrição |
| ------ | --------- |
| `npm run dev` | Vite dev server com HMR |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Preview do build local |
| `npm test` | Testes (Vitest) |
| `npm run test:coverage` | Cobertura |
| `npm run lint` | ESLint |

---

## WhatsApp (Evolution API)

Integração opcional para envio automático de lembretes.

```bash
cd Agrofarm/api
docker compose -f docker-compose.evolution.yml up -d
```

Endpoints relevantes:

- `GET /api/lembretes/whatsapp/status` — status da conexão
- `POST /api/lembretes/whatsapp/provisionar` — cria instância e retorna QR
- `POST /api/lembretes/:id/enviar` — envio manual

Job agendado em `src/jobs/lembretes.job.js` processa lembretes pendentes automaticamente.

---

## Boas práticas

- **Nunca commitar** arquivos `.env`.
- Após alterar `schema.prisma`, executar `npm run db:generate` no backend.
- O banco Neon já está provisionado — **não executar** `prisma migrate dev` sem alinhamento com a equipe.
- Node.js **20+** é obrigatório (compatibilidade com dependências recentes).
- Documentação detalhada de arquitetura:
  - API → [`Agrofarm/api/Documents/Readme.md`](Agrofarm/api/Documents/Readme.md)
  - Web → [`Agrofarm/web/Documents/Readme.md`](Agrofarm/web/Documents/Readme.md)

---

## Fluxo de desenvolvimento

```text
Alteração no schema.prisma
        │
        ▼
npm run db:generate (api)
        │
        ▼
Implementar repository → service → controller → routes
        │
        ▼
Implementar service → queries → página (web)
        │
        ▼
npm test (api + web)
```
