# [EPIC] Refinamento da Tela de Simulação

Tipo:        Epic
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Frontend, Backend, Simulação Financeira, UX
Relator:     (preencher)
Pai:         —
Data Limite: (preencher)

## 📌 Status Auditado no Codigo (25/04/2026)

- Base de cotacao (`model cotacoes`) existe no Prisma. (CONCLUIDO)
- O modulo backend esta apenas montado no roteamento principal; `simulacao.controller.js` esta vazio e `simulacao.routes.js` segue sem endpoints reais. (PENDENTE)
- A superficie frontend de simulacao segue vazia e ainda nao esta ligada em `App.jsx`. (PENDENTE)

## 📝 Descrição

Como administrador do AgroFarm,
eu quero realizar simulacoes para abatimento da divida atual (de uma fazenda ou de varias),
para avaliar cenarios de venda por cultura usando cotacao em tempo real e acompanhar historico de resultados.

Este epic padroniza a Tela de Simulacao com foco em consistencia de regra financeira, integracao com cotacao e relacao direta com os dados de gastos/lucros do dashboard.

---

## 🎯 Escopo Funcional

- Exibir area de cotacao USD/BRL em tempo real com campos digitaveis.
- Exibir formulario de simulacao com campos:
  - Cultura
  - Quantidade de Sacas
  - Valor da Saca
- Executar simulacao com base na cotacao corrente (ou valor informado pelo usuario quando aplicavel).
- Exibir card de resultados com historico de simulacoes realizadas na sessao (ou persistidas, conforme regra final).
- Exibir card "Total gasto" com composicao:
  - Valor pago
  - Valor pendente
- Permitir simulacao por fazenda especifica ou consolidada de varias fazendas (quando contexto selecionado for "Todas as Fazendas").

---

## ✅ Critérios de Aceite

### Cenário 1 — Carregamento da tela
**Dado** que o usuario ADMIN acessa a tela de simulacao
**Quando** a tela carrega
**Então** sao exibidos os blocos Cotacao, Simulacao, Resultados e Total Gasto.

### Cenário 2 — Cotação em tempo real
**Dado** que a tela esta aberta
**Quando** a cotacao e carregada
**Então** o valor USD/BRL e exibido com atualizacao em tempo real (com cache backend).

### Cenário 3 — Campos digitáveis de câmbio
**Dado** que o usuario quer testar um cenario alternativo
**Quando** edita os campos USD e BRL
**Então** a simulacao utiliza os valores digitados como base de calculo.

### Cenário 4 — Execução da simulação
**Dado** que cultura, quantidade de sacas e valor da saca foram informados
**Quando** o usuario clica em "Simular"
**Então** o sistema calcula o valor estimado de abatimento e exibe no card de resultados.

### Cenário 5 — Simulação por escopo de fazenda
**Dado** que o usuario esta com uma fazenda selecionada
**Quando** executa simulacao
**Então** os dados de divida base e contexto refletem a fazenda selecionada.

**Dado** que o usuario esta em "Todas as Fazendas"
**Quando** executa simulacao
**Então** os dados sao consolidados para o escopo global.

### Cenário 6 — Card de Total Gasto
**Dado** que existem gastos cadastrados
**Quando** a tela carrega
**Então** exibe total gasto com composicao pago e pendente.

### Cenário 7 — Persistência/Histórico de resultados
**Dado** que uma simulacao foi executada
**Quando** finaliza o calculo
**Então** o resultado fica disponivel no card de resultados para consulta imediata.

---

## 🛠️ Implementação (Alto Nível)

### Frontend

- Criar/ajustar pagina `Simulacao`.
- Criar/ajustar hooks em `useSimulacaoQueries`.
- Integrar componente de cotacao com inputs USD/BRL.
- Integrar formulario de simulacao e card de resultados.
- Integrar card de total gasto (pago x pendente).
- Consumir contexto global de fazenda selecionada (incluindo "Todas as Fazendas").

### Backend

- Criar/ajustar endpoint de simulacao:
  - GET `/api/simulacao/dividas`
  - POST `/api/simulacao/calcular-sacas`
- Reaproveitar endpoint de cotacao:
  - GET `/api/cotacao/dolar`
- Implementar regras de calculo para abatimento com base em:
  - quantidade de sacas
  - valor da saca
  - cotacao
  - divida atual (pago x pendente)
- Suportar escopo por fazenda especifica ou consolidado.

---

## 🔗 Dependências

- Depende de Dashboard para consistencia de totais financeiros.
- Depende de Gastos para composicao de divida (pago/pendente).
- Depende de Cotacao (cache + API externa).
- Deve respeitar escopo de fazenda selecionada global no header.

---

## 🚫 Regras de Negócio

- Apenas ADMIN acessa a tela de simulacao (salvo decisao contraria explicita).
- Calculo de simulacao deve ser deterministico para os mesmos parametros.
- Valores monetarios exibidos em formato BRL.
- Quando escopo for "Todas as Fazendas", consolidar dados antes do calculo.
- Cotacao em cache deve ter validade definida para evitar excesso de chamadas externas.

---

## 📌 Observações

- A tela de Simulacao e complementar ao Dashboard e deve manter padrao visual e semantico dos cards financeiros.
- Registrar claramente no contrato de API quais campos sao entrada manual e quais sao valores de sistema.
- Garantir tratamento de estado vazio e loading por bloco para boa UX.

---

# [STORY DATABASE] Refinamento Tela de Simulação — Banco de Dados

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Banco de Dados
Relator:     (preencher)
Pai:         [EPIC] Refinamento da Tela de Simulação
Data Limite: (preencher)

Como sistema, eu quero suportar consulta rapida de divida (pago x pendente) e cotacao em cache para simulacoes, para garantir resposta rapida e previsivel no calculo.

SQL a executar:

-- **1. Otimizar consulta de gastos por status (ALTERAR TABELA EXISTENTE)**
CREATE INDEX IF NOT EXISTS idx_gastos_status_data
ON gastos (status, data);

CREATE INDEX IF NOT EXISTS idx_gastos_colheita_status
ON gastos (colheita_id, status);

-- **2. Otimizar leitura da cotacao mais recente (ALTERAR TABELA EXISTENTE)**
CREATE INDEX IF NOT EXISTS idx_cotacoes_atualizado_em
ON cotacoes (atualizado_em DESC);

Após executar o SQL:

- Executar no backend:
  - npx prisma db pull
  - npm run db:generate

**Critérios de Aceite:**

→ Consulta de divida pago/pendente responde com desempenho adequado por escopo.
→ Consulta de cotacao mais recente usa indice temporal.

---

# [STORY BACKEND] Refinamento Tela de Simulação — Backend

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Backend
Relator:     (preencher)
Pai:         [EPIC] Refinamento da Tela de Simulação
Data Limite: (preencher)

## 📝 Descrição
Como sistema, eu quero expor endpoints de simulacao para calcular abatimento de divida por cultura e escopo de fazenda, com apoio da cotacao em cache, para atender a tela de simulacao.

---

## ✅ Critérios de Aceite

### Cenário 1 — Buscar dividas por escopo
**Dado** fazendaId especifico ou `todas`, **Quando** GET /api/simulacao/dividas e chamado, **Então** retorna totais pago, pendente e total gasto do escopo.

### Cenário 2 — Calcular simulacao
**Dado** payload valido com cultura, quantidade e valor, **Quando** POST /api/simulacao/calcular-sacas e chamado, **Então** retorna resultado de abatimento e impacto na divida.

### Cenário 3 — Cotacao de apoio
**Dado** necessidade de cotacao, **Quando** simulacao e executada, **Então** usa cotacao em cache e consulta API externa somente se vencido.

### Cenário 4 — Escopo consolidado
**Dado** `fazendaId=todas`, **Quando** simulacao/dividas sao calculadas, **Então** os valores sao consolidados em todas as fazendas permitidas.

### Cenário 5 — Sem dados
**Dado** ausencia de gastos/lucros para escopo, **Quando** endpoints sao chamados, **Então** retornam valores zerados sem erro 5xx.

---

## 🛠️ Implementação

### simulacao.controller.js (EXISTENTE — MODIFICAR)

Métodos existentes (não alterar):
→ Arquivo existente sem implementação.

Métodos NOVOS a adicionar:
* buscarDividas() -> GET /api/simulacao/dividas
* calcularSacas() -> POST /api/simulacao/calcular-sacas

### simulacao.service.js (EXISTENTE — MODIFICAR)

Lógica existente (não alterar):
→ Arquivo existente sem implementação.

Lógica NOVA a adicionar:
→ Buscar totais de gasto pago/pendente por escopo.
→ Calcular impacto da simulacao com base em quantidade, valor e cotacao.
→ Consolidar escopo por fazendaId especifico ou `todas`.
→ Validar entradas e limites.

### simulacao.repository.js (NOVO — CRIAR)

Criar em: src/repositories/simulacao.repository.js
Seguir padrão de: src/repositories/fazenda.repository.js
→ totalPorStatus(fazendaId?)
→ totaisConsolidados(fazendaId?)

### simulacao.routes.js (EXISTENTE — MODIFICAR)

Rotas existentes (não alterar):
→ Arquivo existente sem implementação.

Rotas NOVAS a adicionar:
* GET /api/simulacao/dividas
* POST /api/simulacao/calcular-sacas

### cotacao.service.js (EXISTENTE — MODIFICAR)

Lógica NOVA a reutilizar:
→ buscarDolar() com cache e fallback para API externa.

### routes/index.js (EXISTENTE — MODIFICAR)

Rotas NOVAS a adicionar:
* /api/simulacao

---

## 📐 Schemas (Zod)

### simulacao.schema.js (EXISTENTE — MODIFICAR)

Schemas existentes (não alterar):
→ Arquivo existente sem implementação.

Schemas NOVOS a adicionar:
→ simulacaoDividasQuerySchema:
  - fazendaId: string uuid ou literal `todas`

→ calcularSacasSchema:
  - culturaId ou cultura: string obrigatorio
  - quantidadeSacas: number positivo
  - valorSaca: number positivo
  - usd: number opcional
  - brl: number opcional
  - fazendaId: string uuid ou `todas`

---

## 🛣️ Rotas

* GET /api/simulacao/dividas
* POST /api/simulacao/calcular-sacas
* GET /api/cotacao/dolar

---

# [STORY FRONTEND] Refinamento Tela de Simulação — Frontend

Tipo:        Story
Prioridade:  🔼 High
Sprint:      (preencher)
Categoria:   Frontend
Relator:     (preencher)
Pai:         [EPIC] Refinamento da Tela de Simulação
Data Limite: (preencher)

## 📝 Descrição
Como administrador, eu quero configurar parametros de simulacao e visualizar resultados imediatamente, para decidir estrategias de abatimento da divida atual.

---

## ✅ Critérios de Aceite

### Cenário 1 — Render da tela
**Dado** usuario ADMIN autenticado, **Quando** abre /simulacao, **Então** os blocos Cotacao, Simulacao, Resultados e Total Gasto sao exibidos.

### Cenário 2 — Inputs de cotacao
**Dado** campos USD/BRL editaveis, **Quando** usuario altera valores, **Então** os calculos subsequentes usam os valores digitados.

### Cenário 3 — Simular
**Dado** formulario preenchido, **Quando** clica em "Simular", **Então** resultado e exibido no card de resultados.

### Cenário 4 — Total gasto
**Dado** dados de divida carregados, **Quando** tela renderiza, **Então** card mostra total, pago e pendente.

### Cenário 5 — Escopo de fazenda
**Dado** fazenda selecionada no contexto global, **Quando** simulacao/divida carregam, **Então** obedecem escopo selecionado (fazenda especifica ou `Todas as Fazendas`).

---

## 🛠️ Implementação

### pages/Simulacao/Simulacao.jsx (EXISTENTE — MODIFICAR)

Existente (não alterar):
→ Arquivo existente sem implementação.

NOVO a adicionar:
→ Layout conforme layout.
→ Inputs de cotacao USD/BRL editaveis.
→ Formulario de simulacao (cultura, quantidade, valor da saca).
→ Card de resultados com historico curto da sessao.
→ Card total gasto (pago/pendente).

### queries/simulacao/useSimulacaoQueries.js (EXISTENTE — MODIFICAR)

Existente (não alterar):
→ Arquivo existente sem implementação.

NOVO a adicionar:
→ useGetDividasSimulacao(fazendaId)
→ useCalcularSacasMutation()
→ useGetCotacaoDolar()

### services/simulacao/simulacao.service.js (EXISTENTE — MODIFICAR)

Existente (não alterar):
→ Arquivo existente sem implementação.

NOVO a adicionar:
→ buscarDividas(fazendaId)          → GET /api/simulacao/dividas
→ calcularSacas(payload)            → POST /api/simulacao/calcular-sacas
→ buscarCotacaoDolar()              → GET /api/cotacao/dolar

### Endpoints consumidos

* GET /api/simulacao/dividas
* POST /api/simulacao/calcular-sacas
* GET /api/cotacao/dolar
