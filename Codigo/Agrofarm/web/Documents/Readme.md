# Web — Documentação Técnica

Interface do AgroFarm construída com **React 19 + Vite 6 + Tailwind CSS 4**, organizada em **páginas, componentes, services e queries (TanStack Query)**, com estado global via **Zustand**.

---

## Índice

- [Tecnologias](#tecnologias)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Camadas da aplicação](#camadas-da-aplicação)
- [Fluxo de dados](#fluxo-de-dados)
- [Autenticação e rotas](#autenticação-e-rotas)
- [Menu dinâmico](#menu-dinâmico)
- [Páginas e funcionalidades](#páginas-e-funcionalidades)
- [Componentes compartilhados](#componentes-compartilhados)
- [Queries e invalidação de cache](#queries-e-invalidação-de-cache)
- [Estado global](#estado-global)
- [Mapa de talhões](#mapa-de-talhões)
- [Acessibilidade e UI](#acessibilidade-e-ui)
- [Testes](#testes)
- [Como rodar](#como-rodar)
- [Variáveis de ambiente](#variáveis-de-ambiente)

---

## Tecnologias

| Tecnologia | Uso |
| ---------- | --- |
| React 19 | Biblioteca de UI |
| Vite 6 | Bundler e dev server |
| Tailwind CSS 4 | Estilização utility-first |
| React Router DOM 6 | Roteamento SPA |
| TanStack Query 5 | Cache server-side, mutations |
| Zustand 4 | Estado global (auth, UI) |
| Axios | Cliente HTTP |
| Zod | Validação de formulários |
| Radix UI | Primitivos acessíveis (Dialog, Select, Popover) |
| MapLibre GL + react-map-gl | Mapa interativo de talhões |
| @turf/area, centroid, kinks | Geometria no cliente |
| Recharts | Gráficos (dashboard, simulação) |
| date-fns + react-day-picker | Datas |
| Sonner | Toasts de feedback |
| Lucide React | Ícones |
| Vitest 3 | Testes unitários |

---

## Estrutura de pastas

```text
Agrofarm/web/
├── public/                    # Assets estáticos
├── src/
│   ├── main.jsx               # Entry — QueryClient + Router
│   ├── App.jsx                # Definição de rotas
│   ├── assets/                # Imagens, logos
│   ├── pages/                 # Uma pasta por tela
│   │   ├── Auth/              # Login, recuperar/redefinir senha
│   │   ├── Dashboard/
│   │   ├── Fazendas/          # Lista, detalhe, mapa, polígonos
│   │   ├── Colheitas/
│   │   ├── Gastos/
│   │   ├── Lucros/
│   │   ├── Estoque/
│   │   ├── Insumos/
│   │   ├── Lembretes/
│   │   ├── Simulacao/
│   │   ├── Insights/
│   │   ├── Chatbot/
│   │   ├── Noticias/
│   │   └── Usuarios/
│   ├── components/
│   │   ├── ui/                # Design system (Button, Modal, Select…)
│   │   ├── dialogs/           # AgroFormDialog, AgroConfirmDialog
│   │   ├── shared/            # Header, Sidebar, Breadcrumbs, ChatFab
│   │   ├── fazenda/           # Modais e painéis de fazenda
│   │   ├── cultura/           # Ícones, painel de gestão
│   │   ├── gastos/            # GastoFormModal
│   │   ├── lucros/            # LucroFormModal
│   │   ├── lembretes/         # Calendário, cards, formulário
│   │   ├── estoque/           # Detalhe de estoque
│   │   └── usuarios/          # Tabela e modais de usuário
│   ├── layouts/
│   │   └── MainLayout.jsx     # Sidebar + Header + conteúdo
│   ├── routes/
│   │   ├── ProtectedRoute.jsx # PrivateRoute, PublicRoute, AdminRoute
│   │   └── routeAccess.js     # Validação de paths pelo menu
│   ├── queries/               # Hooks TanStack Query por domínio
│   ├── services/              # Funções HTTP (axios)
│   ├── store/
│   │   └── authStore.js       # Token, usuário, menu
│   ├── hooks/                 # useClientPagination, usePageBreadcrumbs…
│   ├── utils/                 # formatters, apiError, culturaStatus…
│   ├── lib/                   # notify, mutationProps, utils (cn)
│   ├── constants/             # createButton, etc.
│   └── styles/                # globals.css, gerenciamento-usuarios.css
├── .env.example
├── vite.config.js
└── package.json
```

---

## Camadas da aplicação

### `main.jsx`
- Monta `<App />` no DOM.
- Configura `QueryClientProvider` (TanStack Query).
- Importa estilos globais.

### `App.jsx`
- Define todas as rotas com `BrowserRouter`.
- `PageProgressBar` — indicador de navegação no topo.
- `FloatingChatFab` — atalho flutuante para o chat (quando permitido).
- `useSessionQuery` — revalida sessão ao carregar.

### Páginas (`pages/`)
Montam telas completas. Consomem `queries/`, gerenciam estado local (`useState`) e compõem `components/`.

**Regra:** páginas não fazem `fetch` direto — delegam a `services/` via hooks de query/mutation.

### Componentes

| Pasta | Responsabilidade |
| ----- | ---------------- |
| `components/ui/` | Primitivos visuais reutilizáveis (Button, Modal, Select, DataTable, DatePicker…) |
| `components/dialogs/` | `AgroFormDialog`, `AgroConfirmDialog` — padrão de modais |
| `components/shared/` | Header, Sidebar, Breadcrumbs, notificações |
| `components/{domínio}/` | Modais e blocos específicos (GastoFormModal, LembreteCardList…) |

### Services (`services/`)
Funções async que chamam a API via `api.js` (axios configurado).

```text
services/
├── api.js                 # Instância axios + interceptors JWT/401
├── auth/auth.service.js
├── fazenda/fazenda.service.js
├── cultura/cultura.service.js
├── colheita/colheita.service.js
├── gasto/gasto.service.js
├── lucro/lucro.service.js
├── estoque/estoque.service.js
├── insumo/insumo.service.js
├── lembrete/lembrete.service.js
├── dashboard/dashboard.service.js
├── cotacao/cotacao.service.js
├── simulacao/simulacao.service.js
├── chatbot/chatbot.service.js
├── ia/insights.service.js
├── noticia/noticia.service.js
├── notificacao/notificacao.service.js
└── poligono/poligono.service.js
```

### Queries (`queries/`)
Hooks TanStack Query — gerenciam loading, error, cache e invalidação.

```text
queries/
├── auth/          useAuthQueries, useSessionQuery
├── usuario/       useUsuarioQueries
├── fazenda/       useFazendaQueries, useFazendaHistoricoQueries
├── cultura/       useCulturaQueries
├── colheita/      useColheitaQueries
├── gasto/         useGastoQueries
├── lucro/         useLucroQueries
├── estoque/       useEstoqueQueries
├── insumo/        useInsumoQueries
├── lembrete/      useLembreteQueries
├── dashboard/     useDashboardQueries
├── cotacao/       useCotacaoQueries
├── simulacao/     useSimulacaoQueries
├── chatbot/       useChatbotQueries
├── ia/            useIAQueries
├── noticia/       useNoticiasQueries
├── notificacao/   useNotificacaoQueries
├── poligono/      usePoligonoQueries
└── weather/       useWeatherForecastQuery
```

---

## Fluxo de dados

```text
Usuário interage com a página
         │
         ▼
useXxxQuery / useXxxMutation  (TanStack Query)
         │
         ▼
xxx.service.js  (axios → VITE_API_URL)
         │
         ▼
API Express  (/api/...)
         │
         ▼
Cache React Query atualizado
         │
         ▼
Componente re-renderiza

── Erro ──
axios interceptor → notify.error / logout em 401
mutation onError → toast via mutationProps.js
```

---

## Autenticação e rotas

### Guards (`routes/ProtectedRoute.jsx`)

| Componente | Comportamento |
| ---------- | ------------- |
| `PublicRoute` | Redireciona autenticados para primeira rota do menu |
| `PrivateRoute` | Exige token; valida path contra menu (`routeAccess.js`) |
| `AdminRoute` | Exige role ADMIN |

### Rotas públicas

| Rota | Página |
| ---- | ------ |
| `/login` | Login |
| `/recuperar-senha` | Solicitar reset |
| `/redefinir-senha` | Nova senha com token |
| `/trocar-senha-inicial` | Troca obrigatória |
| `/alterar-senha` | Alterar senha (logado; sempre permitido em `routeAccess`) |

### Rotas privadas

| Rota | Página | Guard |
| ---- | ------ | ----- |
| `/` | Dashboard | PrivateRoute |
| `/fazendas` | Fazendas | PrivateRoute |
| `/fazendas/:id` | Detalhe da fazenda | PrivateRoute |
| `/colheitas` | Colheitas | PrivateRoute |
| `/gastos` | Gastos | PrivateRoute |
| `/lucros` | Lucros | PrivateRoute |
| `/estoque` | Estoque | PrivateRoute |
| `/insumos` | Insumos | PrivateRoute |
| `/lembretes` | Lembretes | PrivateRoute |
| `/noticias` | Notícias | PrivateRoute |
| `/chatbot` | Chat IA | PrivateRoute |
| `/simulacao` | Simulação | AdminRoute |
| `/insights` | Insights | AdminRoute |
| `/usuarios` | Usuários | AdminRoute |

Redirect legado: `/insights-inteligentes` → `/insights`.

---

## Menu dinâmico

O backend retorna `menu` no login (`buildMenuForRole` em `menu.config.js`).

O frontend:
1. Persiste menu em `authStore`.
2. Sidebar renderiza itens e subitens conforme role.
3. `routeAccess.js` impede acesso direto a URLs fora do menu.
4. Rota `*` redireciona para `getFirstAllowedPath(menu)`.

**ADMIN:** Dashboard, Notícias, Fazendas (submenu), Simulação, Lembretes, Chat IA, Insights, Usuários.

**FUNCIONARIO:** Insumos (fazendas vinculadas).

---

## Páginas e funcionalidades

### Dashboard (`/`)
- Cards: cotação, lucros, gastos, saldo, estoque.
- Gráficos: gastos × lucros, produção por cultura.
- Tabelas paginadas: produção e estoque.
- Extrato recente com filtros.
- Filtro global de fazenda no header.

### Fazendas (`/fazendas`, `/fazendas/:id`)
- CRUD de fazendas (ADMIN).
- Tipos: própria, arrendada de/para terceiros.
- Detalhe com abas:
  - **Visão geral** — KPIs, atalhos.
  - **Culturas** — vínculo com status; fluxo integrado ao mapa (callout + redirecionamento).
  - **Mapa** — desenho de talhões (MapLibre), sidebar de áreas, legenda por cultura.
  - **Histórico** — áreas arquivadas, restauração.

### Colheitas (`/colheitas`)
- CRUD com filtros (fazenda, cultura, datas).
- Paginação client-side com reset ao aplicar filtros.
- Modal usa culturas **vinculadas à fazenda** (`useCulturasDaFazendaQuery`).

### Gastos (`/gastos`)
- CRUD integrado à API com resumo (total, pago, pendente).
- Filtros draft/applied (fazenda, cultura, status, período).
- Modal: fazenda → culturas vinculadas → colheita compatível.
- Tipos padrão + customizados; lembrete opcional via `useCreateLembreteMutation`.
- Funcionário: fazenda pré-selecionada quando há apenas uma vinculada.

### Lucros (`/lucros`)
- Registro de vendas com validação de estoque disponível.
- Suporte a arrendamento e confirmação de recebimento.
- Totalizador e filtros por período/fazenda.

### Estoque (`/estoque`)
- Saldo de sacas por cultura/colheita.
- Indicadores: Normal, Baixo, Zerado.
- Arrendamentos pendentes e confirmação de entrega.

### Insumos (`/insumos`)
- Registro de materiais e atividades por fazenda.
- ADMIN vê todas; FUNCIONARIO vê fazendas vinculadas.
- Categorias, unidades, fornecedor.

### Lembretes (`/lembretes`)
- Calendário mensal + lista do dia.
- CRUD com recorrência e WhatsApp.
- Filtros por status e fazenda.
- Paginação consistente (5 itens/página).

### Simulação (`/simulacao`) — ADMIN
- Seleção de cultura, quantidade de sacas, moeda (BRL/USD/EUR).
- Câmbio da API ou manual; taxas IBPT.
- Gráfico de abatimento de dívida; histórico salvo.
- Atalho para registrar venda em Lucros.

### Insights (`/insights`) — ADMIN
- Cards analíticos gerados por Gemini (gastos, estoque, lucros, fazenda).
- Refresh individual ou em lote.
- Filtro por fazenda.

### Chatbot (`/chatbot`)
- Sessões persistentes com histórico de mensagens.
- Consultas factuais rápidas (clima, cotação, estoque…).
- Markdown nas respostas; FAB flutuante em outras telas.

### Notícias (`/noticias`)
- Feed RSS agro com categorias.
- Previsão do tempo por fazenda (geocoding + modal).

### Usuários (`/usuarios`) — ADMIN
- CRUD com validação Zod.
- Vínculo de fazendas para funcionários.
- Modais: criar, editar, excluir.

---

## Componentes compartilhados

### Layout
- **`MainLayout`** — Sidebar colapsável + Header (fazenda selecionada, cotação, usuário, notificações).
- **`Sidebar`** — Navegação baseada no menu da sessão.

### UI / Design system
- **`AgroDataTable`** — Tabela padronizada com paginação (`AgroDataTableFooter`).
- **`AgroFormDialog`** — Modal de formulário com `ModalTitle` + `ModalDescription` (Radix).
- **`AgroConfirmDialog`** — Confirmação de exclusão.
- **`Select`**, **`DatePickerInput`**, **`TimePickerInput`** — Inputs consistentes.
- **`notify.js`** — Toasts via Sonner (padrão de feedback).

### Hooks úteis

| Hook | Uso |
| ---- | --- |
| `useClientPagination` | Paginação local com reset automático |
| `usePageBreadcrumbs` | Breadcrumbs dinâmicos |
| `useDialogEscapeAndScrollLock` | UX de modais |

---

## Queries e invalidação de cache

Padrão de chaves:

```text
["fazendas"], ["colheitas"], ["gastos"], ["lucros"],
["estoque"], ["dashboard"], ["lembretes-dia"], ["lembretes-calendario"]
```

Mutations invalidam domínios relacionados:

| Mutation | Invalida |
| -------- | -------- |
| Colheita create/update/delete | colheitas, estoque, dashboard, gastos, lucros |
| Lucro create/update/delete | lucros, estoque, dashboard, colheitas |
| Gasto create | gastos (+ lembrete via mutation dedicada) |
| Lembrete create | lembretes-dia, lembretes-calendario |

Toasts padronizados via `lib/mutationProps.js` (`apiErrorToast`, `apiSuccessToast`).

---

## Estado global

### `authStore.js` (Zustand)

```text
token          → JWT persistido
usuario        → { id, nome, email, role, fazendasVinculadas }
menu           → itens de navegação filtrados
isAuthenticated
setAuth / clearAuth
```

Persistência em `localStorage`. Interceptor axios anexa token e faz logout em 401.

---

## Mapa de talhões

Implementado em `pages/Fazendas/`:

| Arquivo | Função |
| ------- | ------ |
| `MapView.jsx` | Container MapLibre (satélite/híbrido) |
| `PolygonEditor.jsx` | Desenho e edição de polígonos |
| `AreaSidebar.jsx` | Lista de talhões, ações |
| `PolygonModal.jsx` | Formulário de talhão (nome, cultura, datas) |
| `CulturaLegend.jsx` | Legenda colorida por cultura |

Queries: `usePoligonosQuery`, mutations create/update/delete.

Regra de negócio refletida na UI: **vincular cultura à fazenda exige talhão no mapa** — modal oferece callout com botão "Ir para o Mapa" e reabertura automática após desenhar a área.

---

## Acessibilidade e UI

- Modais usam **Radix Dialog** com `Dialog.Title` e `Dialog.Description` obrigatórios.
- Componentes exportados: `ModalTitle`, `ModalDescription` em `components/ui/Modal/Modal.jsx`.
- `AgroFormDialog` e `AgroConfirmDialog` já conformes.
- Feedback de erro via **Sonner** (`notify.error/success`), não `alert()`.

---

## Testes

```bash
npm test
npm run test:coverage
```

Exemplos: `ProtectedRoute.spec.js`, `useCotacaoQueries.spec.js`, `useDashboardQueries.spec.js`, `auth.service.spec.js`, `fazendaSlice.spec.js`.

---

## Como rodar

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:5173
npm run build      # dist/
npm run vercel-build
npm run preview    # preview do build
npm run lint
```

**Produção:** https://agrofarm-fawn.vercel.app (build via `vercel-build` na Vercel).

Requisito: API rodando com CORS apontando para o frontend.

---

## Variáveis de ambiente

```env
VITE_API_URL=http://localhost:3333/api
```

Única variável obrigatória. O axios em `services/api.js` usa essa base para todas as requisições.

---

## Convenções de código

- **Filtros:** padrão draft/applied — usuário edita filtros locais e clica "Filtrar" para aplicar (Gastos, Lucros, Insumos, Estoque).
- **Paginação:** server-side quando a API suporta; client-side com `useClientPagination` ou `safePage` em listas locais.
- **Modais:** `AgroFormDialog` para formulários; `AgroConfirmDialog` para exclusões.
- **Erros de API:** `getApiErrorMessage(error, fallback)` em `utils/apiError.js`.
- **Formatação:** `utils/formatters.js` — moeda, data, telefone, sacas, produtividade.
