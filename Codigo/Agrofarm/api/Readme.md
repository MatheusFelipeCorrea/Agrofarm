# AgroFarm — API

Backend HTTP do AgroFarm: **Node.js + Express + Prisma + PostgreSQL**.

Documentação completa: [`Documents/Readme.md`](Documents/Readme.md)

---

## Início rápido

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:seed        # primeira vez
npm run dev
```

**URL base:** `http://localhost:3333/api`

**Health check:** `GET /api/health`

---

## Autenticação

Todas as rotas (exceto login, cadastro, recuperação de senha e health) exigem header:

```http
Authorization: Bearer <token>
```

### Endpoints de sessão

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| `POST` | `/api/auth/login` | Login — retorna `token`, `usuario` e `menu` |
| `POST` | `/api/auth/cadastro` | Cadastro (ADMIN cria usuários) |
| `POST` | `/api/auth/logout` | Encerra sessão |
| `GET` | `/api/auth/me` | Dados do usuário autenticado + menu |
| `POST` | `/api/auth/esqueci-senha` | Envia link de redefinição por e-mail |
| `POST` | `/api/auth/redefinir-senha` | Redefine senha com token |

### Contrato de login

```json
{
  "token": "jwt...",
  "usuario": {
    "id": "uuid",
    "nome": "Nome",
    "email": "email@dominio.com",
    "role": "ADMIN",
    "telefone": "31999999999",
    "fazendasVinculadas": [{ "id": "uuid", "nome": "Fazenda A" }]
  },
  "menu": [{ "id": "dashboard", "label": "Dashboard", "path": "/", "icon": "dashboard", "children": [] }]
}
```

**Cadastro:** `FUNCIONARIO` exige `fazendaIds` com ao menos uma fazenda. `ADMIN` pode omitir.

---

## Módulos da API

| Prefixo | Domínio |
| ------- | ------- |
| `/api/auth` | Autenticação e sessão |
| `/api/usuarios` | Gestão de usuários (ADMIN) |
| `/api/fazendas` | Fazendas, culturas vinculadas, histórico de mapa |
| `/api/culturas` | Catálogo global de culturas |
| `/api/poligonos` | Talhões georreferenciados |
| `/api/colheitas` | Colheitas por safra |
| `/api/gastos` | Gastos operacionais |
| `/api/lucros` | Vendas e arrendamento |
| `/api/estoque` | Saldo de sacas e entregas de arrendamento |
| `/api/insumos` | Registro de insumos/atividades |
| `/api/lembretes` | Lembretes, calendário, WhatsApp |
| `/api/dashboard` | KPIs e gráficos consolidados |
| `/api/cotacao` | Dólar, euro e painel de mercado |
| `/api/simulacao` | Simulação de abatimento de dívida |
| `/api/ia` | Insights inteligentes (Gemini) |
| `/api/chatbot` | Chat IA com sessões persistentes |
| `/api/notificacoes` | Notificações in-app |
| `/api/noticias` | Feed de notícias agro e clima |
| `/api/crons` | Jobs HTTP (Vercel Cron: cotações, lembretes, mapa) |

---

## WhatsApp (Evolution API)

```bash
docker compose -f docker-compose.evolution.yml up -d
npm run evolution:provisionar -- 5531999999999
```

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| `GET` | `/api/lembretes/whatsapp/status` | Status da instância |
| `POST` | `/api/lembretes/whatsapp/provisionar` | Cria instância + QR Code |
| `POST` | `/api/lembretes/:id/enviar` | Envio manual imediato |

---

## Scripts

| Script | Descrição |
| ------ | --------- |
| `npm run dev` | Desenvolvimento com hot reload |
| `npm start` | Produção |
| `npm test` | Vitest |
| `npm run test:coverage` | Cobertura |
| `npm run lint` | ESLint |
| `npm run db:generate` | Prisma generate |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | Seed administrador |
| `npm run db:push` | Aplica schema ao banco |
| `npm run evolution:conectar` | Reconecta WhatsApp |
| `npm run test:gemini-key` | Valida chaves Gemini |
| `npm run evolution:status` | Status WhatsApp |
| `npm run evolution:provisionar -- <numero>` | Provisionar instância |

---

## Variáveis de ambiente

Consulte [`.env.example`](.env.example) para a lista completa. Principais:

```env
PORT=3333
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY_CHATBOT=
GEMINI_API_KEY_INSIGHTS=
RESEND_API_KEY=
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=agrofarm
```

---

## Padrão de erros

```json
{
  "status": "error",
  "message": "Descrição clara do problema"
}
```

| Código | Situação |
| ------ | -------- |
| 400 | Dados inválidos ou regra de negócio violada |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex.: nome duplicado) |
| 500 | Erro interno |
