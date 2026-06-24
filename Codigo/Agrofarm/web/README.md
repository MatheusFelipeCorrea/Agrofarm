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
| `npm run vercel-build` | Build usado no deploy Vercel |
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

O acesso efetivo é controlado pelo **menu retornado no login** (`buildMenuForRole` + `routeAccess.js`). A tabela abaixo resume as rotas; guards extras aplicam `AdminRoute` onde indicado.

| Rota | Página | Guard |
| ---- | ------ | ----- |
| `/login` | Login | Público |
| `/recuperar-senha` | Recuperação de senha | AuthPageRoute |
| `/redefinir-senha` | Redefinição com token | AuthPageRoute |
| `/trocar-senha-inicial` | Troca obrigatória no primeiro acesso | Público |
| `/alterar-senha` | Alterar senha (logado) | PrivateRoute |
| `/` | Dashboard | PrivateRoute (menu ADMIN) |
| `/fazendas` | Lista de fazendas | PrivateRoute |
| `/fazendas/:id` | Detalhe (visão geral, culturas, mapa, histórico) | PrivateRoute |
| `/colheitas` | Colheitas | PrivateRoute |
| `/gastos` | Gastos | PrivateRoute |
| `/lucros` | Lucros | PrivateRoute |
| `/estoque` | Estoque | PrivateRoute |
| `/insumos` | Insumos | PrivateRoute (ADMIN e FUNCIONARIO) |
| `/lembretes` | Lembretes e calendário | PrivateRoute |
| `/simulacao` | Simulação de dívidas | AdminRoute |
| `/insights` | Insights inteligentes | AdminRoute |
| `/chatbot` | Chat IA | PrivateRoute |
| `/noticias` | Notícias e clima | PrivateRoute |
| `/usuarios` | Gestão de usuários | AdminRoute |

Redirect legado: `/insights-inteligentes` → `/insights`.

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
