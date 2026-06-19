---
goal: Refinar e implementar o Dashboard principal com visão por fazenda e consolidada
card_id: '[EPIC] Refinamento do Dashboard'
version: 1.0
date_created: 2026-05-05
last_updated: 2026-05-05
owner: (preencher)
status: 'Planned'
tags: [feature, dashboard, frontend, backend, fullstack, recharts, zustand, tanstack-query]
---

# Introduction

Como produtor rural usuário do AgroFarm, eu quero visualizar um dashboard principal consolidado por fazenda ou por todas as fazendas para acompanhar recomendação, produção, extrato recente, estoque derivado de colheitas e indicadores financeiros na tela principal do sistema.

Este plano cobre frontend e backend do dashboard real da aplicação. A camada de banco de dados necessária já existe no Prisma e deve ser tratada como contexto executado anteriormente, sem criação de tabela de estoque. O estoque continuará sendo derivado de `colheitas.sacas_produzidas`.

## 1. Requirements & Constraints

- **REQ-001**: A rota `/` deve deixar de exibir o placeholder atual e passar a renderizar o dashboard real.
- **REQ-002**: A header deve seguir o protótipo e exibir um seletor central de fazenda.
- **REQ-003**: O seletor deve suportar fazenda específica e a opção `todas`.
- **REQ-004**: A mudança da fazenda selecionada deve atualizar todos os blocos do dashboard.
- **REQ-005**: O dashboard deve exibir banner de recomendação no topo.
- **REQ-006**: O dashboard deve exibir gráfico donut de produção por cultura com tabela lateral de apoio.
- **REQ-007**: O dashboard deve exibir extrato recente de gastos e lucros, ordenado por data desc.
- **REQ-008**: O dashboard deve exibir bloco de sacas em estoque derivado das colheitas, sem tabela dedicada.
- **REQ-009**: O dashboard deve exibir cards de saldo total, cotação, lucro e custos.
- **REQ-010**: Cada bloco deve possuir loading independente e estado vazio estável.
- **REQ-011**: O backend deve expor `GET /api/dashboard?fazendaId=<uuid|todas>`.
- **REQ-012**: O backend deve expor `GET /api/cotacao/dolar`.
- **BIZ-001**: Usuário `FUNCIONARIO` só pode visualizar dados das fazendas às quais está vinculado.
- **BIZ-002**: A visão `todas` consolida apenas fazendas visíveis ao usuário autenticado.
- **BIZ-003**: O extrato recente deve mesclar gastos e lucros em uma lista única ordenada por data decrescente.
- **BIZ-004**: O estoque do dashboard não pode depender de tabela `estoque`; deve ser calculado a partir de colheitas.
- **BIZ-005**: O dashboard deve responder com arrays vazios e totais zerados quando não houver dados operacionais.
- **CON-001**: O frontend deve usar Zustand para estado cliente e TanStack Query para dados remotos.
- **CON-002**: Os gráficos devem ser implementados com Recharts.
- **CON-003**: A header deve preservar o comportamento atual de logout e menu mobile.
- **CON-004**: A base de dados já possui os índices necessários no Prisma e não deve receber nova tabela de estoque.
- **PAT-001**: Novos controllers/services/repositories/views devem seguir os padrões já existentes em `fazenda.*`.
- **PAT-002**: Novos hooks e services do frontend devem seguir os padrões já existentes em `useFazendaQueries.js` e `fazenda.service.js`.
- **SEC-001**: Endpoints do dashboard e cotação devem respeitar autenticação e visibilidade por fazenda.

## 2. Implementation Steps

### Phase 1: Contrato Backend do Dashboard e Cotação

- **GOAL-001**: Criar a superfície mínima de API para dashboard e cotação com validação, rotas e testes unitários dos contratos.
- **DEPENDS ON**: None
- **INCLUDES TESTS**: Yes

| Task | Description | File Action | Completed | Date |
|------|-------------|-------------|-----------|------|
| TASK-001 | Criar `dashboard.schema.js` com `dashboardFiltroSchema` aceitando UUID ou literal `todas`. | [CREATE] Codigo/Agrofarm/api/src/schemas/dashboard.schema.js | | |
| TASK-002 | Criar `dashboard.controller.js` com `getDados()` e delegação para o service. | [CREATE] Codigo/Agrofarm/api/src/controllers/dashboard.controller.js | | |
| TASK-003 | Criar `dashboard.routes.js` com `GET /api/dashboard` protegido por autenticação. | [CREATE] Codigo/Agrofarm/api/src/routes/dashboard.routes.js | | |
| TASK-004 | Implementar `cotacao.controller.js` com `getDolar()`. | [MODIFY] Codigo/Agrofarm/api/src/controllers/cotacao.controller.js | | |
| TASK-005 | Implementar `cotacao.routes.js` com `GET /api/cotacao/dolar`. | [MODIFY] Codigo/Agrofarm/api/src/routes/cotacao.routes.js | | |
| TASK-006 | Registrar `/dashboard` e `/cotacao` em `routes/index.js`. | [MODIFY] Codigo/Agrofarm/api/src/routes/index.js | | |
| TASK-007 | Criar testes unitários para schema, controller e routes de dashboard/cotação. | [CREATE] Codigo/Agrofarm/api/src/tests/unit/dashboard.controller.spec.js | | |
| TASK-008 | Criar testes unitários para cotação controller/route contract. | [CREATE] Codigo/Agrofarm/api/src/tests/unit/cotacao.controller.spec.js | | |

### Phase 2: Agregações Backend e Payload Final

- **GOAL-002**: Implementar a lógica de agregação do dashboard, visibilidade por fazenda e payload final consumido pelo frontend.
- **DEPENDS ON**: Phase 1
- **INCLUDES TESTS**: Yes

| Task | Description | File Action | Completed | Date |
|------|-------------|-------------|-----------|------|
| TASK-009 | Criar `dashboard.repository.js` com consultas de produção, estoque derivado, extrato e totais financeiros. | [CREATE] Codigo/Agrofarm/api/src/repositories/dashboard.repository.js | | |
| TASK-010 | Criar `dashboard.service.js` com resolução de escopo por fazenda, visão `todas`, regras de acesso e montagem do retorno. | [CREATE] Codigo/Agrofarm/api/src/services/dashboard.service.js | | |
| TASK-011 | Criar `dashboard.view.js` para padronizar o payload do endpoint. | [CREATE] Codigo/Agrofarm/api/src/views/dashboard.view.js | | |
| TASK-012 | Implementar `cotacao.service.js` para buscar a cotação atual do dólar usando a estrutura existente de `cotacoes`. | [MODIFY] Codigo/Agrofarm/api/src/services/cotacao.service.js | | |
| TASK-013 | Implementar `cotacao.view.js` com `renderDolar()`. | [MODIFY] Codigo/Agrofarm/api/src/views/cotacao.view.js | | |
| TASK-014 | Adicionar testes unitários para repository/service/view do dashboard cobrindo visão por fazenda, visão `todas`, sem dados e restrição de acesso. | [CREATE] Codigo/Agrofarm/api/src/tests/unit/dashboard.service.spec.js | | |
| TASK-015 | Adicionar testes unitários para `cotacao.service.js` e `cotacao.view.js`. | [CREATE] Codigo/Agrofarm/api/src/tests/unit/cotacao.service.spec.js | | |

### Phase 3: Estado Global e Header com Seletor de Fazenda

- **GOAL-003**: Preparar o frontend para controlar a fazenda ativa e refletir o protótipo na header sem ainda montar todos os blocos do dashboard.
- **DEPENDS ON**: Phase 2
- **INCLUDES TESTS**: Yes

| Task | Description | File Action | Completed | Date |
|------|-------------|-------------|-----------|------|
| TASK-016 | Implementar `fazendaSlice.js` com `fazendaSelecionada`, setter e suporte ao literal `todas`. | [MODIFY] Codigo/Agrofarm/web/src/store/slices/fazendaSlice.js | | |
| TASK-017 | Ajustar a store raiz para incluir o slice de fazenda, se necessário. | [MODIFY] Codigo/Agrofarm/web/src/store/authStore.js | | |
| TASK-018 | Adaptar `Header.jsx` para o layout do protótipo no desktop, preservando menu mobile e logout. | [MODIFY] Codigo/Agrofarm/web/src/components/shared/Header/Header.jsx | | |
| TASK-019 | Integrar o seletor central de fazenda à lista real de fazendas e à opção `Todas as Fazendas`. | [MODIFY] Codigo/Agrofarm/web/src/components/shared/Header/Header.jsx | | |
| TASK-020 | Criar testes do estado global e do comportamento básico do seletor na header. | [CREATE] Codigo/Agrofarm/web/src/store/slices/fazendaSlice.spec.js | | |
| TASK-021 | Criar testes do componente de header cobrindo renderização, troca de fazenda e manutenção do logout/menu mobile. | [CREATE] Codigo/Agrofarm/web/src/components/shared/Header/Header.spec.jsx | | |

### Phase 4: Serviços, Hooks e Página do Dashboard

- **GOAL-004**: Implementar a página do dashboard, seus serviços e hooks de dados, com os blocos visuais principais e estados de loading/vazio.
- **DEPENDS ON**: Phase 3
- **INCLUDES TESTS**: Yes

| Task | Description | File Action | Completed | Date |
|------|-------------|-------------|-----------|------|
| TASK-022 | Criar `dashboard.service.js` no frontend com `buscarDashboard(fazendaId)`. | [CREATE] Codigo/Agrofarm/web/src/services/dashboard/dashboard.service.js | | |
| TASK-023 | Implementar `cotacao.service.js` no frontend com `buscarCotacaoDolar()`. | [MODIFY] Codigo/Agrofarm/web/src/services/cotacao/cotacao.service.js | | |
| TASK-024 | Criar `useDashboardQueries.js` com `useDashboardQuery(fazendaId)`. | [CREATE] Codigo/Agrofarm/web/src/queries/dashboard/useDashboardQueries.js | | |
| TASK-025 | Implementar `useCotacaoQueries.js` com `useCotacaoDolarQuery()`. | [MODIFY] Codigo/Agrofarm/web/src/queries/cotacao/useCotacaoQueries.js | | |
| TASK-026 | Implementar `Dashboard.jsx` com banner de recomendação, gráfico de produção por cultura, extrato recente, bloco de estoque derivado e cards financeiros. | [MODIFY] Codigo/Agrofarm/web/src/pages/Dashboard/Dashboard.jsx | | |
| TASK-027 | Criar componentes auxiliares do dashboard quando necessário para manter a página enxuta. | [CREATE] Codigo/Agrofarm/web/src/pages/Dashboard/components/ | | |
| TASK-028 | Criar testes dos hooks de dashboard/cotação e da renderização principal do dashboard com loading, dados e estado vazio. | [CREATE] Codigo/Agrofarm/web/src/pages/Dashboard/Dashboard.spec.jsx | | |

### Phase 5: Integração da Rota Principal e Ajustes Finais

- **GOAL-005**: Tornar o dashboard a tela real da rota `/` e finalizar o fluxo integrado frontend/backend.
- **DEPENDS ON**: Phase 4
- **INCLUDES TESTS**: Yes

| Task | Description | File Action | Completed | Date |
|------|-------------|-------------|-----------|------|
| TASK-029 | Ajustar `App.jsx` para manter `/` apontando para a implementação final do dashboard. | [MODIFY] Codigo/Agrofarm/web/src/App.jsx | | |
| TASK-030 | Substituir o placeholder de `Home.jsx` por delegação simples para `Dashboard.jsx` ou remover sua relevância no fluxo principal, conforme a implementação escolhida. | [MODIFY] Codigo/Agrofarm/web/src/pages/Home/Home.jsx | | |
| TASK-031 | Validar integração completa entre seletor de fazenda, queries e tela renderizada. | [MODIFY] Codigo/Agrofarm/web/src/pages/Dashboard/Dashboard.spec.jsx | | |
| TASK-032 | Adicionar testes de integração leve da rota principal e persistência da fazenda selecionada. | [CREATE] Codigo/Agrofarm/web/src/App.dashboard.spec.jsx | | |

## 3. Alternatives

- **ALT-001**: Manter `Home.jsx` como dashboard definitivo. Não escolhido porque `Dashboard.jsx` já existe como ponto natural de responsabilidade e separa melhor placeholder legado da tela real.
- **ALT-002**: Criar tabela específica de estoque. Não escolhido porque contradiz a regra fechada do escopo e o banco atual já suporta o cálculo derivado por colheitas.
- **ALT-003**: Deixar toda a transformação de dados no frontend. Não escolhido porque aumentaria duplicação e complexidade visual; o backend deve entregar payload mais próximo do consumo final.

## 4. Dependencies

- **DEP-001**: Modelos Prisma existentes `colheitas`, `gastos`, `lucros`, `cotacoes`, `fazendas` e `usuarios_fazendas`.
- **DEP-002**: Índices já presentes no Prisma para `colheitas`, `gastos`, `lucros` e `cotacoes`.
- **DEP-003**: `src/services/fazenda/fazenda.service.js` e `src/queries/fazenda/useFazendaQueries.js` para alimentar o seletor da header.
- **DEP-004**: `src/components/shared/Header/Header.jsx` e `src/layouts/MainLayout.jsx` como superfícies de composição do dashboard.
- **DEP-005**: Biblioteca Recharts no frontend. Se não estiver instalada ainda, a implementação deverá adicioná-la.

## 5. Files

Actions: [CREATE] | [MODIFY] | [DELETE] | [RENAME]

- **FILE-001**: [CREATE] Codigo/Agrofarm/api/src/controllers/dashboard.controller.js — controller do endpoint do dashboard.
- **FILE-002**: [CREATE] Codigo/Agrofarm/api/src/services/dashboard.service.js — regras de negócio e agregações do dashboard.
- **FILE-003**: [CREATE] Codigo/Agrofarm/api/src/repositories/dashboard.repository.js — consultas agregadas por fazenda/consolidado.
- **FILE-004**: [CREATE] Codigo/Agrofarm/api/src/views/dashboard.view.js — formatação do payload do dashboard.
- **FILE-005**: [CREATE] Codigo/Agrofarm/api/src/schemas/dashboard.schema.js — validação da query do dashboard.
- **FILE-006**: [CREATE] Codigo/Agrofarm/api/src/routes/dashboard.routes.js — rota `/api/dashboard`.
- **FILE-007**: [MODIFY] Codigo/Agrofarm/api/src/controllers/cotacao.controller.js — endpoint de cotação do dólar.
- **FILE-008**: [MODIFY] Codigo/Agrofarm/api/src/services/cotacao.service.js — lógica de cotação.
- **FILE-009**: [MODIFY] Codigo/Agrofarm/api/src/views/cotacao.view.js — formatação do payload de cotação.
- **FILE-010**: [MODIFY] Codigo/Agrofarm/api/src/routes/cotacao.routes.js — rota `/api/cotacao/dolar`.
- **FILE-011**: [MODIFY] Codigo/Agrofarm/api/src/routes/index.js — registro das novas rotas.
- **FILE-012**: [CREATE] Codigo/Agrofarm/api/src/schemas/cotacao.schema.js — schema de cotação, se necessário.
- **FILE-013**: [MODIFY] Codigo/Agrofarm/web/src/store/slices/fazendaSlice.js — estado global da fazenda selecionada.
- **FILE-014**: [MODIFY] Codigo/Agrofarm/web/src/components/shared/Header/Header.jsx — layout do protótipo e seletor central de fazenda.
- **FILE-015**: [CREATE] Codigo/Agrofarm/web/src/services/dashboard/dashboard.service.js — acesso ao endpoint de dashboard.
- **FILE-016**: [MODIFY] Codigo/Agrofarm/web/src/services/cotacao/cotacao.service.js — acesso ao endpoint de cotação.
- **FILE-017**: [CREATE] Codigo/Agrofarm/web/src/queries/dashboard/useDashboardQueries.js — hook de dados do dashboard.
- **FILE-018**: [MODIFY] Codigo/Agrofarm/web/src/queries/cotacao/useCotacaoQueries.js — hook de cotação.
- **FILE-019**: [MODIFY] Codigo/Agrofarm/web/src/pages/Dashboard/Dashboard.jsx — página real do dashboard.
- **FILE-020**: [CREATE] Codigo/Agrofarm/web/src/pages/Dashboard/components/ — componentes visuais auxiliares do dashboard.
- **FILE-021**: [MODIFY] Codigo/Agrofarm/web/src/pages/Home/Home.jsx — delegação/ajuste do placeholder atual.
- **FILE-022**: [MODIFY] Codigo/Agrofarm/web/src/App.jsx — rota principal do dashboard.
- **FILE-023**: [CREATE] Codigo/Agrofarm/api/src/tests/unit/dashboard.controller.spec.js — testes de controller/rota do dashboard.
- **FILE-024**: [CREATE] Codigo/Agrofarm/api/src/tests/unit/dashboard.service.spec.js — testes da lógica do dashboard.
- **FILE-025**: [CREATE] Codigo/Agrofarm/api/src/tests/unit/cotacao.controller.spec.js — testes do contrato de cotação.
- **FILE-026**: [CREATE] Codigo/Agrofarm/api/src/tests/unit/cotacao.service.spec.js — testes da lógica de cotação.
- **FILE-027**: [CREATE] Codigo/Agrofarm/web/src/store/slices/fazendaSlice.spec.js — testes do estado global.
- **FILE-028**: [CREATE] Codigo/Agrofarm/web/src/components/shared/Header/Header.spec.jsx — testes da header.
- **FILE-029**: [CREATE] Codigo/Agrofarm/web/src/pages/Dashboard/Dashboard.spec.jsx — testes da página do dashboard.
- **FILE-030**: [CREATE] Codigo/Agrofarm/web/src/App.dashboard.spec.jsx — testes de integração leve da rota principal.

## 6. Testing

- **TEST-001**: Validar `dashboardFiltroSchema` aceitando UUID e `todas`, e rejeitando parâmetros inválidos.
- **TEST-002**: Validar `dashboard.controller.js` e `cotacao.controller.js` retornando status e contratos esperados.
- **TEST-003**: Validar `dashboard.service.js` para visão por fazenda, consolidada, sem dados e sem acesso.
- **TEST-004**: Validar `dashboard.repository.js` com agregações coerentes de produção, extrato e totais.
- **TEST-005**: Validar `cotacao.service.js` e `cotacao.view.js` para retorno estável da cotação.
- **TEST-006**: Validar `fazendaSlice.js` para persistência e troca de fazenda selecionada.
- **TEST-007**: Validar `Header.jsx` renderizando seletor, opção `Todas as Fazendas` e preservando logout/menu mobile.
- **TEST-008**: Validar `Dashboard.jsx` para loading, dados completos e estado vazio.
- **TEST-009**: Validar a rota `/` exibindo o dashboard final após a integração.

## 7. Verification

| Step | Type | Action | Expected Result | Maps to |
|------|------|--------|-----------------|---------|
| VER-001 | TEST | Rodar testes unitários do backend do dashboard | Todos passam | REQ-011, REQ-012 |
| VER-002 | TEST | Rodar testes unitários do frontend do dashboard | Todos passam | REQ-001, REQ-002, REQ-004 |
| VER-003 | API | Chamar `GET /api/dashboard?fazendaId=todas` autenticado | Retorna payload consolidado estável | REQ-003, REQ-011 |
| VER-004 | API | Chamar `GET /api/dashboard?fazendaId=<uuid>` com usuário vinculado | Retorna somente dados da fazenda escolhida | BIZ-001 |
| VER-005 | API | Chamar `GET /api/cotacao/dolar` | Retorna valor de cotação consumível pelo card | REQ-009, REQ-012 |
| VER-006 | UI | Trocar a fazenda no seletor da header | Todos os blocos do dashboard recarregam | REQ-004 |
| VER-007 | UI | Abrir o dashboard sem dados operacionais | Exibe zeros/estados vazios sem quebra | REQ-010, BIZ-005 |
| VER-008 | UI | Validar dashboard em desktop e mobile | Layout permanece utilizável | REQ-002, REQ-010 |

## 8. Risks & Assumptions

- **RISK-001**: A ausência de implementação prévia em `cotacao.*` pode exigir definição de contrato com fonte externa ou fallback controlado.
- **RISK-002**: O layout atual da header tem fundo escuro e estrutura diferente do protótipo, o que pode exigir ajuste fino de composição no `MainLayout`.
- **RISK-003**: O payload de recomendação de IA pode chegar vazio na primeira iteração, exigindo fallback visual no banner.
- **ASSUMPTION-001**: Os índices do banco já executados e refletidos no Prisma são suficientes para a primeira versão do dashboard.
- **ASSUMPTION-002**: A visão de estoque do dashboard será derivada das colheitas, sem venda abatida por tabela específica de estoque.
- **ASSUMPTION-003**: A implementação continuará usando `/` como rota principal do dashboard.

## 9. Related Specifications / Further Reading

- `.github/plans/cards/[EPIC] Refinamento-Dashboard.md`
- `Codigo/Agrofarm/api/prisma/schema.prisma`
- `Codigo/Agrofarm/api/src/services/fazenda.service.js`
- `Codigo/Agrofarm/api/src/controllers/fazenda.controller.js`
- `Codigo/Agrofarm/web/src/queries/fazenda/useFazendaQueries.js`
- `Codigo/Agrofarm/web/src/services/fazenda/fazenda.service.js`
- `Codigo/Agrofarm/web/src/components/shared/Header/Header.jsx`
- `Codigo/Agrofarm/web/src/pages/Home/Home.jsx`