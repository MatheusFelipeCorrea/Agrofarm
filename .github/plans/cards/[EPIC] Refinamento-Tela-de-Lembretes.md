# [EPIC] Refinamento da Tela de Lembretes

Tipo:        Epic
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Frontend, Backend, Banco de Dados, UX, Integração Externa
Relator:     (preencher)
Pai:         —
Data Limite: (preencher)

## 📌 Status Auditado no Codigo (25/04/2026)

- Estrutura de dados de lembretes existe no Prisma com `status_lembrete`, `enviado_em`, `erro_envio` e indices de consulta. (CONCLUIDO)
- Backend de lembretes (controller + service + repository + job + rotas) esta implementado e ativo no `api/src/routes/index.js`. (CONCLUIDO)
- A superficie frontend segue pendente: `Lembretes.jsx`/`index.js` estao vazios e a rota nao esta ligada no `App.jsx` atual. (PENDENTE)

Este epic entrega o refinamento completo da tela Lembretes conforme layout aprovado, incluindo filtros por perfil, calendario interativo com marcacao por status, cards de lembretes com acoes, modais de criar/editar/excluir e integracao com Gastos e Evolution API (WhatsApp).

Escopo funcional consolidado:
- Tela "Lembretes" com filtros:
  - ADMIN: Fazenda + Status
  - FUNCIONARIO: Status apenas
- No filtro de Fazenda do ADMIN, incluir opcao "Todas Fazendas" para consulta consolidada.
- Botao de filtro com estado dinamico padrao:
  - Inicial: "Filtrar"
  - Apos aplicacao: "Limpar Filtros"
  - Alterou qualquer filtro depois de aplicar: volta para "Filtrar"
- Calendario grande com navegacao de dias/meses e interacao por clique no dia (estilo agenda).
- Marcacao de dias no calendario com bolinhas por status:
  - Vermelho: atrasado
  - Amarelo: pendente
  - Verde: concluido/pago
- Lista de cards de lembretes do dia selecionado.
- Acoes por card:
  - checkbox para marcar concluido/visto
  - editar
  - excluir
- Botao "Novo Lembrete".
- Modal "Criar Lembrete" e "Editar Lembrete" com campos:
  - nome (obrigatorio)
  - fazenda (opcional)
  - descricao (opcional)
  - data
  - hora
  - telefone
- Confirmacao de exclusao padronizada entre telas.
- Integracao com Gastos:
  - vencimentos de gastos futuros devem aparecer no calendario/lista de lembretes como eventos derivados.
- Integracao com Evolution API:
  - envio de alerta de WhatsApp para telefone informado no lembrete.

Base visual e de interacao:
- Seguir layout fornecido para layout da tela, calendario, cards e modais.

---

# [STORY DATABASE] Refinamento Tela de Lembretes — Banco de Dados

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Banco de Dados
Relator:     (preencher)
Pai:         [EPIC] Refinamento da Tela de Lembretes
Data Limite: (preencher)

Como sistema, eu quero suportar consultas eficientes de lembretes por dia/status/fazenda e manter rastreabilidade de integração com alertas, para que o calendario carregue rapido e os lembretes sejam confiáveis.

SQL a executar:

-- **1. Garantir suporte a vinculo N:N usuario x fazenda (CRIAR TABELA, caso ainda nao exista)**
CREATE TABLE IF NOT EXISTS usuarios_fazendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  fazenda_id UUID NOT NULL REFERENCES fazendas(id) ON DELETE CASCADE ON UPDATE CASCADE,
  criado_em TIMESTAMP(6) NOT NULL DEFAULT now(),
  CONSTRAINT usuarios_fazendas_unique UNIQUE (usuario_id, fazenda_id)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_fazendas_usuario_id
ON usuarios_fazendas (usuario_id);

CREATE INDEX IF NOT EXISTS idx_usuarios_fazendas_fazenda_id
ON usuarios_fazendas (fazenda_id);

-- **2. Otimizar consultas de lembretes por data/status/fazenda (ALTERAR TABELA EXISTENTE)**
CREATE INDEX IF NOT EXISTS idx_lembretes_data_lembrete
ON lembretes (data_lembrete);

CREATE INDEX IF NOT EXISTS idx_lembretes_status
ON lembretes (status);

CREATE INDEX IF NOT EXISTS idx_lembretes_fazenda_data
ON lembretes (fazenda_id, data_lembrete);

CREATE INDEX IF NOT EXISTS idx_lembretes_usuario_data
ON lembretes (usuario_id, data_lembrete);

-- **3. Suporte operacional a envio de notificacao (ALTERAR TABELA EXISTENTE, se necessario)**
ALTER TABLE lembretes
ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMP(6) NULL;

ALTER TABLE lembretes
ADD COLUMN IF NOT EXISTS erro_envio TEXT NULL;

Após executar o SQL:

- Executar no backend:
  - npx prisma db pull
  - npm run db:generate
- Atualizar mapeamento Prisma:
  - model usuarios_fazendas
  - relacoes N:N entre usuarios e fazendas
  - model lembretes com campos enviados_em e erro_envio (se adotados)

**OBS ATUALIZAR NO DIAGRAMA**

- usuarios_fazendas (usuario_id, fazenda_id)
- Indices de lembretes por data/status/fazenda/usuario
- Campos de rastreio de envio (enviado_em, erro_envio)

**Critérios de Aceite:**

→ Banco suporta escopo de usuario por uma ou mais fazendas.
→ Consultas do calendario por periodo/dia/status/fazenda usam indices adequados.
→ Estrutura de lembrete suporta rastrear envio para WhatsApp.
→ Prisma atualizado de forma consistente com o banco.

---

# [STORY BACKEND] Refinamento Tela de Lembretes — Backend

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Backend
Relator:     (preencher)
Pai:         [EPIC] Refinamento da Tela de Lembretes
Data Limite: (preencher)

## 📝 Descrição
Como sistema, eu quero expor endpoints de lembretes com filtros por perfil e por dia, suportar eventos derivados de gastos e integrar com Evolution API, para alimentar a tela de calendario com dados reais e acao de notificacao.

---

## ✅ Critérios de Aceite

### Cenário 1 — Listar lembretes com filtros (ADMIN)
**Dado** que o usuario autenticado e ADMIN, **Quando** GET /api/lembretes?fazendaId={id|all}&status={status}&data={YYYY-MM-DD} e chamado, **Então** retorna 200 com lembretes filtrados.
* **Se** `fazendaId=all`: retorna dados de todas as fazendas.

### Cenário 2 — Listar lembretes com filtros (FUNCIONARIO)
**Dado** que o usuario autenticado e FUNCIONARIO, **Quando** GET /api/lembretes e chamado, **Então** o backend restringe resultado ao conjunto de fazendas vinculadas ao usuario (e lembretes sem fazenda do proprio usuario, quando aplicavel).
* **Se** funcionario nao tiver fazendas vinculadas e nao houver lembretes pessoais: retorna vazio.

### Cenário 3 — Calendario por dia
**Dado** que um dia foi selecionado no calendario, **Quando** GET /api/lembretes/dia?data=YYYY-MM-DD&filtros e chamado, **Então** retorna os cards do dia selecionado.

### Cenário 4 — Marcadores do calendario
**Dado** que o mes foi carregado, **Quando** GET /api/lembretes/calendario?mes=MM&ano=YYYY&filtros e chamado, **Então** retorna agregados por dia para montar bolinhas de status.

### Cenário 5 — Integracao com gastos
**Dado** que existem gastos com vencimento futuro/pendente, **Quando** a consulta de calendario e chamada, **Então** os eventos derivados de gasto aparecem junto dos lembretes no retorno.

### Cenário 6 — Criar lembrete
**Dado** payload valido, **Quando** POST /api/lembretes e chamado, **Então** cria lembrete com 201.
* **Se** fazenda informada for fora do escopo do usuario: retorna 403.

### Cenário 7 — Editar lembrete
**Dado** lembrete existente, **Quando** PUT /api/lembretes/:id e chamado, **Então** atualiza com 200.

### Cenário 8 — Marcar concluido/visto
**Dado** lembrete existente, **Quando** PATCH /api/lembretes/:id/status e chamado, **Então** altera status e retorna 200.

### Cenário 9 — Excluir lembrete
**Dado** lembrete existente, **Quando** DELETE /api/lembretes/:id e chamado, **Então** remove com 204.

### Cenário 10 — Envio WhatsApp (Evolution)
**Dado** lembrete com telefone valido e janela de envio ativa, **Quando** job/acao de envio ocorrer, **Então** o backend chama Evolution API e registra sucesso/erro.

---

## 🛠️ Implementação

### lembrete.controller.js (EXISTENTE — MODIFICAR)

Métodos existentes (não alterar):
* Arquivo existente sem metodos implementados.

Métodos NOVOS a adicionar:
* getAll() -> GET /api/lembretes
* getDia() -> GET /api/lembretes/dia
* getCalendario() -> GET /api/lembretes/calendario
* create() -> POST /api/lembretes
* update() -> PUT /api/lembretes/:id
* updateStatus() -> PATCH /api/lembretes/:id/status
* delete() -> DELETE /api/lembretes/:id

### lembrete.service.js (EXISTENTE — MODIFICAR)

Lógica existente (não alterar):
→ Arquivo existente sem regras implementadas.

Lógica NOVA a adicionar:
→ Aplicar escopo por perfil (ADMIN com `all`; FUNCIONARIO restrito as fazendas vinculadas e itens pessoais).
→ Validar campos obrigatorios (nome, dataHora, telefone quando exigido pela regra de envio).
→ Permitir fazenda opcional para lembretes gerais.
→ Mesclar no retorno lembretes manuais + eventos derivados de gastos (somente leitura para derivados, se definido).
→ Atualizar status (PENDENTE/ENVIADO/CANCELADO ou equivalente de concluido/visto no card).
→ Integrar envio com Evolution API por job/acao.

### lembrete.repository.js (EXISTENTE — MODIFICAR)

Métodos existentes (não alterar):
→ Arquivo existente sem metodos implementados.

Métodos NOVOS a adicionar:
→ buscarTodosComFiltros({ fazendaId, status, data, mes, ano, role, usuarioId, fazendaIdsPermitidas })
→ buscarPorDia({ data, fazendaId, status, role, usuarioId, fazendaIdsPermitidas })
→ buscarMarcadoresCalendario({ mes, ano, fazendaId, status, role, usuarioId, fazendaIdsPermitidas })
→ buscarEventosDerivadosDeGasto({ periodo, filtros, role, usuarioId, fazendaIdsPermitidas })
→ buscarPorId(id)
→ create(dados)
→ update(id, dados)
→ updateStatus(id, status)
→ delete(id)

### lembrete.view.js (EXISTENTE — MODIFICAR)

Métodos existentes (não alterar):
→ Arquivo existente sem metodos implementados.

Métodos NOVOS a adicionar:
→ render(lembrete)
→ renderMany(lembretes)
→ renderCalendario(marcadores)
→ renderEventoDerivadoGasto(evento)

### jobs/lembretes.job.js (EXISTENTE — MODIFICAR)

Lógica NOVA a adicionar:
→ buscar lembretes elegiveis para envio
→ chamar Evolution API
→ atualizar status/log de envio

### serviços de integração (EXISTENTE — MODIFICAR)

Arquivos de referência:
- src/services/whatsapp.service.js (se consolidar)
- src/shared/adapters/evolution* (se criar)

Ajuste:
→ padronizar cliente para Evolution API e reaproveitar no job de lembretes.

---

## 📐 Schemas (Zod)

### lembrete.schema.js (EXISTENTE — MODIFICAR)

Schemas existentes (não alterar):
→ Arquivo existente sem schemas implementados.

Schemas NOVOS a adicionar:
→ createLembreteSchema:
  - titulo/nome: string obrigatorio
  - descricao: string opcional
  - fazendaId: string uuid opcional
  - data: date/string date obrigatorio
  - hora: string HH:mm obrigatorio
  - telefoneWhatsapp: string opcional/condicional
  - status: enum(PENDENTE, ENVIADO, CANCELADO) default PENDENTE

→ updateLembreteSchema:
  - campos de createLembreteSchema como partial

→ updateLembreteStatusSchema:
  - status: enum(PENDENTE, ENVIADO, CANCELADO)

→ lembreteFiltroSchema:
  - fazendaId: string uuid ou literal `all` opcional
  - status: enum(PENDENTE, ENVIADO, CANCELADO, ATRASADO, CONCLUIDO) opcional para camada de exibicao
  - data: date opcional
  - mes: number inteiro 1..12 opcional
  - ano: number inteiro >= 2000 opcional

### auth.schema.js / usuario.schema.js (EXISTENTE — MODIFICAR)

Reuso do fix:
→ manter fazendaIds para escopo de usuario FUNCIONARIO.

---

## 🛣️ Rotas

### lembrete.routes.js (EXISTENTE — MODIFICAR)

Rotas existentes (não alterar):
* Arquivo existente sem rotas implementadas.

Rotas NOVAS a adicionar:
* GET /api/lembretes
* GET /api/lembretes/dia
* GET /api/lembretes/calendario
* POST /api/lembretes
* PUT /api/lembretes/:id
* PATCH /api/lembretes/:id/status
* DELETE /api/lembretes/:id

### index.js (EXISTENTE — MODIFICAR)

Rotas existentes (não alterar):
* /api/auth
* /api/usuarios

Rotas NOVAS a adicionar:
* /api/lembretes

---

## 🚫 Regras de Negócio
* Filtro Fazenda so aparece para ADMIN e inclui "Todas Fazendas".
* FUNCIONARIO sempre opera dentro de suas fazendas vinculadas, salvo lembretes pessoais sem fazenda (quando permitido).
* Campo fazenda no lembrete e opcional.
* Lembretes derivados de gastos devem refletir vencimentos de gastos no calendario.
* Status visual de bolinha/card:
  - vermelho = atrasado
  - amarelo = pendente
  - verde = concluido/pago
* Atrasado e estado derivado de data/hora atual x data/hora do lembrete e status nao concluido.
* Marcacao de concluido/visto deve refletir imediatamente no card e no calendario.
* Excluir segue confirmacao padronizada das demais telas.

---

# [STORY FRONTEND] Refinamento Tela de Lembretes — Frontend

Tipo:        Story
Prioridade:  🔼 High
Sprint:      (preencher)
Categoria:   Frontend
Relator:     (preencher)
Pai:         [EPIC] Refinamento da Tela de Lembretes
Data Limite: (preencher)

## 📝 Descrição
Como usuario (ADMIN ou FUNCIONARIO), eu quero visualizar e gerenciar lembretes em um calendario interativo por dia, com cards acionaveis, para organizar compromissos e vencimentos com alertas via WhatsApp.

---

## ✅ Critérios de Aceite

### Cenário 1 — Renderizacao inicial da tela
**Dado** que estou autenticado, **Quando** acesso /lembretes, **Então** visualizo filtros por perfil, botao "Filtrar", botao "Novo Lembrete", calendario e cards de lembrete.

### Cenário 2 — Filtros por perfil
**Dado** que sou ADMIN, **Quando** acesso a tela, **Então** vejo filtros Fazenda e Status.
* O filtro Fazenda deve conter "Todas Fazendas".

**Dado** que sou FUNCIONARIO, **Quando** acesso a tela, **Então** vejo apenas filtro de Status.

### Cenário 3 — Comportamento do botao Filtrar/Limpar Filtros
**Dado** que preenchi filtros e cliquei em "Filtrar", **Quando** filtros sao aplicados, **Então** o botao muda para "Limpar Filtros".

**Dado** que filtros ja aplicados, **Quando** altero qualquer filtro, **Então** o botao volta para "Filtrar".

### Cenário 4 — Calendario interativo
**Dado** que a tela carregou, **Quando** clico em um dia do calendario, **Então** os cards daquele dia sao exibidos.

### Cenário 5 — Marcadores no calendario
**Dado** que existem lembretes no mes, **Quando** o calendario renderiza, **Então** os dias com eventos mostram bolinhas de status (vermelho/amarelo/verde).

### Cenário 6 — Card de lembrete com acoes
**Dado** que existe card na lista, **Quando** interajo com checkbox, lapis ou lixeira, **Então** consigo marcar concluido/visto, editar ou excluir.

### Cenário 7 — Criar lembrete
**Dado** que clico em "Novo Lembrete", **Quando** modal abre, **Então** vejo campos: nome, fazenda opcional, descricao opcional, data, hora e telefone.

### Cenário 8 — Editar lembrete
**Dado** que clico em editar em um card, **Quando** modal abre, **Então** campos vem pre-preenchidos.

### Cenário 9 — Integracao com gastos
**Dado** que existem gastos com vencimento, **Quando** vejo calendario/cards, **Então** esses eventos aparecem integrados aos lembretes.

### Cenário 10 — Exclusao padronizada
**Dado** que clico em excluir, **Quando** o modal de confirmacao abre, **Então** segue o mesmo padrao visual/contextual das outras telas.

---

## 🎨 Visual e UX

Referencia obrigatoria: seguir o layout enviado para:
- Tela principal de lembretes (filtros + calendario + cards)
- Modal Criar Lembrete
- Modal Editar Lembrete
- Modal Excluir Lembrete

### Calendario e Cards
* **Calendario:** grande, navegavel por mes/dia, com destaque no dia selecionado.
* **Marcadores:** bolinhas por status (vermelho/amarelo/verde).
* **Cards:** titulo, data, descricao/telefone e acoes (checkbox, editar, excluir).
* **Responsividade:** manter usabilidade do calendario e cards em layouts menores.

---

## ⚙️ Integração Técnica

### Hooks (TanStack Query)

#### useLembreteQueries.js (EXISTENTE — MODIFICAR)

Hooks existentes (não alterar):
→ Arquivo existente sem hooks implementados.

Hooks NOVOS a adicionar:
→ useLembreteListQuery(filters)
→ useLembreteDiaQuery({ data, filters })
→ useLembreteCalendarioQuery({ mes, ano, filters })
→ useCreateLembreteMutation()
→ useUpdateLembreteMutation()
→ useUpdateLembreteStatusMutation()
→ useDeleteLembreteMutation()

### Componentes

#### pages/Lembretes/Lembretes.jsx (EXISTENTE — MODIFICAR)

Existente (não alterar):
→ Arquivo existente sem implementacao.

NOVO a adicionar:
→ Tela com filtros por perfil e estado do botao Filtrar/Limpar Filtros.
→ Calendario com selecao de dia e marcadores por status.
→ Lista de cards do dia selecionado.
→ Integracao de eventos derivados de gastos.
→ Controle dos modais de criar, editar e excluir.

#### components/lembretes/LembreteCalendar.jsx (NOVO — CRIAR)

Criar em: src/components/lembretes/LembreteCalendar.jsx
Seguir padrão de: src/pages/Gastos/Gastos.jsx (componentizacao da tela por blocos)
→ Calendario mensal com clique no dia e marcadores coloridos.

#### components/lembretes/LembreteCardList.jsx (NOVO — CRIAR)

Criar em: src/components/lembretes/LembreteCardList.jsx
Seguir padrão de: componentes de lista/tabela existentes
→ Render dos cards e acoes por item.

#### components/lembretes/LembreteFormModal.jsx (NOVO — CRIAR)

Criar em: src/components/lembretes/LembreteFormModal.jsx
Seguir padrão de: modais de Gastos/Lucros/Colheitas
→ Modal reutilizavel para criar/editar lembrete.

#### components/lembretes/DeleteLembreteModal.jsx (NOVO — CRIAR)

Criar em: src/components/lembretes/DeleteLembreteModal.jsx
Seguir padrão de: modais de exclusao das demais telas
→ Confirmacao padronizada.

### Services

#### lembrete.service.js (EXISTENTE — MODIFICAR)

Métodos existentes (não alterar):
→ Arquivo existente sem metodos implementados.

Métodos NOVOS a adicionar:
→ buscarTodos(filtros)                 → GET /api/lembretes
→ buscarPorDia(data, filtros)          → GET /api/lembretes/dia
→ buscarCalendario(mes, ano, filtros)  → GET /api/lembretes/calendario
→ criar(dados)                         → POST /api/lembretes
→ atualizar(id, dados)                 → PUT /api/lembretes/:id
→ atualizarStatus(id, status)          → PATCH /api/lembretes/:id/status
→ deletar(id)                          → DELETE /api/lembretes/:id

### Endpoints consumidos
- GET /api/lembretes
- GET /api/lembretes/dia
- GET /api/lembretes/calendario
- POST /api/lembretes
- PUT /api/lembretes/:id
- PATCH /api/lembretes/:id/status
- DELETE /api/lembretes/:id
- GET /api/fazendas (para filtro ADMIN e select opcional de fazenda)
- GET /api/gastos (ou endpoint dedicado de eventos derivados, conforme contrato)

---

## 🚫 Regras de Negócio
* Filtro Fazenda nao deve ser renderizado para FUNCIONARIO.
* Filtro Fazenda do ADMIN deve incluir "Todas Fazendas".
* Se o FUNCIONARIO tiver mais de uma fazenda vinculada, o escopo deve ser limitado ao conjunto permitido.
* Campo fazenda e opcional no lembrete.
* O card deve permitir marcar concluido/visto diretamente via checkbox.
* Cores de status devem seguir padrao do layout.
* Integracao com Gastos deve trazer lembretes de vencimento para o calendario.
* Integracao com Evolution API deve enviar alerta para telefone do lembrete quando aplicavel.

---

## 🛠️ Refinamento
* **Estado de filtro:** usar `draftFilters` e `appliedFilters` para reproduzir o comportamento do CTA.
* **Calendario:** separar dados de marcador mensal e lista do dia para performance.
* **Escopo por perfil:** usar contexto do usuario + fazendas vinculadas para limitar retorno/acoes do FUNCIONARIO.
* **Integração externa:** isolar cliente Evolution em adapter/servico para facilitar retry e fallback.

---
