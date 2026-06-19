## ▶️ Como Rodar

```bash
# 1. Clonar o repositório
git clone https://github.com/seu-usuario/projeto.git

# 2. Entrar na pasta do backend
cd Agrofarm/api

# 3. Instalar dependências
npm install

# 4. Copiar o .env
cp .env.example .env
# → abrir o .env e preencher com os dados reais (Pegar com o Matheus)

# 4) Gerar client do Prisma
npm run db:generate

# 6. Popular o banco com dados iniciais (apenas na primeira vez)
npm run db:seed

# 6) Subir API
npm run dev
```

API: `http://localhost:3333`

## 📲 Evolution API (WhatsApp) — setup 100% local com Docker

O projeto inclui `docker-compose.evolution.yml` pronto.

### 1) Subir Evolution + Redis + Postgres

```bash
cd Codigo/Agrofarm/api
docker compose -f docker-compose.evolution.yml up -d
```

Por padrão:
- Evolution em `http://localhost:8080`
- `AUTHENTICATION_API_KEY=agrofarm-evolution-dev-key-2026`

### 2) Validar status no backend

```bash
GET /api/lembretes/whatsapp/status
```

### 3) Provisionar instância e gerar QR Code

Via endpoint:

```bash
POST /api/lembretes/whatsapp/provisionar
```

Body opcional:

```json
{ "numero": "5531999999999" }
```

Ou via script:

```bash
npm run evolution:provisionar -- 5531999999999
```

Depois, escaneie o QR com o WhatsApp que será o número remetente da instância.

## 🔑 Variáveis de ambiente da API

Obrigatórias:
- `PORT`
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGIN`

Integrações:
- `EVOLUTION_API_URL`
- `EVOLUTION_API_KEY`
- `EVOLUTION_INSTANCE`
- `GEMINI_API_KEY`

## 🧪 Endpoints principais de lembretes/WhatsApp

- `GET /api/health`
- `GET /api/lembretes`
- `GET /api/lembretes/:id`
- `POST /api/lembretes`
- `PUT /api/lembretes/:id`
- `DELETE /api/lembretes/:id`
- `POST /api/lembretes/:id/enviar`
- `GET /api/lembretes/whatsapp/status`
- `POST /api/lembretes/whatsapp/provisionar`

## 🔐 Endpoints de autenticação e sessão

- `POST /api/auth/login`
- `POST /api/auth/cadastro`
- `POST /api/auth/logout`
- `POST /api/auth/esqueci-senha`
- `POST /api/auth/redefinir-senha`
- `GET /api/auth/me`

### Contrato de sessão autenticada

`POST /api/auth/login` e `GET /api/auth/me` retornam:

```json
{
	"token": "jwt-opcional-em-auth-me",
	"usuario": {
		"id": "uuid",
		"nome": "Nome",
		"email": "email@dominio.com",
		"role": "ADMIN|FUNCIONARIO",
		"telefone": "31999999999",
		"criadoEm": "2026-04-25T00:00:00.000Z",
		"fazendasVinculadas": [{ "id": "uuid", "nome": "Fazenda A" }]
	},
	"menu": [
		{
			"id": "dashboard",
			"label": "Dashboard",
			"path": "/",
			"icon": "dashboard",
			"children": []
		}
	]
}
```

Observacao:
- Em `GET /api/auth/me`, o campo `token` nao e retornado.

### Cadastro de usuário com vínculos de fazenda

`POST /api/auth/cadastro` aceita:

```json
{
	"nome": "Usuario",
	"email": "usuario@agrofarm.com",
	"senha": "123456",
	"role": "ADMIN|FUNCIONARIO",
	"telefone": "31999999999",
	"fazendaIds": ["uuid-fazenda-1", "uuid-fazenda-2"]
}
```

Regra:
- `FUNCIONARIO` exige ao menos 1 item em `fazendaIds`.
- `ADMIN` pode enviar `fazendaIds` vazio.

## 📋 Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Desenvolvimento com `node --watch` |
| `npm start` | Execução padrão |
| `npm run lint` | ESLint em `src` |
| `npm test` | Vitest |
| `npm run test:coverage` | Cobertura de testes |
| `npm run db:pull` | Prisma db pull |
| `npm run db:generate` | Prisma generate |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | Seed inicial |
| `npm run evolution:status` | Estado da conexão da instância |
| `npm run evolution:provisionar -- <numero>` | Cria instância e retorna QR/pairing |
| `npm run evolution:conectar` | Requisita novo QR/pairing |