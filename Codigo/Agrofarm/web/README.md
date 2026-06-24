# AgroFarm — Web

Interface do AgroFarm: **React 19 + Vite 6 + Tailwind CSS 4**.

Documentação completa: [`Documents/Readme.md`](Documents/Readme.md)

---

## Início rápido

```bash
npm install
cp .env.example .env
npm run dev
```

**URL:** `http://localhost:5173`

> O backend deve estar rodando em `http://localhost:3333` com `VITE_API_URL=http://localhost:3333/api`.

---

## Pré-requisitos

| Ferramenta | Versão mínima |
| ---------- | ------------- |
| Node.js | 20.0.0 |
| npm | 10.0.0 |

---

## Scripts

| Script | Descrição |
| ------ | --------- |
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Preview do build local |
| `npm test` | Testes (Vitest) |
| `npm run test:coverage` | Cobertura de testes |
| `npm run lint` | ESLint |

---

## Variáveis de ambiente

```env
VITE_API_URL=http://localhost:3333/api
```

---

## Telas principais

| Rota | Página | Acesso |
| ---- | ------ | ------ |
| `/login` | Login | Público |
| `/recuperar-senha` | Recuperação de senha | Público |
| `/redefinir-senha` | Redefinição com token | Público |
| `/trocar-senha-inicial` | Troca obrigatória no primeiro acesso | Público |
| `/` | Dashboard | Autenticado (ADMIN) |
| `/fazendas` | Lista de fazendas | Autenticado (ADMIN) |
| `/fazendas/:id` | Detalhe (visão geral, culturas, mapa, histórico) | Autenticado (ADMIN) |
| `/colheitas` | Colheitas | Autenticado (ADMIN) |
| `/gastos` | Gastos | Autenticado (ADMIN) |
| `/lucros` | Lucros | Autenticado (ADMIN) |
| `/estoque` | Estoque | Autenticado (ADMIN) |
| `/insumos` | Insumos | Autenticado (ADMIN / FUNCIONARIO) |
| `/lembretes` | Lembretes e calendário | Autenticado (ADMIN) |
| `/simulacao` | Simulação de dívidas | ADMIN |
| `/insights` | Insights inteligentes | ADMIN |
| `/chatbot` | Chat IA | Autenticado (ADMIN) |
| `/noticias` | Notícias e clima | Autenticado (ADMIN) |
| `/usuarios` | Gestão de usuários | ADMIN |

O menu lateral é montado dinamicamente a partir do campo `menu` retornado no login (`buildMenuForRole` no backend).

---

## Stack

| Tecnologia | Uso |
| ---------- | --- |
| React 19 | Interface |
| Vite 6 | Build e dev server |
| Tailwind CSS 4 | Estilização |
| TanStack Query 5 | Cache e mutations |
| Zustand | Estado global (auth, UI) |
| React Router 6 | Rotas |
| Radix UI | Dialogs, selects, popovers acessíveis |
| MapLibre GL | Mapa de talhões |
| Recharts | Gráficos do dashboard |
| Axios | HTTP |
| Zod | Validação client-side |
| Sonner | Toasts de feedback |

---

## Estrutura resumida

```text
src/
├── pages/          # Telas (Dashboard, Fazendas, Gastos…)
├── components/     # UI reutilizável + domínio (gastos, lembretes…)
├── layouts/        # MainLayout (sidebar + header)
├── routes/         # ProtectedRoute, AdminRoute, routeAccess
├── queries/        # Hooks TanStack Query por domínio
├── services/       # Chamadas HTTP (axios)
├── store/          # Zustand (authStore)
├── hooks/          # Hooks compartilhados
├── utils/          # Formatadores, validadores
└── styles/         # CSS global e módulos
```

---

## Após clonar ou atualizar

```bash
npm install
cp .env.example .env
npm run dev
```

Se houver mudanças no backend, reinicie também a API e confirme que `VITE_API_URL` aponta para o servidor correto.
