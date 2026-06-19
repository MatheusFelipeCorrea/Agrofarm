# Código do Projeto

Mantenha neste diretório todo o código do projeto. Se necessário, descreva neste arquivo aspectos relevantes da estrutura de diretórios criada para organização do código.


# 🚀 Como rodar o projeto Agrofarm

## ✅ Pré-requisitos

| Ferramenta | Versão mínima | Verificar |
|------------|--------------|-----------|
| Node.js | 20.0.0 | `node -v` |
| npm | 10.0.0 | `npm -v` |
| Git | qualquer | `git -v` |

---

## 📦 1. Clonar o repositório

```bash
git clone https://github.com/[org]/[repo].git
cd [repo]/Codigo
```

---

## ⚙️ 2. Configurar o Backend

```bash
# Entrar na pasta
cd Agrofarm/api

# Instalar dependências
npm install

# Copiar o .env
cp .env.example .env
# → solicitar o .env preenchido ao Jesus
```

### O `.env` deve ter:
```env
PORT=3333
NODE_ENV=development

DATABASE_URL="postgresql://..."   ← pedir pro Jesus
DIRECT_URL="postgresql://..."     ← pedir pro Jesus

JWT_SECRET=
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173

EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=

GEMINI_API_KEY=
```

```bash
# Gerar o client do Prisma
npm run db:generate

# Popular o banco (apenas na primeira vez)
npm run db:seed

# Rodar o servidor
npm run dev
# → http://localhost:3333
```

---

## 🌐 3. Configurar o Frontend

```bash
# Voltar para a raiz e entrar no frontend
cd ../web

# Instalar dependências
npm install

# Copiar o .env
cp .env.example .env
```

### O `.env` deve ter:
```env
VITE_API_URL=http://localhost:3333/api
```

```bash
# Rodar o frontend
npm run dev
# → http://localhost:5173
```

---

## ▶️ Rodando os dois juntos

```bash
# Terminal 1 — Backend
cd Agrofarm/api
npm run dev

# Terminal 2 — Frontend
cd Agrofarm/web
npm run dev
```

---

## ⚠️ Pontos importantes

```
→ Nunca commitar o .env
→ Nunca rodar npm run db:migrate
(banco já está criado no Neon)
→ Sempre usar npm run db:generate
após mudanças no schema.prisma
→ Node.js 20+ obrigatório
```

---

## 📋 Scripts Backend

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor com hot reload |
| `npm start` | Servidor produção |
| `npm test` | Testes |
| `npm run db:generate` | Gera client Prisma |
| `npm run db:pull` | Sincroniza schema com banco |
| `npm run db:studio` | Interface visual do banco |
| `npm run db:seed` | Dados iniciais |

## 📋 Scripts Frontend

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Interface com hot reload |
| `npm run build` | Build de produção |
| `npm test` | Testes |
| `npm run lint` | Qualidade de código |

---

## 📲 WhatsApp (Evolution API)

Integração implementada no backend para lembretes:

- `GET /api/lembretes/whatsapp/status` → status da configuração Evolution.
- `POST /api/lembretes/whatsapp/provisionar` → cria instância e retorna QR/pairing para conexão.
- `POST /api/lembretes/:id/enviar` → dispara envio manual de um lembrete.
- Job automático em `src/jobs/lembretes.job.js` para processar lembretes pendentes.
- Infra local: `docker compose -f Codigo/Agrofarm/api/docker-compose.evolution.yml up -d`.