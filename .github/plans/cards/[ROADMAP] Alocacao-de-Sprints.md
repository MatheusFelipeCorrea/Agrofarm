# [ROADMAP] Alocação de Sprints

Tipo:        Roadmap
Prioridade:  🔺 Highest
Horizonte:   (preencher)
Responsável: (preencher)
Objetivo:    Organizar os épicos e o fix em ordem de implementação por dependência técnica e valor entregue.

## 📌 Status Auditado no Codigo (24/04/2026)

- Este arquivo e de planejamento e alocacao de sprints. (CONCLUIDO)
- Status de implementacao tecnica deve ser acompanhado nos cards de FIX/EPIC e no codigo. (CONCLUIDO)

## 📝 Premissa

Este README existe apenas para planejamento de execução.
Ele não substitui os épicos refinados já criados em `.github/plans/cards/`.
A ideia aqui é te dar uma ordem recomendada para alocar as entregas nas sprints sem quebrar dependências entre módulos.

---

## 🔗 Dependências Principais

### Base obrigatória
- [EPIC] Autenticação e Controle de Acesso
- [FIX] Gerenciar Usuários — Vínculo com Uma ou Mais Fazendas
- [FIX] Autenticação Frontend — Rotas, Sessão e Recuperação
- [FIX] Sidebar com Menu Dinâmico por Permissão
- [EPIC] Tela Fazenda Selecionada
- [EPIC] Refinamento do Dashboard

### Dependem diretamente do FIX de usuários
- [EPIC] Refinamento-Tela-de-Lucros
- [EPIC] Refinamento-Tela-de-Colheitas
- [EPIC] Refinamento-Tela-de-Gastos
- [EPIC] Refinamento-Tela-de-Lembretes
- [EPIC] Refinamento-Chatbot

### Dependem da base cadastral de fazendas e culturas
- [EPIC] Refinamento-Tela-de-Colheitas
- [EPIC] Refinamento-Tela-de-Gastos
- [EPIC] Refinamento-Tela-de-Lucros
- [EPIC] Refinamento-Dashboard

### Dependem da navegação final autenticada
- [EPIC] Refinamento-Dashboard
- [EPIC] Refinamento-Tela-de-Lembretes
- [EPIC] Refinamento-Tela-de-Insights-Inteligentes
- [EPIC] Refinamento-Chatbot

### Dependem diretamente do Dashboard ou compartilham sua base de dados consolidados
- [EPIC] Refinamento-Tela-de-Insights-Inteligentes
- [EPIC] Refinamento-Tela-de-Simulacao
- [EPIC] Refinamento-Chatbot

### Dependências funcionais entre módulos
- Gastos impacta Lembretes: vencimentos futuros entram no calendário.
- Gastos impacta Dashboard: totais e extrato.
- Lucros impacta Dashboard: totais e extrato.
- Colheitas impacta Dashboard: produção por cultura e estoque.
- Dashboard impacta Simulação: base financeira consolidada e escopo de fazenda.
- Dashboard impacta Insights Inteligentes: base consolidada para análises com Gemini.
- Dashboard impacta Chatbot: ponto de entrada pelo ícone fixo e parte do contexto operacional.

---

## 📊 Status de Planejamento

Use esta seção para marcar o que já foi refinado, criado ou implementado.

### Refinados em README
- [x] Epic Autenticação e Controle de Acesso (CONCLUIDO)
- [x] FIX Gerenciar Usuários — vínculo com fazendas (CONCLUIDO)
- [x] FIX Autenticação Frontend — rotas, sessão e recuperação (CONCLUIDO)
- [x] FIX Sidebar com menu dinâmico por permissão (CONCLUIDO)
- [x] Epic Tela Fazenda Selecionada (CONCLUIDO)
- [x] Refinamento Tela de Colheitas (CONCLUIDO)
- [x] Refinamento Tela de Lucros (CONCLUIDO)
- [x] Refinamento Tela de Gastos (CONCLUIDO)
- [x] Refinamento Dashboard (CONCLUIDO)
- [x] Refinamento Tela de Lembretes (CONCLUIDO)
- [x] Refinamento Tela de Simulação (CONCLUIDO)
- [x] Refinamento Chatbot (CONCLUIDO)
- [x] Refinamento Tela de Insights Inteligentes (CONCLUIDO)

### Implementados no código
- [ ] A preencher com base nos cards já implementados pelo time

### Cards recebidos do time e validados nesta revisão
- [x] Autenticação e Controle de Acesso (CONCLUIDO)
- [x] Tela Fazenda Selecionada (CONCLUIDO)
- [x] Gerenciar Usuários como base visual/CRUD (CONCLUIDO)
- [x] Gerenciar Usuários marcado como dependente do fix de vínculo com fazendas (CONCLUIDO)

### Status real (atualizado em 19/04/2026)
- [x] Sprint 2 concluída e entregue em 13/04/2026. (CONCLUIDO)
- [x] Time operando 1 sprint adiantado em relação à trilha base deste roadmap. (CONCLUIDO)
- [ ] Manter avanço sem sacrificar qualidade (testes, validação cruzada front/back e estabilização).

---

## ⚡ Operação Adiantada (1 Sprint à Frente)

Contexto operacional:
- Como a Sprint 2 já foi entregue em 13/04 e o time está 1 sprint à frente, o plano passa a priorizar antecipação controlada de escopo para ampliar folga no fim do semestre.

Diretriz de execução:
1. Executar o escopo da Sprint seguinte em paralelo controlado, mantendo dependências técnicas.
2. Reservar capacidade fixa por sprint para hardening (bugs críticos, regressão e refinamento de contratos).
3. Evitar abrir frentes novas sem fechar critérios de aceite das frentes já iniciadas.

Regra prática de capacidade (recomendada):
- 70% da capacidade para avanço funcional.
- 30% da capacidade para qualidade e estabilização contínua.

---

## 🚀 Ordem Recomendada

### Sprint 1 — Fundacional

Objetivo:
Fechar autenticação, sessão, permissões e navegação base da aplicação.

Itens recomendados:
1. [EPIC] Autenticacao-e-Controle-de-Acesso
2. [FIX] Autenticacao-Frontend-Rotas-Sessao-e-Recuperacao
3. [FIX] Gerenciar-Usuarios-Vinculo-com-Fazendas
4. [FIX] Sidebar-Menu-Dinamico-por-Permissao
5. Ajustes de auth para retornar `fazendasVinculadas`
6. Ajustes de create/update de usuário com payload único
7. Estrutura N:N `usuarios_fazendas`

Resultado esperado:
- Sessão e redirecionamentos base ficam coerentes.
- Escopo por fazenda deixa de ser implícito/manual.
- ADMIN e FUNCIONARIO passam a ter modelo consistente de visibilidade.
- Navegação autenticada passa a respeitar o perfil vindo do backend.
- Base pronta para Fazendas, Lucros, Colheitas, Gastos, Lembretes, Dashboard e Chatbot.

---

### Sprint 2 — Base Cadastral de Fazendas

Objetivo:
Entregar o módulo de fazendas com entrada na tela de detalhe, gestão de culturas e permissões coerentes por perfil.

Itens recomendados:
1. [EPIC] Tela-Fazenda-Selecionada
2. Listagem/base da tela de Fazendas
3. Gestão de culturas vinculadas por fazenda
4. Soft delete e impacto de exclusão

Justificativa:
- O domínio de fazendas e culturas já existe no schema.
- A página frontend de fazendas e as camadas principais de backend ainda estão vazias.
- Colheitas, Gastos e Lucros dependem de fazendas e culturas utilizáveis no sistema.

Resultado esperado:
- Entrada funcional para o módulo de Fazendas.
- Tela de detalhe com permissões por papel.
- Base pronta para alimentar os módulos operacionais seguintes.

---

### Sprint 3 — Núcleo Operacional Financeiro

Objetivo:
Colocar os módulos operacionais principais em dados reais, com restrição por fazendas e filtros padronizados.

Cards da sprint:
1. [FIX] Limites de Escopo — Cultura Global x Cultura na Fazenda
1. [EPIC] Refinamento-Tela-de-Colheitas
2. [EPIC] Refinamento-Tela-de-Lucros
3. [EPIC] Refinamento-Tela-de-Gastos

Checklist da sprint:
- Fechar contratos de API entre Colheitas, Lucros e Gastos.
- Remover fluxos mock e consolidar integração backend real.
- Garantir regra de escopo por fazenda em todos os filtros.
- Padronizar payloads de create/update para reduzir retrabalho na sprint 4.

Justificativa:
- Colheitas alimenta produção/estoque.
- Lucros e Gastos alimentam totais financeiros e extrato.
- Esses três épicos sustentam os cálculos e consolidações do Dashboard e da Simulação.

Resultado esperado:
- CRUDs principais operando com backend real.
- Filtros e modais padronizados.
- Dados financeiros e produtivos confiáveis para o painel principal.
- Sem ambiguidade entre cadastro global de cultura e vínculo cultura/fazenda.

---

### Sprint 4 — Consolidação Analítica

Objetivo:
Entregar a visão gerencial central com dados consolidados por fazenda ou por “Todas as Fazendas”.

Cards da sprint:
1. [EPIC] Refinamento-Dashboard
2. Cotação com cache
3. Extrato recente consolidado
4. Persistência de fazenda selecionada no contexto global

Checklist da sprint:
- Consolidar consultas por escopo: fazenda única e todas as fazendas.
- Padronizar indicadores com base no mesmo recorte temporal.
- Definir fallback visual quando não houver dados suficientes.

Resultado esperado:
- Tela principal pronta e coerente com os módulos anteriores.
- Base consolidada para perguntas rápidas no Chatbot.
- Base consolidada para cálculos na Simulação.

---

### Sprint 5 — Inteligência Analítica

Objetivo:
Entregar a camada analítica gerada por IA para apoiar decisões do administrador a partir da base consolidada do dashboard.

Cards da sprint:
1. [EPIC] Refinamento-Tela-de-Insights-Inteligentes
2. Integração Gemini para geração de insights
3. Persistência de snapshots e timestamp dos cards

Checklist da sprint:
- Validar geração de insights por escopo de fazenda.
- Garantir refresh manual apenas nos cards definidos.
- Exibir data/hora de geração de forma consistente.
- Isolar falhas de IA por card sem derrubar a tela inteira.

Justificativa:
- Insights depende diretamente dos dados consolidados do Dashboard.
- Faz sentido entrar antes do Chatbot porque usa menos interação livre e ajuda a estabilizar a camada de IA.

Resultado esperado:
- Tela analítica exclusiva de ADMIN.
- Refresh manual dos cards analíticos.
- Base de IA mais madura para o Chatbot.

---

### Sprint 6 — Agenda Operacional

Objetivo:
Entregar gestão de lembretes e agenda integrada com vencimentos de gastos.

Cards da sprint:
1. [EPIC] Refinamento-Tela-de-Lembretes
2. Integração com Evolution API
3. Integração de eventos derivados de gastos no calendário

Checklist da sprint:
- Garantir sincronização entre lembretes manuais e lembretes derivados.
- Validar timezone para datas do calendário e WhatsApp.
- Garantir regra de permissão por fazenda e por perfil.

Justificativa:
- Lembretes depende de Gastos para eventos de vencimento.
- Também depende da regra de escopo por fazenda já estabilizada no fix.

Resultado esperado:
- Calendário funcional.
- Cards de lembrete com ações.
- Alertas prontos para fluxo com WhatsApp.

---

### Sprint 7 — Simulação e Apoio à Decisão

Objetivo:
Entregar ferramentas de apoio à decisão financeira usando dados consolidados do sistema.

Cards da sprint:
1. [EPIC] Refinamento-Tela-de-Simulacao

Checklist da sprint:
- Reaproveitar agregações do Dashboard para evitar duplicação de regra.
- Garantir coerência entre resultado da simulação e totais reais.
- Validar cenários com dados incompletos sem quebrar UX.

Justificativa:
- Depende fortemente de Dashboard, Gastos, Lucros e Cotação.
- Faz mais sentido depois que os dados base estiverem confiáveis.

Resultado esperado:
- Simulação usando totais reais.
- Escopo por fazenda ou consolidado.
- Card de resultados e total gasto coerentes com o sistema.

---

### Sprint 8 — Consulta Inteligente

Objetivo:
Entregar o Chatbot com contexto da aplicação inteira e regras de acesso corretas.

Cards da sprint:
1. [EPIC] Refinamento-Chatbot

Checklist da sprint:
- Contextualizar respostas por perfil e fazendas permitidas.
- Definir fallback para perguntas fora do escopo de dados do sistema.
- Logar sessões e erros para evolução da qualidade de resposta.

Justificativa:
- Chatbot depende do conjunto dos módulos já estruturados.
- Quanto mais telas entregues antes, melhor o contexto da IA.

Resultado esperado:
- Perguntas rápidas sobre estoque, gastos, lucros, colheitas e lembretes.
- Respostas contextualizadas por perfil e fazendas permitidas.
- Ponto de entrada via Dashboard.

---

## ⏱️ Plano Enxuto Até Junho (6 pessoas)

Premissas usadas:
- Time com 6 pessoas.
- Sprint de 2 semanas.
- Objetivo: terminar implementação principal antes de junho e guardar folga para estabilização.

Estratégia de alocação por trilha:
- Trilha A (2 pessoas): Backend Core e banco.
- Trilha B (2 pessoas): Frontend Core e UX.
- Trilha C (1 pessoa): Integração, QA funcional e testes de regressão.
- Trilha D (1 pessoa): IA/Analytics e suporte transversal.

### Sprint 3 (22/04 a 05/05) — Operacional Fechado

Cards principais:
1. [FIX] Limites-Escopo-Cultura-Global-x-Cultura-na-Fazenda
2. [EPIC] Refinamento-Tela-de-Colheitas
3. [EPIC] Refinamento-Tela-de-Lucros
4. [EPIC] Refinamento-Tela-de-Gastos

Alocação sugerida:
1. Trilha A: contratos e regras backend de Colheitas/Lucros/Gastos.
2. Trilha B: telas, filtros e modais dos 3 módulos.
3. Trilha C: testes de fluxo fim a fim, principalmente permissões e filtros por fazenda.
4. Trilha D: apoio de dados consolidados e definição de métricas para dashboard.

Saída obrigatória da sprint:
- Núcleo operacional sem mock e com dados reais.
- Regra de cultura global x vínculo por fazenda sem ambiguidade.

### Sprint 4 (06/05 a 19/05) — Gestão e Inteligência Base

Cards principais:
1. [EPIC] Refinamento-Dashboard
2. [EPIC] Refinamento-Tela-de-Insights-Inteligentes
3. [EPIC] Refinamento-Tela-de-Lembretes (MVP funcional)

Alocação sugerida:
1. Trilha A: agregações do dashboard + persistência de snapshots de insights.
2. Trilha B: dashboard + tela de insights + lembretes MVP.
3. Trilha C: validação de consistência entre operacionais e dashboard.
4. Trilha D: integração Gemini e fallback por card.

Saída obrigatória da sprint:
- Dashboard operacional.
- Insights com refresh e timestamp.
- Lembretes no ar em versão MVP.

### Sprint 5 (20/05 a 02/06) — Hardening e Folga Técnica

Cards principais:
1. [EPIC] Refinamento-Tela-de-Simulacao (MVP)
2. [EPIC] Refinamento-Chatbot (MVP)
3. Correções de bugs e regressão geral

Alocação sugerida:
1. Trilha A/B: fechar MVP de Simulação e Chatbot sem expandir escopo.
2. Trilha C: bateria de regressão completa e checklist de apresentação.
3. Trilha D: qualidade de respostas IA e observabilidade mínima.

Saída obrigatória da sprint:
- Congelamento funcional até 30/05.
- Primeiros dias finais da sprint usados só para ajustes e estabilidade.

### Sprint Livre (reserva)

Uso recomendado:
1. Somente correção de bug crítico e acabamento.
2. Ensaio de demo e validação final de roteiro.
3. Sem iniciar features novas.

Nota de viabilidade:
- Com o escopo atual, 1 sprint livre é viável.
- Para 2 sprints livres, precisa reduzir escopo de Sprint 5 (ex.: mover Chatbot completo para pós-entrega e manter apenas MVP interno).

### Ajuste com adiantamento já conquistado

Situação atual:
- Sprint 2 foi finalizada em 13/04.
- O time está 1 sprint à frente.

Aplicação prática no cronograma:
1. Tratar a execução atual como antecipação da Sprint 3.
2. Puxar itens preparatórios da Sprint 4 (Dashboard e consolidação) assim que os contratos da Sprint 3 estabilizarem.
3. Preservar o objetivo de congelamento funcional até 30/05, mas com margem adicional para:
	- regressão ponta a ponta;
	- polimento de UX;
	- ajustes finos de IA (Insights/Chatbot) sem pressionar prazo.

Ganho esperado:
- aumento de previsibilidade para entrega final;
- redução de risco de acúmulo de bugs no fechamento do semestre;
- possibilidade real de ampliar a sprint livre de reserva (de 1 para até 2, se escopo de IA ficar em MVP no prazo).

---

## 📦 Alternativa de Agrupamento Menor

Se você precisar dividir mais fino, eu recomendo estes blocos:

### Bloco A — Infra e permissão
1. Auth
2. Fix de auth frontend
3. Fix de usuários
4. Fix da sidebar
5. Escopo de fazendas

### Bloco B — Base cadastral
1. Fazendas
2. Culturas por fazenda
3. Permissões da tela selecionada

### Bloco C — Operacional
1. Colheitas
2. Lucros
3. Gastos

### Bloco D — Visão gerencial
1. Dashboard
2. Cotação
3. Extrato consolidado

### Bloco E — Agenda e comunicação
1. Lembretes
2. Evolution API

### Bloco F — Inteligência e apoio à decisão
1. Simulação
2. Insights Inteligentes
3. Chatbot

---

## ⚠️ Riscos de Planejamento

1. Implementar Chatbot antes de estabilizar os módulos operacionais vai gerar respostas frágeis e baixo valor real.
2. Implementar Simulação antes de Dashboard/Gastos/Lucros pode duplicar lógica de agregação financeira.
3. Implementar Lembretes antes de Gastos reduz o valor da integração de vencimentos no calendário.
4. Não fechar o FIX de usuários antes dos demais módulos pode obrigar retrabalho em filtros, permissões e payloads.
5. Implementar Chatbot antes de estabilizar Insights/Dashboard reduz qualidade do contexto entregue à IA.
6. Manter a navegação hardcoded no frontend aumenta retrabalho e expõe estrutura de módulos para perfis sem acesso.
7. Avançar para Colheitas, Gastos e Lucros sem fechar a base de Fazendas aumenta risco de retrabalho em relacionamentos e fluxos de seleção.
8. Manter o fluxo atual de autenticação sem alinhar rotas, logout e recuperação de senha quebra consistência com o layout e com a navegação final.
9. Misturar no mesmo card operações de cultura global com operações de vínculo cultura/fazenda aumenta risco de regressão nas regras de negócio.

---

## ✅ Recomendação Final

Ordem ideal de execução:
1. Autenticação e Controle de Acesso
2. FIX Autenticação Frontend
3. FIX Gerenciar Usuários — vínculo com fazendas
4. FIX Sidebar — menu dinâmico por permissão
5. Tela Fazenda Selecionada
6. Colheitas
7. Lucros
8. Gastos
9. Dashboard
10. Insights Inteligentes
11. Lembretes
12. Simulação
13. Chatbot

Se o foco for valor visível para demo mais cedo, uma ordem alternativa aceitável é:
1. Autenticação e Controle de Acesso
2. FIX Gerenciar Usuários
3. FIX Sidebar
4. Tela Fazenda Selecionada
5. Gastos
6. Colheitas
7. Lucros
8. Dashboard
9. Insights Inteligentes
10. Lembretes
11. Simulação
12. Chatbot

---

## 📂 Referências

- [.github/plans/cards/[ANALISE] Revisao-de-Cards-e-FIXes.md](.github/plans/cards/[ANALISE]%20Revisao-de-Cards-e-FIXes.md)
- [.github/plans/cards/[EPIC] Autenticacao-e-Controle-de-Acesso.md](.github/plans/cards/[EPIC]%20Autenticacao-e-Controle-de-Acesso.md)
- [.github/plans/cards/[FIX] Autenticacao-Frontend-Rotas-Sessao-e-Recuperacao.md](.github/plans/cards/[FIX]%20Autenticacao-Frontend-Rotas-Sessao-e-Recuperacao.md)
- [.github/plans/cards/[FIX] Gerenciar-Usuarios-Vinculo-com-Fazendas.md](.github/plans/cards/[FIX]%20Gerenciar-Usuarios-Vinculo-com-Fazendas.md)
- [.github/plans/cards/[FIX] Sidebar-Menu-Dinamico-por-Permissao.md](.github/plans/cards/[FIX]%20Sidebar-Menu-Dinamico-por-Permissao.md)
- [.github/plans/cards/[FIX] Limites-Escopo-Cultura-Global-x-Cultura-na-Fazenda.md](.github/plans/cards/[FIX]%20Limites-Escopo-Cultura-Global-x-Cultura-na-Fazenda.md)
- [.github/plans/cards/[EPIC] Tela-Fazenda-Selecionada.md](.github/plans/cards/[EPIC]%20Tela-Fazenda-Selecionada.md)
- [.github/plans/cards/[EPIC] Refinamento-Tela-de-Colheitas.md](.github/plans/cards/[EPIC]%20Refinamento-Tela-de-Colheitas.md)
- [.github/plans/cards/[EPIC] Refinamento-Tela-de-Lucros.md](.github/plans/cards/[EPIC]%20Refinamento-Tela-de-Lucros.md)
- [.github/plans/cards/[EPIC] Refinamento-Tela-de-Gastos.md](.github/plans/cards/[EPIC]%20Refinamento-Tela-de-Gastos.md)
- [.github/plans/cards/[EPIC] Refinamento-Dashboard.md](.github/plans/cards/[EPIC]%20Refinamento-Dashboard.md)
- [.github/plans/cards/[EPIC] Refinamento-Tela-de-Insights-Inteligentes.md](.github/plans/cards/[EPIC]%20Refinamento-Tela-de-Insights-Inteligentes.md)
- [.github/plans/cards/[EPIC] Refinamento-Tela-de-Lembretes.md](.github/plans/cards/[EPIC]%20Refinamento-Tela-de-Lembretes.md)
- [.github/plans/cards/[EPIC] Refinamento-Tela-de-Simulacao.md](.github/plans/cards/[EPIC]%20Refinamento-Tela-de-Simulacao.md)
- [.github/plans/cards/[EPIC] Refinamento-Chatbot.md](.github/plans/cards/[EPIC]%20Refinamento-Chatbot.md)