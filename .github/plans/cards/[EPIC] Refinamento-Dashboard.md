# [EPIC] Refinamento do Dashboard

Tipo:        Epic
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Frontend, Backend, UX, Dados Consolidados
Relator:     (preencher)
Pai:         —
Data Limite: (preencher)

## 📌 Status Auditado no Código (05/05/2026)

- A rota inicial `/` ainda renderiza `Home.jsx`, que hoje é apenas um placeholder com cards estáticos. (PENDENTE)
- `src/pages/Dashboard/Dashboard.jsx` já existe, porém está vazio. (PENDENTE)
- `src/store/slices/fazendaSlice.js` já existe, porém está vazio. (PENDENTE)
- A header atual já existe em `src/components/shared/Header/Header.jsx`, mas ainda não possui seletor central de fazenda nem o layout do protótipo. (PENDENTE)
- No backend não existem arquivos de dashboard ainda; a camada de cotação existe, mas está sem implementação útil e sem registro em `src/routes/index.js`. (PENDENTE)
- O estoque do dashboard não terá tabela própria; a origem do dado será a produção registrada em `colheitas.sacas_produzidas`. (CONCLUIDO)

## 📝 Descrição

Como produtor rural usuário do AgroFarm,
eu quero visualizar um dashboard principal consolidado por fazenda ou por todas as fazendas,
para acompanhar produção, movimentações recentes, cotação e indicadores financeiros em uma única tela.

Esta entrega contempla a implementação do dashboard real da aplicação com base no protótipo aprovado. A tela deve reutilizar a sidebar atual, modernizar a header para o layout do protótipo e incluir um seletor central de fazenda que controla toda a visão da página. O dashboard terá suporte à visão geral (`Todas as Fazendas`) e à visão por fazenda específica, com atualização coordenada de todos os blocos da interface.

O conteúdo principal inclui recomendação de IA no topo, gráfico de Produção por Cultura com tabela lateral de apoio, Extrato Recente com movimentações de gastos e lucros, bloco de Sacas em Estoque derivado da produção registrada em colheitas e cards resumidos de saldo total, cotação atualizada, lucro e custos. Os gráficos devem ser implementados com Recharts e os estados de carregamento devem ser tratados por bloco.

---

## 🎯 Escopo Funcional

- Exibir o dashboard como tela principal da rota `/`.
- Reaproveitar a sidebar atual.
- Ajustar a header para o visual do protótipo.
- Inserir seletor central de fazenda na header.
- Permitir a opção `Todas as Fazendas`.
- Atualizar todos os blocos do dashboard quando a fazenda selecionada mudar.
- Exibir recomendação de IA no topo do dashboard.
- Exibir gráfico de `Produção por Cultura` com Recharts.
- Exibir tabela lateral do gráfico com cultura, percentual e sacas.
- Exibir `Extrato Recente` de gastos e lucros contendo valor e data.
- Exibir `Sacas em Estoque` com base no que foi colhido.
- Exibir listagem lateral do estoque por cultura com peso/sacas e data da colheita.
- Exibir cards pequenos de saldo total, cotação, lucro e custos.
- Exibir loading individual por bloco.
- Exibir estados vazios sem erro quando não houver dados.

---

## ✅ Critérios de Aceite

### Cenário 1 — Renderização inicial
**Dado** que o usuário está autenticado
**Quando** acessa a rota inicial
**Então** o dashboard carrega com header, recomendação, gráficos, extrato e cards financeiros.

### Cenário 2 — Seletor de fazenda
**Dado** que a header exibe o seletor central
**Quando** o usuário escolhe uma fazenda específica
**Então** todos os blocos do dashboard são atualizados conforme a fazenda escolhida.

### Cenário 3 — Visão consolidada
**Dado** que o usuário seleciona `Todas as Fazendas`
**Quando** o dashboard consulta os dados
**Então** os indicadores, gráficos e listas exibem valores consolidados.

### Cenário 4 — Produção por cultura
**Dado** que existem colheitas registradas
**Quando** o dashboard é carregado
**Então** o gráfico de produção agrupa as sacas produzidas por cultura e mostra percentual e total em tabela lateral.

### Cenário 5 — Extrato recente
**Dado** que existem gastos e lucros
**Quando** o dashboard é carregado
**Então** o extrato retorna movimentações recentes ordenadas por data decrescente contendo ao menos valor e data.

### Cenário 6 — Estoque derivado de colheita
**Dado** que não existe tabela específica de estoque
**Quando** o dashboard calcula `Sacas em Estoque`
**Então** o dado é derivado exclusivamente das colheitas registradas.

### Cenário 7 — Cotação
**Dado** que o card de cotação é exibido
**Quando** a consulta é realizada
**Então** a aplicação retorna cotação atualizada por endpoint próprio e exibe o valor no card.

### Cenário 8 — Sem dados
**Dado** que a fazenda não possui registros suficientes
**Quando** o dashboard é carregado
**Então** a UI exibe listas vazias, gráficos vazios e totais zerados sem erro 5xx ou quebra visual.

### Cenário 9 — Responsividade
**Dado** diferentes tamanhos de tela
**Quando** o dashboard é renderizado
**Então** o layout permanece utilizável mantendo sidebar, header, cards e blocos conforme o protótipo adaptado.

---

# [STORY DATABASE] Refinamento Dashboard — Banco de Dados

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Banco de Dados
Relator:     (preencher)
Pai:         [EPIC] Refinamento do Dashboard
Data Limite: (preencher)

## 📝 Descrição

Como sistema, eu quero garantir suporte de consulta para agregações do dashboard,
para que a implementação de backend e frontend já considere os ajustes executados no banco e mantenha boa performance nas visões por fazenda e consolidadas.

Importante:
→ Não criar tabela de `estoque`.
→ O bloco `Sacas em Estoque` continuará sendo derivado dos registros de `colheitas`.

SQL a executar:

-- **1. Otimizar agregações de produção por fazenda e cultura (ALTERAR TABELA EXISTENTE)**
CREATE INDEX IF NOT EXISTS idx_colheitas_fazenda_cultura
ON colheitas (fazenda_id, cultura_id);

CREATE INDEX IF NOT EXISTS idx_colheitas_data_colheita
ON colheitas (data_colheita);

-- **2. Otimizar extrato recente e totais financeiros (ALTERAR TABELA EXISTENTE)**
CREATE INDEX IF NOT EXISTS idx_gastos_colheita_data
ON gastos (colheita_id, data);

CREATE INDEX IF NOT EXISTS idx_gastos_status_data
ON gastos (status, data);

CREATE INDEX IF NOT EXISTS idx_lucros_colheita_data
ON lucros (colheita_id, data);

-- **3. Otimizar leitura de cotação atual (ALTERAR TABELA EXISTENTE)**
CREATE INDEX IF NOT EXISTS idx_cotacoes_atualizado_em
ON cotacoes (atualizado_em DESC);

Após executar o SQL:

- Executar no backend:
  - `npx prisma db pull`
  - `npm run db:generate`
- Validar que o schema Prisma reflita os índices e a estrutura já existente.
- Validar que a implementação do dashboard não introduza tabela nova de estoque.

**OBS ATUALIZAR NO DIAGRAMA**

- Índices de `colheitas` para produção por cultura e estoque derivado
- Índices de `gastos` e `lucros` para extrato recente e totais
- Índice temporal de `cotacoes` para leitura da cotação atual

**Critérios de Aceite:**

→ O card de implementação do dashboard passa a considerar os ajustes já executados no banco.
→ Não é criada tabela específica de `estoque`.
→ As consultas agregadas de colheitas, gastos, lucros e cotação possuem contexto de índice já aplicado.

---

# [STORY BACKEND] Refinamento Dashboard — Backend

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Backend
Relator:     (preencher)
Pai:         [EPIC] Refinamento do Dashboard
Data Limite: (preencher)

## 📝 Descrição

Como sistema, eu quero consolidar dados produtivos e financeiros por fazenda ou para todas as fazendas,
para alimentar o dashboard principal com consistência, controle de acesso e baixo acoplamento com o frontend.

---

## ✅ Critérios de Aceite

### Cenário 1 — Dashboard por fazenda
**Dado** que foi informado `fazendaId=<uuid>`
**Quando** `GET /api/dashboard` é chamado
**Então** a API retorna recomendação, produção por cultura, extrato recente, sacas em estoque e cards financeiros filtrados pela fazenda.

### Cenário 2 — Dashboard consolidado
**Dado** que foi informado `fazendaId=todas`
**Quando** `GET /api/dashboard` é chamado
**Então** a API retorna dados consolidados considerando todas as fazendas visíveis ao usuário autenticado.

### Cenário 3 — Respeito ao vínculo de fazenda
**Dado** que o usuário não é `ADMIN`
**Quando** solicita o dashboard consolidado ou por fazenda
**Então** a API retorna apenas dados das fazendas vinculadas ao usuário.

### Cenário 4 — Cotação do dólar
**Dado** que `GET /api/cotacao/dolar` é chamado
**Quando** o serviço executa
**Então** a API retorna a cotação atual formatada para consumo do dashboard.

### Cenário 5 — Extrato recente
**Dado** que existem gastos e lucros
**Quando** `GET /api/dashboard` é chamado
**Então** o backend mescla os lançamentos, ordena por data desc e limita o retorno para uso no card de extrato.

### Cenário 6 — Estoque sem tabela própria
**Dado** que o dashboard precisa mostrar `Sacas em Estoque`
**Quando** o backend monta o payload
**Então** o cálculo usa exclusivamente os registros de colheita e não depende de tabela `estoque`.

### Cenário 7 — Sem dados operacionais
**Dado** que não existem colheitas, gastos ou lucros
**Quando** o endpoint do dashboard é chamado
**Então** a API retorna arrays vazios, recomendação vazia ou nula e totais zerados sem erro 5xx.

---

## 🛠️ Implementação

### dashboard.controller.js (NOVO — CRIAR)

Criar em: `src/controllers/dashboard.controller.js`
Seguir padrão de: `src/controllers/fazenda.controller.js`

Métodos a implementar:
* `getDados()` -> `GET /api/dashboard`

### dashboard.service.js (NOVO — CRIAR)

Criar em: `src/services/dashboard.service.js`
Seguir padrão de: `src/services/fazenda.service.js`

Lógica a implementar:
→ Resolver escopo de visualização por `fazendaId` ou `todas`.
→ Respeitar permissão por fazendas vinculadas para `FUNCIONARIO`.
→ Buscar produção por cultura com base em colheitas.
→ Calcular percentual por cultura para o gráfico donut.
→ Montar `Sacas em Estoque` a partir de `sacas_produzidas` das colheitas.
→ Mesclar gastos e lucros em um extrato recente ordenado por data desc.
→ Calcular `saldoTotal`, `lucroTotal` e `custosTotais`.
→ Integrar com `cotacao.service.js` para compor o card de cotação.
→ Retornar campo de recomendação para o banner superior do dashboard.

### dashboard.repository.js (NOVO — CRIAR)

Criar em: `src/repositories/dashboard.repository.js`
Seguir padrão de: `src/repositories/fazenda.repository.js`

Métodos a implementar:
→ `listarFazendasVisiveis(usuario)`
→ `producaoPorCultura({ usuario, fazendaId })`
→ `estoquePorCultura({ usuario, fazendaId })`
→ `extratoRecente({ usuario, fazendaId, limite })`
→ `totalLucros({ usuario, fazendaId })`
→ `totalGastos({ usuario, fazendaId })`

### dashboard.view.js (NOVO — CRIAR)

Criar em: `src/views/dashboard.view.js`
Seguir padrão de: `src/views/fazenda.view.js`

Campos a renderizar:
→ `recomendacao`
→ `producaoPorCultura[]`
→ `sacasEmEstoque[]`
→ `extratoRecente[]`
→ `cards.saldoTotal`
→ `cards.cotacaoAtual`
→ `cards.lucroTotal`
→ `cards.custosTotais`

### cotacao.controller.js (EXISTENTE — MODIFICAR)

Arquivo existente: `src/controllers/cotacao.controller.js`

Métodos existentes (não alterar):
* Nenhum método implementado atualmente.

Métodos NOVOS a adicionar:
* `getDolar()` -> `GET /api/cotacao/dolar`

### cotacao.service.js (EXISTENTE — MODIFICAR)

Arquivo existente: `src/services/cotacao.service.js`

Lógica existente (não alterar):
→ Nenhuma lógica implementada atualmente.

Lógica NOVA a adicionar:
→ Buscar cotação atual do dólar.
→ Definir contrato retornado para uso no dashboard.
→ Centralizar a lógica de consulta externa/cache da cotação.

### cotacao.view.js (EXISTENTE — MODIFICAR)

Arquivo existente: `src/views/cotacao.view.js`

Métodos existentes (não alterar):
* Nenhum método implementado atualmente.

Métodos NOVOS a adicionar:
* `renderDolar()`

---

## 📐 Schemas (Zod)

### dashboard.schema.js (NOVO — CRIAR)

Criar em: `src/schemas/dashboard.schema.js`
Seguir padrão de: `src/schemas/fazenda.schema.js`

Schemas a implementar:
→ `dashboardFiltroSchema`
  - `fazendaId`: `string().uuid()` ou literal `todas`

### cotacao.schema.js (NOVO — CRIAR)

Criar em: `src/schemas/cotacao.schema.js`

Schemas a implementar:
→ `cotacaoDolarQuerySchema` se houver parâmetros futuros de atualização/cache.

---

## 🛣️ Rotas

### dashboard.routes.js (NOVO — CRIAR)

Criar em: `src/routes/dashboard.routes.js`
Registrar em: `src/routes/index.js`

Rotas a implementar:
* `GET /api/dashboard?fazendaId=<uuid>`
* `GET /api/dashboard?fazendaId=todas`

### cotacao.routes.js (EXISTENTE — MODIFICAR)

Arquivo existente: `src/routes/cotacao.routes.js`

Rotas existentes (não alterar):
* Nenhuma rota funcional implementada atualmente.

Rotas NOVAS a adicionar:
* `GET /api/cotacao/dolar`

### routes/index.js (EXISTENTE — MODIFICAR)

Arquivo existente: `src/routes/index.js`

Rotas existentes (não alterar):
* `GET /api/health`
* `/auth`
* `/usuarios`
* `/fazendas`
* `/culturas`
* `/lembretes`
* `/colheitas`
* `/gastos`
* `/lucros`
* `/poligonos`

Rotas NOVAS a adicionar:
* `/dashboard`
* `/cotacao`

---

## 🚫 Regras de Negócio

* A visão `todas` consolida apenas fazendas acessíveis ao usuário autenticado.
* `FUNCIONARIO` não pode enxergar dados de fazendas fora do próprio vínculo.
* `Sacas em Estoque` no dashboard é um agregado derivado das colheitas, sem tabela dedicada.
* O extrato recente mescla gastos e lucros em uma lista única ordenada por data desc.
* O endpoint deve retornar payload estável para o frontend mesmo sem dados operacionais.

---

# [STORY FRONTEND] Refinamento Dashboard — Frontend

Tipo:        Story
Prioridade:  🔼 High
Sprint:      (preencher)
Categoria:   Frontend
Relator:     (preencher)
Pai:         [EPIC] Refinamento do Dashboard
Data Limite: (preencher)

## 📝 Descrição

Como usuário do AgroFarm,
eu quero visualizar um dashboard bonito, responsivo e consolidado por fazenda,
para acompanhar recomendação, produção, extrato recente, estoque derivado de colheitas e indicadores financeiros na tela principal do sistema.

---

## ✅ Critérios de Aceite

### Cenário 1 — Tela principal real
**Dado** que o usuário abre a aplicação autenticada
**Quando** acessa `/`
**Então** a aplicação renderiza a tela de dashboard real em vez do placeholder atual.

### Cenário 2 — Header com seletor central
**Dado** que a header está visível
**Quando** o dashboard renderiza
**Então** a header segue o protótipo e exibe o seletor central de fazenda.

### Cenário 3 — Alteração da fazenda ativa
**Dado** que o seletor da header está disponível
**Quando** o usuário troca de fazenda ou escolhe `Todas as Fazendas`
**Então** a seleção é persistida em store e dispara novo carregamento dos dados.

### Cenário 4 — Produção por cultura
**Dado** que existem dados retornados pelo endpoint
**Quando** o bloco de produção é renderizado
**Então** o gráfico donut e a tabela lateral mostram cultura, percentual e sacas de forma sincronizada.

### Cenário 5 — Extrato recente
**Dado** que existem movimentações
**Quando** o dashboard renderiza o extrato
**Então** a lista mostra valor e data com rolagem própria quando necessário.

### Cenário 6 — Sacas em estoque
**Dado** que existem colheitas registradas
**Quando** o bloco de estoque é renderizado
**Então** o componente mostra os dados derivados da produção por cultura e data da colheita.

### Cenário 7 — Cards financeiros
**Dado** que o payload do dashboard foi carregado
**Quando** os cards resumidos renderizam
**Então** saldo total, cotação, lucro e custos são exibidos com destaque visual e estados de loading individuais.

### Cenário 8 — Estado vazio
**Dado** que não há dados para a fazenda selecionada
**Quando** o dashboard renderiza
**Então** os blocos exibem estados vazios sem quebrar layout, sem `NaN` e sem listas inconsistentes.

---

## 🎨 Visual e UX

Baseado no protótipo anexado:

→ Sidebar mantém o padrão atual da aplicação.
→ Header deve ser ajustada para fundo claro, seletor central de fazenda e área de ações à direita.
→ Banner de recomendação no topo com destaque visual e leitura rápida.
→ Dois blocos principais lado a lado no desktop: gráfico/tabela e extrato.
→ Cards financeiros compactos alinhados na lateral/inferior conforme protótipo.
→ O dashboard deve preservar boa leitura em desktop e reorganizar blocos em coluna no mobile.

### Tabela e Componentes
* **Gráficos:** usar Recharts para os donuts de produção e estoque.
* **Extrato:** lista scrollável com scrollbar padronizada ao projeto.
* **Cards:** componentes pequenos com ênfase em número principal e label curta.
* **Header:** seletor no centro, com o mesmo padrão visual de dropdown customizado já adotado nos formulários.

### Responsividade
* **Desktop:** composição semelhante ao protótipo.
* **Tablet:** blocos com quebra controlada mantendo header funcional.
* **Mobile:** header adaptada e blocos empilhados sem perda de contexto.

---

## ⚙️ Integração Técnica

### Hooks (TanStack Query)

#### useDashboardQueries.js (NOVO — CRIAR)

Criar em: `src/queries/dashboard/useDashboardQueries.js`
Seguir padrão de: `src/queries/fazenda/useFazendaQueries.js`

Hooks a implementar:
→ `useDashboardQuery(fazendaId)`

#### useCotacaoQueries.js (EXISTENTE — MODIFICAR)

Arquivo existente: `src/queries/cotacao/useCotacaoQueries.js`

Hooks existentes (não alterar):
→ Nenhum hook implementado atualmente.

Hooks NOVOS a adicionar:
→ `useCotacaoDolarQuery()`

### Store global

#### fazendaSlice.js (EXISTENTE — MODIFICAR)

Arquivo existente: `src/store/slices/fazendaSlice.js`

Estado existente (não alterar):
→ Nenhum estado implementado atualmente.

Estado NOVO a adicionar:
→ `fazendaSelecionada`
→ `setFazendaSelecionada()`
→ persistência da fazenda ativa entre navegações
→ suporte à opção literal `todas`

### Componentes

#### Header.jsx (EXISTENTE — MODIFICAR)

Arquivo existente: `src/components/shared/Header/Header.jsx`

Comportamentos existentes (não alterar):
→ menu mobile
→ logout
→ exibição do usuário autenticado

Comportamentos NOVOS a adicionar:
→ layout do protótipo na header desktop
→ seletor central de fazenda
→ integração do seletor com `fazendaSlice`
→ opção `Todas as Fazendas`

#### Dashboard.jsx (EXISTENTE — MODIFICAR)

Arquivo existente: `src/pages/Dashboard/Dashboard.jsx`

Conteúdo existente (não alterar):
→ Arquivo existente sem implementação.

Conteúdo NOVO a adicionar:
→ composição completa do dashboard
→ banner de recomendação
→ bloco `Produção por Cultura`
→ bloco `Extrato Recente`
→ bloco `Sacas em Estoque`
→ cards financeiros
→ estados de loading e vazio

#### Home.jsx (EXISTENTE — MODIFICAR)

Arquivo existente: `src/pages/Home/Home.jsx`

Conteúdo existente (não alterar):
→ tela placeholder atual do dashboard.

Conteúdo NOVO a adicionar:
→ substituir o placeholder pelo dashboard real ou transformar `Home` em delegador para `Dashboard`.

### Serviços

#### dashboard.service.js (NOVO — CRIAR)

Criar em: `src/services/dashboard/dashboard.service.js`
Seguir padrão de: `src/services/fazenda/fazenda.service.js`

Métodos a implementar:
→ `buscarDashboard(fazendaId)` -> `GET /api/dashboard?fazendaId=<uuid|todas>`

#### cotacao.service.js (EXISTENTE — MODIFICAR)

Arquivo existente: `src/services/cotacao/cotacao.service.js`

Métodos existentes (não alterar):
→ Nenhum método implementado atualmente.

Métodos NOVOS a adicionar:
→ `buscarCotacaoDolar()` -> `GET /api/cotacao/dolar`

### Rotas da aplicação

#### App.jsx (EXISTENTE — MODIFICAR)

Arquivo existente: `src/App.jsx`

Rotas existentes (não alterar):
→ `/gastos`
→ `/colheitas`
→ `/fazendas`
→ `/fazendas/:id`
→ `/usuarios`
→ `/lucros`

Rotas NOVAS ou ajustes a aplicar:
→ manter `/` como rota principal do dashboard real
→ apontar a rota inicial para o componente final do dashboard

### Endpoints consumidos

* `GET /api/dashboard?fazendaId=<uuid>`
* `GET /api/dashboard?fazendaId=todas`
* `GET /api/cotacao/dolar`
* `GET /api/fazendas`

---

## 🚫 Regras de Negócio

* A seleção de fazenda controla toda a tela do dashboard.
* A opção `Todas as Fazendas` deve existir no seletor da header.
* O dashboard não deve depender de tabela específica de estoque.
* Os blocos do dashboard devem tolerar ausência de dados reais.
* O frontend deve usar Zustand para estado cliente do seletor e TanStack Query para dados remotos.

---

## 🛠️ Refinamento

* **Header:** o seletor de fazenda deve ser centralizado e seguir o padrão de dropdown customizado já adotado nos formulários.
* **Gráficos:** Recharts deve receber dados já preparados pelo backend para reduzir lógica de transformação na UI.
* **Estado Global:** `fazendaSlice` deve ser a fonte única da fazenda ativa.
* **Integração:** o payload do dashboard deve vir pronto para consumo direto por cards, listas e gráficos.
* **Escopo:** não gerar card de banco de dados para esta entrega; o dashboard deve usar as estruturas já existentes.
