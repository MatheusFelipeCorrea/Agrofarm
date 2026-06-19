# [EPIC] Refinamento da Tela de Insights Inteligentes

Tipo:        Epic
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Frontend, Backend, IA, Analytics, UX
Relator:     (preencher)
Pai:         [EPIC] Refinamento do Dashboard
Data Limite: (preencher)

## 📌 Status Auditado no Codigo (25/04/2026)

- Estrutura de persistencia de insights ja existe no Prisma com `insight_snapshots` e indices por tipo/fazenda/data. (CONCLUIDO)
- O modulo backend esta apenas montado no roteamento principal; `ia.controller.js` esta vazio e `ia.routes.js` segue sem endpoints reais. (PENDENTE)
- A superficie frontend de IA segue vazia e ainda nao esta ligada em `App.jsx`. (PENDENTE)

## 📝 Descrição

Como administrador do AgroFarm,
eu quero visualizar insights inteligentes gerados com Gemini sobre estoque, lucros e desempenho das fazendas,
para tomar decisões mais rápidas com base em análises consolidadas e recomendações automáticas.

Esta tela é exclusiva de ADMINISTRADOR e complementa o Dashboard com uma camada analítica baseada em IA. Ela apresenta um card principal de saudação ao usuário logado e cards de insights sobre situação do estoque, desempenho dos lucros, análise das fazendas e recomendação fixa de fazenda.

---

## 🎯 Escopo Funcional

- Tela exclusiva para ADMINISTRADOR.
- Card principal com saudação ao usuário logado.
- Exibir análise para uma fazenda específica ou consolidada de todas as fazendas.
- Cards principais:
  - Situação do Estoque
  - Desempenho dos Lucros
  - Análise das Fazendas e Recomendações
  - Fazenda fixa com destaque analítico
- Os dois primeiros cards devem poder ser atualizados manualmente pelo administrador para ressincronização.
- Abaixo dos cards atualizáveis, exibir dia e horário em que foram gerados.
- Conteúdo analítico gerado com Gemini, mas baseado em dados reais do sistema.
- Respeitar o escopo de fazenda selecionada e modo consolidado (`Todas as Fazendas`) quando aplicável.

---

## ✅ Critérios de Aceite

### Cenário 1 — Acesso restrito
**Dado** que o usuário não é ADMIN
**Quando** tenta acessar a tela de insights
**Então** o acesso é bloqueado.

### Cenário 2 — Saudação inicial
**Dado** que o ADMIN acessou a tela
**Quando** a página carrega
**Então** o card principal exibe uma saudação contextual ao usuário logado.

### Cenário 3 — Situação do estoque
**Dado** que a tela carregou
**Quando** o card de estoque é renderizado
**Então** exibe panorama por cultura com destaque visual e resumo interpretável.

### Cenário 4 — Desempenho dos lucros
**Dado** que a tela carregou
**Quando** o card de lucros é renderizado
**Então** exibe comparação analítica com período anterior e tendência identificada.

### Cenário 5 — Atualização manual dos cards
**Dado** que o ADMIN deseja atualizar os dados dos dois primeiros cards
**Quando** aciona a atualização
**Então** os insights são regenerados e a data/hora de geração é atualizada abaixo do card.

### Cenário 6 — Análise de fazendas
**Dado** que existem dados de múltiplas fazendas
**Quando** o card de análise é gerado
**Então** a IA apresenta comparativos, alertas e oportunidades entre fazendas.

### Cenário 7 — Fazenda fixa destacada
**Dado** que existe fazenda em destaque por critério de negócio
**Quando** o card é renderizado
**Então** mostra resumo do gasto atual, estoque disponível e recomendação específica.

### Cenário 8 — Modo consolidado
**Dado** que o contexto atual está em `Todas as Fazendas`
**Quando** os insights são gerados
**Então** os cards usam dados consolidados e deixam isso explícito na interpretação.

### Cenário 9 — Sem dados suficientes
**Dado** que não há dados suficientes para um insight
**Quando** a IA tenta gerar análise
**Então** a interface mostra mensagem útil sem erro técnico.

---

# [STORY DATABASE] Refinamento Tela de Insights Inteligentes — Banco de Dados

Tipo:        Story
Prioridade:  🔼 High
Sprint:      (preencher)
Categoria:   Banco de Dados
Relator:     (preencher)
Pai:         [EPIC] Refinamento da Tela de Insights Inteligentes
Data Limite: (preencher)

Como sistema, eu quero persistir snapshots de insights com escopo e timestamp, para permitir exibição consistente, atualização manual e rastreabilidade de geração.

SQL a executar:

-- **1. Snapshots de insights (NOVA TABELA)**
CREATE TABLE IF NOT EXISTS insight_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL,
  fazenda_id UUID NULL REFERENCES fazendas(id) ON DELETE SET NULL ON UPDATE CASCADE,
  escopo VARCHAR(20) NOT NULL, -- UNICA | TODAS
  conteudo JSONB NOT NULL,
  gerado_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  gerado_em TIMESTAMP(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insight_snapshots_tipo
ON insight_snapshots (tipo);

CREATE INDEX IF NOT EXISTS idx_insight_snapshots_fazenda_id
ON insight_snapshots (fazenda_id);

CREATE INDEX IF NOT EXISTS idx_insight_snapshots_gerado_em
ON insight_snapshots (gerado_em DESC);

Após executar o SQL:

- Executar no backend:
  - npx prisma db pull
  - npm run db:generate
- Atualizar Prisma:
  - model insight_snapshots

**Critérios de Aceite:**

→ Snapshots persistem o tipo de insight, escopo, conteúdo e timestamp.
→ É possível identificar quando e para qual escopo o insight foi gerado.
→ Consultas por tipo e data possuem índice adequado.

---

# [STORY BACKEND] Refinamento Tela de Insights Inteligentes — Backend

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Backend
Relator:     (preencher)
Pai:         [EPIC] Refinamento da Tela de Insights Inteligentes
Data Limite: (preencher)

## 📝 Descrição
Como sistema, eu quero gerar e servir insights analíticos via Gemini com base nos dados reais do AgroFarm, para alimentar a tela exclusiva de insights do administrador.

---

## ✅ Critérios de Aceite

### Cenário 1 — Buscar insights atuais
**Dado** que o ADMIN acessa a tela
**Quando** GET /api/ia/insights?fazendaId={uuid|todas} é chamado
**Então** retorna os cards analíticos necessários para a tela.

### Cenário 2 — Regenerar insight manualmente
**Dado** que o ADMIN aciona refresh em um dos dois primeiros cards
**Quando** POST /api/ia/insights/refresh é chamado com o tipo do card
**Então** o conteúdo é regenerado e o timestamp é atualizado.

### Cenário 3 — Escopo por fazenda
**Dado** que foi informado `fazendaId=uuid`
**Quando** insight é gerado
**Então** a análise usa apenas os dados da fazenda específica.

### Cenário 4 — Escopo consolidado
**Dado** que foi informado `fazendaId=todas`
**Quando** insight é gerado
**Então** a análise consolida os dados de todas as fazendas.

### Cenário 5 — Falta de dados
**Dado** que não há dados suficientes para um insight
**Quando** o backend prepara o contexto
**Então** retorna conteúdo amigável sinalizando insuficiência de dados.

---

## 🛠️ Implementação

### ia.controller.js (EXISTENTE — MODIFICAR)

Métodos existentes (não alterar):
* chat() -> POST /api/ia/chat
* getHistorico() -> GET /api/ia/chat/sessoes/:sessaoId

Métodos NOVOS a adicionar:
* getInsights() -> GET /api/ia/insights
* refreshInsight() -> POST /api/ia/insights/refresh

### ia.service.js (EXISTENTE — MODIFICAR)

Lógica NOVA a adicionar:
→ Gerar saudação contextual para o usuário logado.
→ Montar contexto de estoque por cultura.
→ Montar contexto comparativo de lucros por período.
→ Montar análise comparativa entre fazendas.
→ Montar card fixo de fazenda em destaque com regra de negócio explícita.
→ Integrar Gemini para geração de texto analítico.
→ Persistir e retornar snapshots de insights.

### ia.repository.js (EXISTENTE — MODIFICAR ou NOVO — CRIAR)

Caso já criado para Chatbot:
→ Reaproveitar para snapshots e histórico de geração.

Métodos NOVOS a adicionar:
→ salvarInsightSnapshot(tipo, escopo, fazendaId, conteudo, geradoPor)
→ buscarInsightsAtuais({ fazendaId, escopo })
→ buscarUltimoInsightPorTipo(tipo, fazendaId, escopo)

### ia.routes.js (EXISTENTE — MODIFICAR)

Rotas NOVAS a adicionar:
* GET /api/ia/insights
* POST /api/ia/insights/refresh

---

## 📐 Schemas (Zod)

### ia.schema.js (EXISTENTE — MODIFICAR)

Schemas NOVOS a adicionar:
→ insightsQuerySchema:
- fazendaId: string uuid ou literal `todas`

→ refreshInsightSchema:
- tipo: enum(ESTOQUE, LUCROS, ANALISE_FAZENDAS, FAZENDA_FIXA)
- fazendaId: string uuid ou literal `todas`

---

## 🚫 Regras de Negócio

- Tela exclusiva para ADMIN.
- Insights devem ser baseados em dados reais do sistema, não texto solto sem contexto.
- Os dois primeiros cards são atualizáveis manualmente.
- Timestamp de geração deve ser exibido abaixo dos cards atualizáveis.
- Conteúdo de análise deve sempre indicar se o escopo é de uma fazenda ou consolidado.

---

# [STORY FRONTEND] Refinamento Tela de Insights Inteligentes — Frontend

Tipo:        Story
Prioridade:  🔼 High
Sprint:      (preencher)
Categoria:   Frontend
Relator:     (preencher)
Pai:         [EPIC] Refinamento da Tela de Insights Inteligentes
Data Limite: (preencher)

## 📝 Descrição
Como administrador, eu quero visualizar uma tela de insights analíticos com atualização manual em cards específicos, para acompanhar a situação do sistema com linguagem interpretativa e prática.

---

## ✅ Critérios de Aceite

### Cenário 1 — Render da tela
**Dado** que sou ADMIN
**Quando** acesso a tela
**Então** vejo card de saudação e os quatro cards de insight.

### Cenário 2 — Atualização manual
**Dado** que estou na tela
**Quando** clico no botão de atualizar no card de estoque ou de lucros
**Então** o card entra em loading, é regenerado e exibe novo timestamp.

### Cenário 3 — Timestamp visível
**Dado** que o card foi gerado
**Quando** a tela exibe seu conteúdo
**Então** mostra dia e horário de geração abaixo do card.

### Cenário 4 — Escopo de fazenda
**Dado** que uma fazenda específica ou `Todas as Fazendas` está selecionada
**Quando** a tela carrega
**Então** os insights refletem esse escopo no conteúdo exibido.

### Cenário 5 — Estado vazio/erro
**Dado** falha ou ausência de dados
**Quando** a tela renderiza
**Então** mostra feedback claro por card, sem quebrar o layout.

---

## 🛠️ Implementação

### pages/IA/IA.jsx (EXISTENTE — MODIFICAR)

Existente (não alterar):
→ Arquivo existente sem implementação.

NOVO a adicionar:
→ Layout da tela conforme layout.
→ Card principal de saudação.
→ Grid com os 4 cards de insights.
→ Ações de refresh nos dois primeiros cards.
→ Exibição de timestamp abaixo dos cards atualizáveis.

### queries/ia/useIAQueries.js (EXISTENTE — MODIFICAR)

NOVO a adicionar:
→ useGetInsightsQuery(fazendaId)
→ useRefreshInsightMutation()

### services/ia/ia.service.js (EXISTENTE — MODIFICAR)

NOVO a adicionar:
→ buscarInsights(fazendaId) -> GET /api/ia/insights
→ atualizarInsight(payload) -> POST /api/ia/insights/refresh

### components/insights/InsightGreetingCard.jsx (NOVO — CRIAR)

Criar em: src/components/insights/InsightGreetingCard.jsx
→ Card principal de saudação ao usuário logado.

### components/insights/InsightCard.jsx (NOVO — CRIAR)

Criar em: src/components/insights/InsightCard.jsx
→ Card genérico de insight com título, conteúdo, refresh opcional e timestamp.

### Endpoints consumidos

- GET /api/ia/insights?fazendaId={uuid|todas}
- POST /api/ia/insights/refresh

---
