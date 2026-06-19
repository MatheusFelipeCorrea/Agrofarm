# [EPIC] Refinamento da Tela de Colheitas

Tipo:        Epic
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Frontend, Backend, Banco de Dados, UX
Relator:     (preencher)
Pai:         —
Data Limite: (preencher)

## 📌 Status Auditado no Codigo (25/04/2026)

- Estrutura de dados base de colheitas e relacoes no Prisma existe (`colheitas` + FKs para `fazendas` e `culturas`), incluindo indices de filtro. (CONCLUIDO)
- A rota frontend `/colheitas` esta ligada a `Colheitas.jsx` e existe como placeholder navegavel no app atual. (CONCLUIDO)
- Nao ha controller/rotas de colheitas ativos no backend atual nem CRUD real do modulo. (PENDENTE)
- A tela funcional completa ainda esta pendente; o componente atual apenas sinaliza que o modulo esta em construcao. (PENDENTE)

Este epic entrega o refinamento completo da tela Minhas Colheitas conforme layout aprovado, cobrindo filtros por perfil, tabela de listagem, modais de criacao/edicao/exclusao e regras de permissao para ADMIN e FUNCIONARIO.

Escopo funcional consolidado:
- Tela "Minhas Colheitas" com filtros de Fazenda, Cultura e Mes/Ano para ADMIN.
- No filtro de Fazenda do ADMIN, deve existir a opcao "Todas Fazendas" para consulta consolidada.
- Para FUNCIONARIO, filtro de Fazenda nao e exibido.
- Botao de filtro com estado dinamico:
  - Inicial: "Filtrar".
  - Apos aplicacao: "Limpar Filtros".
  - Se o usuario alterar qualquer filtro depois de aplicar, o botao volta para "Filtrar".
- Botao "Nova Colheita".
- Tabela com colunas: Fazenda, Cultura, Sacas, Data e Acoes.
- Acoes por linha: editar e excluir.
- Modal "Criar Colheita" ao clicar em "Nova Colheita".
- Modal "Editar Colheita" ao clicar em editar.
- Modal de exclusao com mensagem no formato: "Deseja excluir a colheita de Cafe do dia 23/06/2025?"
- Regra obrigatoria de perfil:
  - se o FUNCIONARIO tiver 1 fazenda vinculada, o modal pode abrir com fazenda predefinida e bloqueada;
  - se o FUNCIONARIO tiver mais de 1 fazenda vinculada, ele pode selecionar apenas entre as fazendas do seu vinculo;
  - ADMIN pode selecionar qualquer fazenda e filtrar por "Todas Fazendas".

Base visual e de interacao:
- Seguir layout fornecido para listagem e tres modais (criar, editar, excluir).

---

# [STORY DATABASE] Refinamento Tela de Colheitas — Banco de Dados

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Banco de Dados
Relator:     (preencher)
Pai:         [EPIC] Refinamento da Tela de Colheitas
Data Limite: (preencher)

Como sistema, eu quero garantir suporte a filtros performaticos de colheita por fazenda, cultura e periodo, alem do vinculo de funcionario com uma ou mais fazendas, para que a tela respeite regra de perfil e responda bem em listas maiores.

SQL a executar:

-- **1. Garantir vinculo N:N usuario x fazenda (CRIAR TABELA, caso ainda nao exista)**
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

-- **2. Otimizar filtros de colheita por periodo/fazenda/cultura (ALTERAR TABELA EXISTENTE)**
CREATE INDEX IF NOT EXISTS idx_colheitas_data_colheita
ON colheitas (data_colheita);

CREATE INDEX IF NOT EXISTS idx_colheitas_fazenda_cultura_data
ON colheitas (fazenda_id, cultura_id, data_colheita);

Após executar o SQL:

- Executar no backend:
  - npx prisma db pull
  - npm run db:generate
- Atualizar mapeamento Prisma:
  - model usuarios_fazendas
  - model usuarios com usuarios_fazendas[]
  - model fazendas com usuarios_fazendas[]

**OBS ATUALIZAR NO DIAGRAMA**

- usuarios_fazendas.usuario_id / usuarios_fazendas.fazenda_id
- Indices em colheitas(data_colheita) e colheitas(fazenda_id, cultura_id, data_colheita)

**Critérios de Aceite:**

→ Tabela usuarios_fazendas existe com relacao N:N valida entre usuarios e fazendas.
→ ADMIN pode existir sem vinculos em usuarios_fazendas.
→ FUNCIONARIO pode ter uma ou mais fazendas vinculadas.
→ Tabela colheitas possui indices para consultas por filtro.
→ Modelo Prisma sincronizado sem regressao nas entidades existentes.
→ Consultas filtradas de colheitas utilizam os novos indices.

---

# [STORY BACKEND] Refinamento Tela de Colheitas — Backend

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Backend
Relator:     (preencher)
Pai:         [EPIC] Refinamento da Tela de Colheitas
Data Limite: (preencher)

## 📝 Descrição
Como sistema, eu quero expor endpoints de colheita com filtros por perfil e validacoes de permissao por fazenda, para suportar a tela Minhas Colheitas com seguranca e consistencia.

---

## ✅ Critérios de Aceite

### Cenário 1 — Listar colheitas com filtros (ADMIN)
**Dado** que o usuario autenticado e ADMIN, **Quando** GET /api/colheitas?fazendaId={id|all}&culturaId={id}&mes={MM}&ano={YYYY} e chamado, **Então** retorna 200 com colheitas filtradas.
* **Se** `fazendaId=all`: retorna dados de todas as fazendas.
* **Se** parametros de filtro forem invalidos: Retorna 400 "Parametros de filtro invalidos".

### Cenário 2 — Listar colheitas com filtros (FUNCIONARIO)
**Dado** que o usuario autenticado e FUNCIONARIO com uma ou mais fazendas vinculadas, **Quando** GET /api/colheitas e chamado, **Então** o backend restringe a consulta ao conjunto de fazendas vinculadas ao usuario.
* **Se** funcionario nao tiver fazendas vinculadas: Retorna 422 "Funcionario sem fazendas vinculadas".

### Cenário 3 — Criar colheita por funcionario
**Dado** que o usuario autenticado e FUNCIONARIO, **Quando** POST /api/colheitas e chamado, **Então** o backend valida que a fazenda enviada pertence ao conjunto de fazendas vinculadas do usuario (ou aplica preset automatico quando houver apenas uma) e cria com 201.
* **Se** tentar criar para outra fazenda fora do vinculo: Retorna 403 "Sem permissao para registrar colheita nesta fazenda".

### Cenário 4 — Criar/editar colheita por administrador
**Dado** que o usuario autenticado e ADMIN, **Quando** POST /api/colheitas ou PUT /api/colheitas/:id e chamado, **Então** permite escolher qualquer fazenda e retorna 201/200.

### Cenário 5 — Excluir colheita
**Dado** que existe colheita cadastrada, **Quando** DELETE /api/colheitas/:id e chamado por usuario autorizado, **Então** remove o registro com 204.
* **Se** id nao existir: Retorna 404 "Colheita nao encontrada".

---

## 🛠️ Implementação

### colheita.controller.js (EXISTENTE — MODIFICAR)

Métodos existentes (não alterar):
* Arquivo existente sem metodos implementados.

Métodos NOVOS a adicionar:
* getAll() -> GET /api/colheitas
* getPorId() -> GET /api/colheitas/:id
* getPorFazenda() -> GET /api/colheitas/fazenda/:fazendaId
* create() -> POST /api/colheitas
* update() -> PUT /api/colheitas/:id
* delete() -> DELETE /api/colheitas/:id

### colheita.service.js (EXISTENTE — MODIFICAR)

Lógica existente (não alterar):
→ Arquivo existente sem regras implementadas.

Lógica NOVA a adicionar:
→ Aplicar filtro por perfil (ADMIN livre com suporte a `all`; FUNCIONARIO restrito ao conjunto de fazendas vinculadas).
→ Validar cultura e fazenda no create/update.
→ Validar data da colheita e sacas produzidas.
→ Enforcar regra de escopo de fazenda para FUNCIONARIO com base em uma ou mais fazendas vinculadas.
→ Lancar AppError com codigos HTTP padronizados.

### colheita.repository.js (EXISTENTE — MODIFICAR)

Métodos existentes (não alterar):
→ Arquivo existente sem metodos implementados.

Métodos NOVOS a adicionar:
→ buscarTodosComFiltros({ fazendaId, culturaId, mes, ano, role, usuarioId, fazendaIdsPermitidas })
→ buscarPorId(id)
→ buscarPorFazenda(fazendaId)
→ create(dados)
→ update(id, dados)
→ delete(id)

### colheita.view.js (EXISTENTE — MODIFICAR)

Métodos existentes (não alterar):
→ Arquivo existente sem metodos implementados.

Métodos NOVOS a adicionar:
→ render(colheita): incluir fazenda, cultura, sacas, data
→ renderMany(colheitas)

### auth.service.js (EXISTENTE — MODIFICAR)

Lógica existente (não alterar):
→ login()
→ cadastro()
→ esqueciSenha()
→ redefinirSenha()

Lógica NOVA a adicionar:
→ Incluir fazendasVinculadas no retorno de usuario quando existir, para permitir preset ou selecao restrita no frontend.

### usuario.service.js (EXISTENTE — MODIFICAR)

Lógica existente (não alterar):
→ listarTodos()
→ buscarPorId(id)
→ atualizar(id, dados, usuarioLogadoId)
→ deletar(id, usuarioLogadoId)

Lógica NOVA a adicionar:
→ Validar e manter fazendaIds para perfil FUNCIONARIO.

---

## 📐 Schemas (Zod)

### colheita.schema.js (EXISTENTE — MODIFICAR)

Schemas existentes (não alterar):
→ Arquivo existente sem schemas implementados.

Schemas NOVOS a adicionar:
→ createColheitaSchema:
  - fazendaId: string uuid obrigatorio
  - culturaId: string uuid obrigatorio
  - dataColheita: date/string date obrigatorio
  - sacasProduzidas: number positivo obrigatorio

→ updateColheitaSchema:
  - campos de createColheitaSchema como partial

→ colheitaFiltroSchema:
  - fazendaId: string uuid ou literal `all` opcional
  - culturaId: string uuid opcional
  - mes: number inteiro 1..12 opcional
  - ano: number inteiro >= 2000 opcional

### auth.schema.js (EXISTENTE — MODIFICAR)

Schemas existentes (não alterar):
→ cadastroSchema existente.

Schemas NOVOS a adicionar:
→ cadastroSchema: fazendaIds opcional com regra condicional por role.

### usuario.schema.js (EXISTENTE — MODIFICAR)

Schemas existentes (não alterar):
→ updateUsuarioSchema existente.

Schemas NOVOS a adicionar:
→ updateUsuarioSchema: incluir fazendaIds opcional e validacoes por role.

---

## 🛣️ Rotas

### colheita.routes.js (EXISTENTE — MODIFICAR)

Rotas existentes (não alterar):
* Arquivo existente sem rotas implementadas.

Rotas NOVAS a adicionar:
* GET /api/colheitas
* GET /api/colheitas/:id
* GET /api/colheitas/fazenda/:fazendaId
* POST /api/colheitas
* PUT /api/colheitas/:id
* DELETE /api/colheitas/:id

### index.js (EXISTENTE — MODIFICAR)

Rotas existentes (não alterar):
* /api/auth
* /api/usuarios

Rotas NOVAS a adicionar:
* /api/colheitas

---

## 🚫 Regras de Negócio
* FUNCIONARIO nao pode escolher fazendas fora do proprio vinculo em create/update de colheita.
* Se funcionario nao estiver vinculado a nenhuma fazenda, operacao de escrita deve falhar com erro de negocio.
* Se o FUNCIONARIO tiver 1 fazenda vinculada, o modal pode abrir com preset automatico.
* Se o FUNCIONARIO tiver mais de 1 fazenda vinculada, o select deve listar apenas as fazendas permitidas.
* ADMIN pode listar e operar em qualquer fazenda especifica ou por "Todas Fazendas".
* Exclusao exige confirmacao explicita no frontend.

---

# [STORY FRONTEND] Refinamento Tela de Colheitas — Frontend

Tipo:        Story
Prioridade:  🔼 High
Sprint:      (preencher)
Categoria:   Frontend
Relator:     (preencher)
Pai:         [EPIC] Refinamento da Tela de Colheitas
Data Limite: (preencher)

## 📝 Descrição
Como usuario (ADMIN ou FUNCIONARIO), eu quero gerenciar minhas colheitas em uma tela com filtros por perfil, tabela e modais, para registrar e manter dados de producao de forma eficiente.

---

## ✅ Critérios de Aceite

### Cenário 1 — Renderizacao inicial da tela
**Dado** que estou autenticado
**Quando** acesso /colheitas
**Então** visualizo filtros, botao "Filtrar", botao "Nova Colheita" e tabela com colunas Fazenda, Cultura, Sacas, Data e Acoes.

### Cenário 2 — Filtros por perfil
**Dado** que sou ADMIN
**Quando** acesso a tela
**Então** vejo filtros Fazenda, Cultura e Mes/Ano.
* O filtro Fazenda deve conter a opcao "Todas Fazendas".

**Dado** que sou FUNCIONARIO
**Quando** acesso a tela
**Então** vejo apenas Cultura e Mes/Ano.

### Cenário 3 — Comportamento do botao Filtrar/Limpar Filtros
**Dado** que preenchi filtros e cliquei em "Filtrar"
**Quando** filtros sao aplicados
**Então** botao muda para "Limpar Filtros".

**Dado** que filtros ja aplicados
**Quando** altero qualquer filtro
**Então** botao volta para "Filtrar".

### Cenário 4 — Modal de nova colheita
**Dado** que estou na tela
**Quando** clico em "Nova Colheita"
**Então** abre modal "Criar Colheita" com campos: Vincular fazenda, Cultura, Data da Colheita e Sacas Produzidas.

### Cenário 5 — Preset de fazenda para funcionario
**Dado** que sou FUNCIONARIO com 1 fazenda vinculada
**Quando** abro modal de criar ou editar
**Então** o campo fazenda vem preenchido e bloqueado para edicao.

**Dado** que sou FUNCIONARIO com mais de 1 fazenda vinculada
**Quando** abro modal de criar ou editar
**Então** o campo fazenda lista apenas as fazendas vinculadas ao meu usuario.

### Cenário 6 — Modal de editar colheita
**Dado** que existe colheita na tabela
**Quando** clico no icone de editar
**Então** abre modal "Editar Colheita" com dados da linha.

### Cenário 7 — Modal de excluir colheita
**Dado** que existe colheita na tabela
**Quando** clico no icone de excluir
**Então** aparece modal com mensagem no formato: "Deseja excluir a colheita de Cafe do dia 23/06/2025?".

---

## 🎨 Visual e UX

Referencia obrigatoria: seguir o layout enviado para:
- Tela de listagem de colheitas.
- Modal Criar Colheita.
- Modal Editar Colheita.
- Modal Excluir Colheita.

### Tabela e Componentes
* **Tabelas:** colunas e distribuicao conforme layout.
* **Modais:** campos, alinhamento e CTAs conforme layout.
* **Responsividade:** preservar legibilidade em resolucoes menores sem quebrar fluxo principal desktop.

---

## ⚙️ Integração Técnica

### Hooks (TanStack Query)

#### useColheitaQueries.js (EXISTENTE — MODIFICAR)

Hooks existentes (não alterar):
→ Arquivo existente sem hooks implementados.

Hooks NOVOS a adicionar:
→ useColheitaListQuery(filters)
→ useCreateColheitaMutation()
→ useUpdateColheitaMutation()
→ useDeleteColheitaMutation()

### Componentes

#### pages/Colheitas/Colheitas.jsx (EXISTENTE — MODIFICAR)

Existente (não alterar):
→ Arquivo existente sem implementacao.

NOVO a adicionar:
→ Layout da tela com filtros por perfil e estado de botao Filtrar/Limpar Filtros.
→ Incluir opcao "Todas Fazendas" no filtro de ADMIN.
→ Tabela com acoes editar/excluir.
→ Controle dos modais de criar, editar e excluir.

#### components/colheitas/ColheitaFormModal.jsx (NOVO — CRIAR)

Criar em: src/components/colheitas/ColheitaFormModal.jsx
Seguir padrão de: src/pages/Gastos/Gastos.jsx (padrao de modal e formularios no projeto)
→ Modal reutilizavel para criar/editar colheita.
→ Respeitar preset automatico para 1 fazenda vinculada e selecao restrita para N fazendas vinculadas do FUNCIONARIO.

#### components/colheitas/DeleteColheitaModal.jsx (NOVO — CRIAR)

Criar em: src/components/colheitas/DeleteColheitaModal.jsx
Seguir padrão de: src/pages/Gastos/Gastos.jsx (modal de confirmacao)
→ Mensagem dinamica: "Deseja excluir a colheita de {cultura} do dia {data}?"

#### components/colheitas/ColheitaTable.jsx (NOVO — CRIAR)

Criar em: src/components/colheitas/ColheitaTable.jsx
Seguir padrão de: src/pages/Gastos/Gastos.jsx (tabela e acoes)
→ Renderizar colunas Fazenda, Cultura, Sacas, Data, Acoes.

### Services

#### colheita.service.js (EXISTENTE — MODIFICAR)

Métodos existentes (não alterar):
→ Arquivo existente sem metodos implementados.

Métodos NOVOS a adicionar:
→ buscarTodos(filtros)       → GET /api/colheitas
→ buscarPorId(id)            → GET /api/colheitas/:id
→ buscarPorFazenda(id)       → GET /api/colheitas/fazenda/:id
→ criar(dados)               → POST /api/colheitas
→ atualizar(id, dados)       → PUT /api/colheitas/:id
→ deletar(id)                → DELETE /api/colheitas/:id

### Rotas de navegação

#### App.jsx (EXISTENTE — MODIFICAR)

Rotas existentes (não alterar):
* /
* /gastos
* /usuarios

Rotas NOVAS a adicionar:
* /colheitas (PrivateRoute)

### Endpoints consumidos
- GET /api/colheitas
- GET /api/colheitas/:id
- GET /api/colheitas/fazenda/:id
- POST /api/colheitas
- PUT /api/colheitas/:id
- DELETE /api/colheitas/:id
- GET /api/fazendas
- GET /api/culturas

---

## 🚫 Regras de Negócio
* Filtro Fazenda nao aparece para FUNCIONARIO.
* Filtro Fazenda do ADMIN deve incluir "Todas Fazendas".
* FUNCIONARIO sempre opera dentro do conjunto de fazendas vinculadas.
* Comportamento de Filtrar/Limpar Filtros segue exatamente o mesmo padrao definido para Lucros.
* Modal de exclusao deve refletir cultura e data da linha selecionada.

---

## 🛠️ Refinamento
* **Estado de filtro:** separar draftFilters e appliedFilters para sustentar a troca correta do CTA.
* **Estado Global:** usar useAuthStore para role e fazenda vinculada do usuario.
* **Validação:** frontend valida obrigatorios no submit; backend mantem validacao canonica com Zod.

---
