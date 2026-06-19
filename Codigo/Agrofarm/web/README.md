## ▶️ Como Rodar

```bash
# 1. Entrar na pasta do frontend
cd Agrofarm/web

# 2. Instalar dependências
npm install

# 3. Copiar o .env
cp .env.example .env

# 4. Rodar em desenvolvimento
npm run dev
# → aplicação rodando em http://localhost:5173
```

---

## 📋 Descrição dos Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Sobe o servidor de desenvolvimento com hot reload |
| `npm run build` | Gera o build de produção na pasta `dist/` |
| `npm run preview` | Visualiza o build de produção localmente |
| `npm run lint` | Verifica qualidade do código com ESLint |
| `npm test` | Roda todos os testes |
| `npm run test:coverage` | Roda os testes com relatório de cobertura |

---

## ⚠️ Ordem importante

Sempre que **clonar ou atualizar** o projeto:

```bash
cd Agrofarm/web
npm install
cp .env.example .env
npm run dev
```

---

## ✅ Pré-requisitos

Antes de começar, garanta que tem instalado:

| Ferramenta | Versão mínima |
|------------|--------------|
| Node.js | 18.0.0 |
| npm | 8.0.0 |

```bash
# Verificar versões
node -v
npm -v
`

---
