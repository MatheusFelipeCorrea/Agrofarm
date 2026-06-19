# 🌐 Web — Frontend

Interface construída com **React + Vite** estilizada com **Tailwind CSS**
seguindo uma arquitetura baseada em **componentes, páginas e camadas de dados**.

---

## 🗂️ Índice

- [Tecnologias](#-tecnologias)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Descrição das Camadas](#-descrição-das-camadas)
- [Fluxo de Dados](#-fluxo-de-dados)
- [Rotas da Aplicação](#-rotas-da-aplicação)
- [Como Rodar](#-como-rodar)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|------------|-----|
| React 19 | Biblioteca de interface |
| Vite 6 | Bundler e servidor de desenvolvimento |
| Tailwind CSS v4 | Estilização |
| React Router DOM | Navegação entre páginas |
| TanStack Query | Gerenciamento de estado do servidor |
| Zustand | Gerenciamento de estado global |
| Axios | Requisições HTTP |
| Zod | Validação de dados |
| Recharts | Gráficos |
| Vitest | Testes |

---

## 📁 Estrutura de Pastas

```text
Agrofarm/web/
├── 📄 .env
├── 📄 .env.example
├── 📄 .gitignore
├── 📄 eslint.config.js
├── 📄 index.html
├── 📄 package-lock.json
├── 📄 package.json
├── 📄 vite.config.js
│
├── 📁 public/
│   └── 📄 Agrofarm.ico
│
└── 📁 src/
  ├── 📄 main.jsx
  ├── 📄 App.jsx
  ├── 📁 assets/
  ├── 📁 components/
  │   ├── 📁 ui/
  │   └── 📁 shared/
  ├── 📁 pages/
  ├── 📁 layouts/
  ├── 📁 routes/
  ├── 📁 hooks/
  ├── 📁 store/
  ├── 📁 services/
  ├── 📁 queries/
  ├── 📁 utils/
  ├── 📁 constants/
  └── 📁 styles/
```

---

## 📖 Descrição das Camadas

---

### 📄 Arquivos da Raiz

```text
.env
→ Variáveis de ambiente da aplicação
→ Nunca versionar esse arquivo

.env.example
→ Modelo do .env para o time
→ Versionar esse arquivo

.gitignore
→ Arquivos ignorados pelo git
→ node_modules, .env, dist...

eslint.config.js
→ Regras de qualidade e padronização do código

index.html
→ HTML base da aplicação
→ Ponto de montagem do React (#root)

package.json
→ Dependências e scripts do projeto

vite.config.js
→ Configuração do Vite
→ Plugin do React e Tailwind
→ Aliases de importação (@components, @pages...)
→ Proxy para a API (/api → localhost:3333)
```

---

### 📄 `src/main.jsx`
> Ponto de entrada da aplicação

```text
→ Renderiza o <App /> no DOM
→ Configura o QueryClientProvider (React Query)
→ Configura o BrowserRouter (rotas)
→ Importa o styles/globals.css
```

---

### 📄 `src/App.jsx`
> Componente raiz

```text
→ Chama o componente de rotas
→ Providers globais (toast, tema...)
```

---

### 📁 `assets/`
> Arquivos estáticos da aplicação

```text
images/  → logos, banners, ilustrações (.png .jpg .svg)
icons/   → ícones SVG próprios
fonts/   → fontes customizadas (.ttf .woff .woff2)

❌ Não colocar imagens que vêm de URL/API externa
```

---

### 📁 `components/ui/`
> Componentes visuais **genéricos** — base do design system

```text
Button/
→ Botão padrão do sistema
→ Variações: primary, secondary, danger

Input/
→ Campo de texto padrão

Modal/
→ Janela modal reutilizável

Select/
→ Campo de seleção (dropdown)

Table/
→ Tabela de dados reutilizável

Badge/
→ Etiqueta colorida
→ Usado em: Própria | Arrendada de Terceiros
             Arrendada para Terceiros
→ Usado em: Pago | Pendente
→ Usado em: culturas (cor dinâmica)

Spinner/
→ Indicador de carregamento

✅ Estilizados com Tailwind
✅ Recebem tudo via props
✅ Reutilizáveis em qualquer parte do projeto
❌ Não acessam store
❌ Não fazem chamada de API
```

---

### 📁 `components/shared/`
> Componentes de **negócio** reutilizados em múltiplas páginas

```text
Header/
→ Cabeçalho da aplicação
→ Exibe: nome do sistema, cotação do dólar em tempo real
→ Exibe: fazenda selecionada e nome do usuário logado

Sidebar/
→ Navegação lateral
→ Links para todas as páginas do sistema
→ Menus diferentes para ADMIN e FUNCIONARIO
→ Destaca a rota ativa

Footer/
→ Rodapé da aplicação

✅ Podem acessar store
✅ Conhecem o negócio da aplicação
❌ Não são páginas completas
```

---

### 📁 `pages/`
> Cada pasta representa **uma tela da aplicação**

```text
Auth/Login/
→ Tela de login
→ Formulário: email e senha
→ Rota: /login

Auth/Cadastro/
→ Tela de cadastro
→ Formulário: nome, email e senha
→ Rota: /cadastro

Dashboard/
→ Painel financeiro principal (RF08)
→ Cards: cotação dólar, lucros, gastos, saldo, estoque
→ Gráficos: gastos x lucros, produção por cultura,
            gastos por categoria
→ Extrato recente de movimentações
→ Botão de acesso ao ChatBot (RF14)
→ Atalho para Simulação
→ Rota: /

Fazendas/
→ CRUD de fazendas (RF01)
→ 3 tipos: Própria | Arrendada de Terceiros
           Arrendada para Terceiros
→ Visualização das culturas da fazenda
→ Filtro global de fazenda (RF02)
→ Rota: /fazendas

Colheitas/
→ Controle de sacas colhidas (RF03)
→ Registro: fazenda, cultura, área, sacas, ano, data
→ Criação dinâmica de nova cultura com cor automática
→ Rota: /colheitas

Gastos/
→ Gestão de gastos (RF05)
→ Status: Pago | Pendente com cores
→ Tipo personalizado (campo "Outro")
→ Data de vencimento opcional
→ Rota: /gastos

Lucros/
→ Registro de lucros de venda (RF06)
→ Informa: fazenda, colheita, sacas, valor, comprador, data
→ Rota: /lucros

Estoque/
→ Saldo de sacas disponíveis por cultura
→ Calculado: sacas colhidas - sacas vendidas
→ Indicadores: Normal | Baixo | Zerado
→ Rota: /estoque

Lembretes/
→ Cadastro de lembretes (RF10)
→ Envia notificação via WhatsApp na data
→ Status: Pendente | Enviado | Cancelado
→ Rota: /lembretes

Insumos/
→ Registro diário de insumos (RF13)
→ Apenas FUNCIONARIO
→ item, quantidade, observações
→ Rota: /insumos

Simulacao/
→ Calculadora de dívidas (RF09)
→ Barra visual: total pago (verde) + pendente (vermelho)
→ Calcula sacas necessárias para quitar a dívida
→ Botão "Registrar essa venda" → Lucros pré-preenchido
→ Rota: /simulacao

IA/
→ Apenas ADMIN
→ 4 cards de insights com botão 🔄 individual:
   Card 1: Análise de Gastos
   Card 2: Situação do Estoque
   Card 3: Desempenho de Lucros
   Card 4: Análise por Fazenda com recomendação de venda
→ ChatBot para consultas rápidas (RF14):
   Campo de pergunta livre
   Respostas em linguagem natural
   Chips de sugestões clicáveis
→ Rota: /ia

✅ Montam a tela usando components
✅ Buscam dados via queries
✅ Gerenciam estado local (useState)
❌ Não fazem fetch direto
❌ Lógica complexa vai para hooks
```

---

### 📁 `layouts/`
> Esqueletos visuais que **envolvem as páginas**

```text
AuthLayout.jsx
→ Tela limpa sem menu
→ Usado em: /login e /cadastro

MainLayout.jsx
→ Tela completa com navegação
→ Renderiza: Header + Sidebar + conteúdo + Footer
→ Usado em todas as páginas logadas

✅ Definem a estrutura visual base
❌ Sem lógica de negócio
```

---

### 📁 `routes/`
> Configuração de **todas as rotas** da aplicação

```text
index.jsx
→ Monta todas as rotas da aplicação
→ Rotas públicas usam AuthLayout
→ Rotas privadas usam MainLayout

PrivateRoute.jsx
→ Verifica se o usuário está logado
→ Se NÃO estiver → redireciona para /login

PublicRoute.jsx
→ Verifica se o usuário já está logado
→ Se JÁ estiver → redireciona para /

AdminRoute.jsx
→ Verifica se o usuário é ADMIN
→ Se NÃO for → redireciona para /dashboard
→ Protege: /ia
```

---

### 📁 `hooks/`
> Lógica **reutilizável** entre componentes

```text
useDebounce.js
→ Atrasa a execução de uma função
→ Usado em buscas enquanto o usuário digita

useLocalStorage.js
→ Lê e escreve dados no localStorage
→ Persiste dados entre sessões do navegador

✅ Sempre começam com "use"
✅ Retornam dados e funções
❌ Não renderizam JSX
```

---

### 📁 `store/`
> Estado **global** da aplicação com Zustand

```text
slices/authSlice.js
→ Armazena o usuário logado
→ Armazena o token JWT
→ role: ADMIN | FUNCIONARIO
→ isAuthenticated: true | false
→ setUser(user)  → salva o usuário
→ clearUser()    → limpa ao fazer logout

slices/uiSlice.js
→ Controla sidebar aberta ou fechada
→ Controla tema (dark | light)

slices/fazendaSlice.js
→ Armazena a fazenda selecionada (RF02)
→ Quando muda → todas as telas filtram por ela
→ Pode ser "todas" ou uma fazenda específica

index.js
→ Exporta todas as stores

✅ Dados que múltiplos componentes precisam
✅ Persiste entre navegações
❌ Não colocar dados que vêm da API
❌ Não colocar estado local de um componente só
```

---

### 📁 `services/`
> Toda **comunicação HTTP** com o backend

```text
api.js
→ Instância configurada do axios
→ Define a baseURL via variável de ambiente
→ Interceptor: anexa o token JWT em toda requisição
→ Interceptor: trata erros globais (401 → logout)

auth.service.js
→ login(dados)     → POST /api/auth/login
→ cadastro(dados)  → POST /api/auth/cadastro
→ logout()         → POST /api/auth/logout

fazenda.service.js
→ buscarTodas()           → GET    /api/fazendas
→ buscarPorId(id)         → GET    /api/fazendas/:id
→ criar(dados)            → POST   /api/fazendas
→ atualizar(id, dados)    → PUT    /api/fazendas/:id
→ deletar(id)             → DELETE /api/fazendas/:id

cultura.service.js
→ buscarTodas()           → GET    /api/culturas
→ criar(dados)            → POST   /api/culturas
→ atualizar(id, dados)    → PUT    /api/culturas/:id
→ deletar(id)             → DELETE /api/culturas/:id

colheita.service.js
→ buscarTodas()                      → GET    /api/colheitas
→ buscarPorFazenda(fazendaId)        → GET    /api/colheitas/fazenda/:fazendaId
→ criar(dados)                       → POST   /api/colheitas
→ atualizar(id, dados)               → PUT    /api/colheitas/:id
→ deletar(id)                        → DELETE /api/colheitas/:id

gasto.service.js
→ buscarTodos()                      → GET    /api/gastos
→ buscarPorColheita(colheitaId)      → GET    /api/gastos/colheita/:colheitaId
→ criar(dados)                       → POST   /api/gastos
→ atualizar(id, dados)               → PUT    /api/gastos/:id
→ deletar(id)                        → DELETE /api/gastos/:id

lucro.service.js
→ buscarTodos()                      → GET    /api/lucros
→ buscarPorColheita(colheitaId)      → GET    /api/lucros/colheita/:colheitaId
→ criar(dados)                       → POST   /api/lucros
→ atualizar(id, dados)               → PUT    /api/lucros/:id
→ deletar(id)                        → DELETE /api/lucros/:id

estoque.service.js
→ buscarTodos()                      → GET    /api/estoque
→ buscarPorColheita(colheitaId)      → GET    /api/estoque/colheita/:colheitaId

cotacao.service.js
→ buscarDolar()                      → GET    /api/cotacao/dolar

simulacao.service.js
→ buscarDividas()                    → GET    /api/simulacao/dividas
→ calcularSacas(dados)               → POST   /api/simulacao/calcular-sacas

lembrete.service.js
→ buscarTodos()                      → GET    /api/lembretes
→ buscarPorId(id)                    → GET    /api/lembretes/:id
→ criar(dados)                       → POST   /api/lembretes
→ atualizar(id, dados)               → PUT    /api/lembretes/:id
→ deletar(id)                        → DELETE /api/lembretes/:id

insumo.service.js
→ buscarTodos()                      → GET    /api/insumos
→ buscarPorFazenda(fazendaId)        → GET    /api/insumos/fazenda/:fazendaId
→ criar(dados)                       → POST   /api/insumos
→ deletar(id)                        → DELETE /api/insumos/:id

ia.service.js
→ gerarInsights()                    → GET    /api/ia/insights
→ chat(pergunta)                     → POST   /api/ia/chat

✅ Toda comunicação HTTP fica aqui
✅ Retornam a promise diretamente
❌ Não tratam loading/error (isso é React Query)
❌ Não acessam store
```

---

### 📁 `queries/`
> **TanStack Query** — gerencia estado do servidor

```text
useAuthQueries.js
→ useLogin()       → mutation de login
→ useCadastro()    → mutation de cadastro

useFazendaQueries.js
→ useGetFazendas()
→ useGetFazenda(id)
→ useCreateFazenda()
→ useUpdateFazenda()
→ useDeleteFazenda()

useCulturaQueries.js
→ useGetCulturas()
→ useCreateCultura()
→ useUpdateCultura()
→ useDeleteCultura()

useColheitaQueries.js
→ useGetColheitas()
→ useGetColheitasPorFazenda(fazendaId)
→ useCreateColheita()
→ useUpdateColheita()
→ useDeleteColheita()

useGastoQueries.js
→ useGetGastos()
→ useGetGastosPorColheita(colheitaId)
→ useCreateGasto()
→ useUpdateGasto()
→ useDeleteGasto()

useLucroQueries.js
→ useGetLucros()
→ useGetLucrosPorColheita(colheitaId)
→ useCreateLucro()
→ useUpdateLucro()
→ useDeleteLucro()

useEstoqueQueries.js
→ useGetEstoque()
→ useGetEstoquePorColheita(colheitaId)

useCotacaoQueries.js
→ useGetCotacaoDolar()

useSimulacaoQueries.js
→ useGetDividas()
→ useCalcularSacas()

useLembreteQueries.js
→ useGetLembretes()
→ useGetLembrete(id)
→ useCreateLembrete()
→ useUpdateLembrete()
→ useDeleteLembrete()

useInsumoQueries.js
→ useGetInsumos()
→ useGetInsumosPorFazenda(fazendaId)
→ useCreateInsumo()
→ useDeleteInsumo()

useIAQueries.js
→ useGerarInsights()
→ useChat()         → mutation do ChatBot (RF14)

✅ Usa os services para buscar/enviar dados
✅ Gerencia loading, error e cache automaticamente
✅ Chamado dentro dos components e pages
❌ Não tem JSX
```

---

### 📁 `utils/`
> Funções **puras** de utilidade

```text
formatters.js
→ formatarMoeda(valor)     → R$ 1.000,00
→ formatarData(data)       → 01/01/2026
→ formatarSacas(qtd)       → 1.000 sc
→ formatarDolar(valor)     → $ 5,87

validators.js
→ emailValido(email)       → true | false
→ campoObrigatorio(valor)  → true | false

masks.js
→ maskCPF(valor)           → 000.000.000-00
→ maskCNPJ(valor)          → 00.000.000/0000-00
→ maskTelefone(valor)      → (00) 00000-0000

✅ Funções puras (mesmo input = mesmo output)
✅ Sem efeitos colaterais
❌ Sem hooks, store ou chamadas HTTP
```

---

### 📁 `constants/`
> Valores **fixos** que não mudam

```text
routes.js
→ ROTAS = {
    LOGIN: '/login',
    CADASTRO: '/cadastro',
    DASHBOARD: '/',
    FAZENDAS: '/fazendas',
    COLHEITAS: '/colheitas',
    GASTOS: '/gastos',
    LUCROS: '/lucros',
    ESTOQUE: '/estoque',
    LEMBRETES: '/lembretes',
    INSUMOS: '/insumos',
    SIMULACAO: '/simulacao',
    IA: '/ia',
  }

api.js
→ API = {
    AUTH: { LOGIN: '/auth/login', CADASTRO: '/auth/cadastro' },
    FAZENDAS: '/fazendas',
    CULTURAS: '/culturas',
    COLHEITAS: '/colheitas',
    GASTOS: '/gastos',
    LUCROS: '/lucros',
    ESTOQUE: '/estoque',
    COTACAO: '/cotacao/dolar',
    LEMBRETES: '/lembretes',
    INSUMOS: '/insumos',
    SIMULACAO: '/simulacao',
    IA: {
      INSIGHTS: '/ia/insights',
      CHAT: '/ia/chat',
    },
  }

✅ Evita magic strings espalhados no código
✅ Fácil de alterar em um só lugar
```

---

### 📁 `styles/`
> Estilos **globais** da aplicação

```text
globals.css
→ @import "tailwindcss"
→ Estilos base globais

variables.css
→ Variáveis CSS customizadas
→ Complementa o Tailwind quando necessário
```

---

## 🔄 Fluxo de Dados

```text
👤 Usuário interage com a tela
      │
      ▼
page / component
(estilizado com Tailwind)
      │
      ▼
query (TanStack Query)
ex: useGetColheitas()
      │
      ▼
service (axios)
ex: colheita.service.js
      │
      ▼
══════ HTTP ══════
 /api/colheitas
══════ HTTP ══════
      │
      ▼
React Query cache
atualiza os dados
      │
      ▼
componente re-renderiza

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
Se ocorrer erro:

React Query captura
      │
      ▼
interceptor do axios
      │
      ▼
trata o erro (toast, logout...)
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
```

---

## 🛣️ Rotas da Aplicação

```text
PÚBLICAS (AuthLayout — sem menu)
/login      → tela de login
/cadastro   → tela de cadastro

PRIVADAS (MainLayout — todos logados)
/           → dashboard (RF08)
/fazendas   → fazendas (RF01)
/colheitas  → colheitas (RF03)
/gastos     → gastos (RF05)
/lucros     → lucros (RF06)
/estoque    → estoque
/lembretes  → lembretes (RF10)
/simulacao  → calculadora de dívidas (RF09)

SÓ ADMIN (AdminRoute)
/ia         → insights IA + ChatBot (RF11, RF14)

SÓ FUNCIONARIO
/insumos    → registro de insumos (RF13)
```

---

## ▶️ Como Rodar

```bash
# Instalar dependências
npm install

# Copiar o .env
cp .env.example .env

# Rodar em desenvolvimento
npm run dev
# → http://localhost:5173

# Gerar build de produção
npm run build

# Rodar os testes
npm test

# Rodar o lint
npm run lint
```

---

## 📋 Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Desenvolvimento com hot reload |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm test` | Testes |
| `npm run lint` | Lint |

---

## 🔑 Variáveis de Ambiente

Copie o `.env.example` e crie seu `.env`:

```bash
cp .env.example .env
env
VITE_API_URL=http://localhost:3333/api
```
