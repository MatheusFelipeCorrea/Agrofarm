# [EPIC] Refinamento da Tela de Lucros

Tipo:        Epic
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Frontend, Backend, Banco de Dados, UX
Relator:     (preencher)
Pai:         —
Data Limite: (preencher)

## 📌 Status Auditado no Codigo (25/04/2026)

- Estrutura de dados base de lucros existe no Prisma (`model lucros` + relacao com `colheitas`), incluindo indices de data. (CONCLUIDO)
- O modulo backend esta apenas montado no roteamento principal; `lucro.controller.js` esta vazio e `lucro.routes.js` segue sem endpoints reais. (PENDENTE)
- A superficie frontend de lucros segue vazia e ainda nao esta ligada em `App.jsx`. (PENDENTE)

Este epic entrega o refinamento completo do modulo de Lucros conforme layout aprovado, cobrindo listagem, filtros por perfil, card de total, modais de criacao/edicao/exclusao e regras de permissao por papel (ADMIN e FUNCIONARIO).

Escopo funcional consolidado:
- Tela "Meus Lucros" com filtros de Fazenda, Cultura e Mes/Ano para ADMIN.
- No filtro de Fazenda do ADMIN, deve existir a opcao "Todas Fazendas" para consulta consolidada.
- Para FUNCIONARIO, o filtro de Fazenda nao deve ser exibido.
- Botao de filtro com estado dinamico:
  - Inicial: "Filtrar".
  - Apos aplicacao: "Limpar Filtros".
  - Se o usuario alterar qualquer filtro depois de aplicar, o botao volta para "Filtrar".
- Tabela com colunas: Fazenda, Colheita, Cultura, Sacas, Valor Saca, Total, Comprador, Data e Acoes.
- Acoes de editar e deletar por linha.
- Card com Total Lucro.
- Modal "Novo lucro" ao clicar em "Novo Lucro".
- Modal "Editar lucro" ao clicar no icone de edicao.
- Modal de confirmacao de exclusao com texto: "Deseja excluir o lucro de venda de x sacas de x cultura do dia xx/xx/xxxx?"
- Regra de negocio obrigatoria:
  - se o FUNCIONARIO tiver 1 fazenda vinculada, o modal pode abrir com a fazenda predefinida;
  - se o FUNCIONARIO tiver mais de 1 fazenda vinculada, ele pode selecionar apenas entre as fazendas do seu vinculo.

Base visual e de interacao:
- Seguir o layout fornecido (listagem + modais de criar/editar/excluir), mantendo hierarquia visual, distribuicao dos campos e CTA principal.

---

# [STORY DATABASE] Refinamento Tela de Lucros — Banco de Dados

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Banco de Dados
Relator:     (preencher)
Pai:         [EPIC] Refinamento da Tela de Lucros
Data Limite: (preencher)

Como sistema, eu quero que o banco suporte vinculo de funcionario com uma ou mais fazendas e consultas performaticas de lucros por periodo, para que a tela de lucros respeite regras de perfil e filtros sem degradar desempenho.

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

-- **2. Melhorar consulta de lucros por periodo/colheita (ALTERAR TABELA EXISTENTE)**
CREATE INDEX IF NOT EXISTS idx_lucros_data
ON lucros (data);

CREATE INDEX IF NOT EXISTS idx_lucros_colheita_data
ON lucros (colheita_id, data);

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
- Relacao N:N entre usuarios e fazendas
- Indices em lucros(data) e lucros(colheita_id, data)

**Critérios de Aceite:**

→ Tabela usuarios_fazendas existe com relacao N:N valida entre usuarios e fazendas.
→ ADMIN pode existir sem vinculos em usuarios_fazendas.
→ FUNCIONARIO pode ter uma ou mais fazendas vinculadas.
→ Indices de lucros por data e colheita+data criados com sucesso.
→ Prisma atualizado sem quebrar modelos existentes.

---

# [STORY BACKEND] Refinamento Tela de Lucros — Backend

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Backend
Relator:     (preencher)
Pai:         [EPIC] Refinamento da Tela de Lucros
Data Limite: (preencher)

## 📝 Descrição
Como sistema, eu quero expor endpoints de lucro com filtros por perfil e validar a criacao com vinculo do funcionario a uma ou mais fazendas, para garantir consistencia de dados e comportamento correto da tela.

---

## ✅ Critérios de Aceite

### Cenário 1 — Listar lucros com filtros (ADMIN)
**Dado** que o usuario autenticado e ADMIN, **Quando** GET /api/lucros?fazendaId={id|all}&culturaId={id}&mes={MM}&ano={YYYY} e chamado, **Então** retorna 200 com itens filtrados e campos necessarios para a tabela.
* **Se** `fazendaId=all`: retorna dados de todas as fazendas.
* **Se** os parametros forem invalidos: Retorna 400 "Parametros de filtro invalidos".

### Cenário 2 — Listar lucros com filtros (FUNCIONARIO)
**Dado** que o usuario autenticado e FUNCIONARIO vinculado a uma ou mais fazendas, **Quando** GET /api/lucros e chamado com ou sem fazendaId, **Então** o backend restringe a consulta ao conjunto de fazendas vinculadas do usuario.
* **Se** o funcionario nao tiver fazendas vinculadas: Retorna 422 "Funcionario sem fazendas vinculadas".

### Cenário 3 — Criar lucro por funcionario
**Dado** que o usuario autenticado e FUNCIONARIO, **Quando** POST /api/lucros e chamado, **Então** o backend valida que a colheita pertence a uma das fazendas vinculadas ao funcionario e cria o lucro com status 201.
* **Se** a colheita pertencer a outra fazenda fora do vinculo: Retorna 403 "Sem permissao para registrar lucro nesta fazenda".

### Cenário 4 — Criar/editar lucro por administrador
**Dado** que o usuario autenticado e ADMIN, **Quando** POST /api/lucros ou PUT /api/lucros/:id e chamado com payload valido, **Então** retorna 201/200 com objeto de lucro formatado.
* **Se** payload invalido: Retorna 400 com detalhes de validacao.

### Cenário 5 — Excluir lucro
**Dado** que existe lucro cadastrado, **Quando** DELETE /api/lucros/:id e chamado por usuario autorizado, **Então** remove o registro e retorna 204.
* **Se** id inexistente: Retorna 404 "Lucro nao encontrado".

### Cenário 6 — Total de lucro filtrado
**Dado** que o usuario aplicou filtros, **Quando** GET /api/lucros/total?filtros e chamado, **Então** retorna 200 com totalLucro (soma de quantidade_sacas * valor_unitario) coerente com a listagem.

---

## 🛠️ Implementação

### lucro.controller.js (EXISTENTE — MODIFICAR)

Métodos existentes (não alterar):
* Arquivo existente sem metodos implementados.

Métodos NOVOS a adicionar:
* getAll() -> GET /api/lucros
* getTotal() -> GET /api/lucros/total
* getPorColheita() -> GET /api/lucros/colheita/:colheitaId
* create() -> POST /api/lucros
* update() -> PUT /api/lucros/:id
* delete() -> DELETE /api/lucros/:id

### lucro.service.js (EXISTENTE — MODIFICAR)

Lógica existente (não alterar):
→ Arquivo existente sem regras implementadas.

Lógica NOVA a adicionar:
→ Aplicar filtro por perfil (ADMIN livre com suporte a `all`; FUNCIONARIO restrito ao conjunto de fazendas vinculadas).
→ Validar mes/ano e demais filtros opcionais.
→ Validar existencia da colheita no create/update.
→ Validar permissao por fazenda para FUNCIONARIO com base em uma ou mais fazendas vinculadas.
→ Calcular e retornar total agregado para card de "Total Lucro".
→ Lancar AppError com codigos HTTP padronizados.

### lucro.repository.js (EXISTENTE — MODIFICAR)

Métodos existentes (não alterar):
→ Arquivo existente sem metodos implementados.

Métodos NOVOS a adicionar:
→ buscarTodosComFiltros({ fazendaId, culturaId, mes, ano, role, usuarioId, fazendaIdsPermitidas })
→ buscarTotalComFiltros({ fazendaId, culturaId, mes, ano, role, usuarioId, fazendaIdsPermitidas })
→ buscarPorId(id)
→ buscarPorColheita(colheitaId)
→ create(dados)
→ update(id, dados)
→ delete(id)

### lucro.view.js (EXISTENTE — MODIFICAR)

Métodos existentes (não alterar):
→ Arquivo existente sem metodos implementados.

Métodos NOVOS a adicionar:
→ render(lucro): incluir fazenda, colheita, cultura, sacas, valorSaca, total, comprador, data
→ renderMany(lucros)
→ renderTotal(total)

### usuario.service.js (EXISTENTE — MODIFICAR)

Lógica existente (não alterar):
→ listarTodos()
→ buscarPorId(id)
→ atualizar(id, dados, usuarioLogadoId)
→ deletar(id, usuarioLogadoId)

Lógica NOVA a adicionar:
→ Validar fazendaIds quando role = FUNCIONARIO.
→ Permitir fazendaIds vazio quando role = ADMIN.

### auth.service.js (EXISTENTE — MODIFICAR)

Lógica existente (não alterar):
→ login()
→ cadastro()
→ esqueciSenha()
→ redefinirSenha()

Lógica NOVA a adicionar:
→ Permitir cadastro com fazendaIds para FUNCIONARIO.
→ Incluir fazendasVinculadas no objeto usuario retornado quando aplicavel.

---

## 📐 Schemas (Zod)

### lucro.schema.js (EXISTENTE — MODIFICAR)

Schemas existentes (não alterar):
→ Arquivo existente sem schemas implementados.

Schemas NOVOS a adicionar:
→ createLucroSchema:
  - colheitaId: string uuid obrigatorio
  - quantidadeSacas: number positivo obrigatorio
  - valorUnitario: number positivo obrigatorio
  - comprador: string min(2) max(150) obrigatorio
  - data: date/string date obrigatorio

→ updateLucroSchema:
  - campos de createLucroSchema como partial

→ lucroFiltroSchema:
  - fazendaId: string uuid ou literal `all` opcional
  - culturaId: string uuid opcional
  - mes: number inteiro 1..12 opcional
  - ano: number inteiro >= 2000 opcional

### auth.schema.js (EXISTENTE — MODIFICAR)

Schemas existentes (não alterar):
→ cadastroSchema existente.

Schemas NOVOS a adicionar:
→ cadastroSchema: incluir fazendaIds opcional com validacao condicional:
  - obrigatorio com ao menos 1 item para role FUNCIONARIO
  - opcional/vazio para role ADMIN

### usuario.schema.js (EXISTENTE — MODIFICAR)

Schemas existentes (não alterar):
→ updateUsuarioSchema existente.

Schemas NOVOS a adicionar:
→ updateUsuarioSchema: aceitar fazendaIds opcional com regra por role.

---

## 🛣️ Rotas

### lucro.routes.js (EXISTENTE — MODIFICAR)

Rotas existentes (não alterar):
* Arquivo existente sem rotas implementadas.

Rotas NOVAS a adicionar:
* GET /api/lucros
* GET /api/lucros/total
* GET /api/lucros/colheita/:colheitaId
* POST /api/lucros
* PUT /api/lucros/:id
* DELETE /api/lucros/:id

### index.js (EXISTENTE — MODIFICAR)

Rotas existentes (não alterar):
* /api/auth
* /api/usuarios

Rotas NOVAS a adicionar:
* /api/lucros

---

## 🚫 Regras de Negócio
* ADMIN pode filtrar por qualquer fazenda especifica ou por "Todas Fazendas".
* FUNCIONARIO nunca pode selecionar fazendas fora do proprio vinculo.
* Se o FUNCIONARIO tiver 1 fazenda vinculada, o modal pode abrir com preset automatico.
* Se o FUNCIONARIO tiver mais de 1 fazenda vinculada, o select deve listar apenas as fazendas permitidas.
* Se filtros forem alterados no frontend apos aplicacao, nova consulta so ocorre quando clicar em "Filtrar" novamente.
* Campo total da tabela e sempre derivado de quantidade_sacas * valor_unitario.
* Exclusao de lucro exige confirmacao explicita no frontend.

---

# [STORY FRONTEND] Refinamento Tela de Lucros — Frontend

Tipo:        Story
Prioridade:  🔼 High
Sprint:      (preencher)
Categoria:   Frontend
Relator:     (preencher)
Pai:         [EPIC] Refinamento da Tela de Lucros
Data Limite: (preencher)

## 📝 Descrição
Como usuario (ADMIN ou FUNCIONARIO), eu quero gerenciar os lucros por meio de filtros, tabela e modais, para registrar vendas e acompanhar o total de forma clara e rapida.

---

## ✅ Critérios de Aceite

### Cenário 1 — Renderizacao inicial da tela
**Dado** que estou autenticado
**Quando** acesso a rota /lucros
**Então** visualizo titulo "Meus Lucros", filtros, botao "Filtrar", botao "Novo Lucro", card "Total Lucro" e tabela com colunas previstas.

### Cenário 2 — Filtro por perfil
**Dado** que sou ADMIN
**Quando** acesso a tela
**Então** vejo os filtros Fazenda, Cultura e Mes/Ano.
* O filtro Fazenda deve conter a opcao "Todas Fazendas".

**Dado** que sou FUNCIONARIO
**Quando** acesso a tela
**Então** nao vejo o filtro Fazenda.

### Cenário 3 — Troca de estado do botao Filtrar/Limpar Filtros
**Dado** que preenchi filtros e cliquei em "Filtrar"
**Quando** a lista e atualizada
**Então** o botao muda para "Limpar Filtros".

**Dado** que filtros ja foram aplicados
**Quando** altero qualquer valor de filtro
**Então** o botao volta para "Filtrar".

### Cenário 4 — Abrir modal de novo lucro
**Dado** que estou na tela de lucros
**Quando** clico em "Novo Lucro"
**Então** abre modal "Novo lucro" conforme layout com campos: Fazenda, Cultura, Quantidade de sacas, Valor da saca, Comprador e Data.

### Cenário 5 — Predefinicao de fazenda para funcionario
**Dado** que sou FUNCIONARIO com 1 fazenda vinculada
**Quando** abro modal "Novo lucro"
**Então** o campo fazenda vem preenchido automaticamente com a fazenda do vinculo e bloqueado para edicao.

**Dado** que sou FUNCIONARIO com mais de 1 fazenda vinculada
**Quando** abro modal "Novo lucro"
**Então** o campo fazenda permite selecionar apenas entre as fazendas vinculadas ao meu usuario.

### Cenário 6 — Abrir modal de edicao
**Dado** que existe um lucro na tabela
**Quando** clico no icone de editar
**Então** abre modal "Editar lucro" com os dados da linha preenchidos.

### Cenário 7 — Abrir modal de exclusao
**Dado** que existe um lucro na tabela
**Quando** clico no icone de deletar
**Então** abre modal de confirmacao com texto: "Deseja excluir o lucro de venda de x sacas de x cultura do dia xx/xx/xxxx?".

---

## 🎨 Visual e UX

Referencia obrigatoria: seguir o layout enviado para:
- Tela principal de listagem de lucros.
- Modal de novo lucro.
- Modal de editar lucro.
- Modal de confirmacao de exclusao.

### Tabela e Componentes
* **Tabelas:** linhas com colunas fixas do layout e destaque visual em valor monetario.
* **Modais:** tamanho e hierarquia visual conforme layout, com CTA primario verde e CTA de cancelamento em vermelho quando aplicavel.
* **Responsividade:** desktop prioritario (como layout) e adaptacao para mobile sem quebra de leitura da tabela.

---

## ⚙️ Integração Técnica

### Hooks (TanStack Query)

#### useLucroQueries.js (EXISTENTE — MODIFICAR)

Hooks existentes (não alterar):
→ Arquivo existente sem hooks implementados.

Hooks NOVOS a adicionar:
→ useLucroListQuery(filters)
→ useLucroTotalQuery(filters)
→ useCreateLucroMutation()
→ useUpdateLucroMutation()
→ useDeleteLucroMutation()

### Componentes

#### pages/Lucros/Lucros.jsx (EXISTENTE — MODIFICAR)

Existente (não alterar):
→ Arquivo existente sem implementacao.

NOVO a adicionar:
→ Render da tela principal com filtros por perfil e estado do botao Filtrar/Limpar Filtros.
→ Incluir opcao "Todas Fazendas" no filtro de ADMIN.
→ Card de total de lucro.
→ Tabela de lucros com acoes de editar/deletar.
→ Controle de abertura/fechamento dos 3 modais.

#### components/lucros/LucroFormModal.jsx (NOVO — CRIAR)

Criar em: src/components/lucros/LucroFormModal.jsx
Seguir padrão de: src/pages/Gastos/Gastos.jsx (estrutura de modal ja utilizada no projeto)
→ Modal reutilizavel para Novo lucro e Editar lucro.
→ Suporte a preset automatico para 1 fazenda vinculada e selecao restrita para N fazendas vinculadas do FUNCIONARIO.

#### components/lucros/DeleteLucroModal.jsx (NOVO — CRIAR)

Criar em: src/components/lucros/DeleteLucroModal.jsx
Seguir padrão de: src/pages/Gastos/Gastos.jsx (modal de confirmacao de exclusao)
→ Renderizar mensagem dinamica com sacas, cultura e data formatada.

#### components/lucros/LucroTable.jsx (NOVO — CRIAR)

Criar em: src/components/lucros/LucroTable.jsx
Seguir padrão de: src/pages/Gastos/Gastos.jsx (tabela e acoes por linha)
→ Componente de tabela com colunas do layout e callbacks onEdit/onDelete.

### Services

#### lucro.service.js (EXISTENTE — MODIFICAR)

Métodos existentes (não alterar):
→ Arquivo existente sem metodos implementados.

Métodos NOVOS a adicionar:
→ buscarTodos(filtros)     → GET /api/lucros
→ buscarTotal(filtros)     → GET /api/lucros/total
→ buscarPorColheita(id)    → GET /api/lucros/colheita/:id
→ criar(dados)             → POST /api/lucros
→ atualizar(id, dados)     → PUT /api/lucros/:id
→ deletar(id)              → DELETE /api/lucros/:id

### Rotas de navegação

#### App.jsx (EXISTENTE — MODIFICAR)

Rotas existentes (não alterar):
* /
* /gastos
* /usuarios

Rotas NOVAS a adicionar:
* /lucros (PrivateRoute)

### Endpoints consumidos
- GET /api/lucros
- GET /api/lucros/total
- GET /api/lucros/colheita/:id
- POST /api/lucros
- PUT /api/lucros/:id
- DELETE /api/lucros/:id
- GET /api/fazendas (popular filtro/admin e form)
- GET /api/colheitas (popular colheita/cultura no form)

---

## 🚫 Regras de Negócio
* Filtro Fazenda nao deve ser renderizado para FUNCIONARIO.
* Filtro Fazenda do ADMIN deve incluir "Todas Fazendas".
* FUNCIONARIO cria/edita lucro sempre dentro do conjunto de fazendas vinculadas.
* Botao "Filtrar/Limpar Filtros" segue maquina de estado definida no epic.
* Mensagem do modal de exclusao deve manter o texto exatamente conforme requisito.

---

## 🛠️ Refinamento
* **Estado de filtro:** usar par de estados (draftFilters e appliedFilters) para sustentar comportamento do botao.
* **Estado Global:** usar useAuthStore para role e dados do usuario (incluindo fazenda vinculada quando houver).
* **Validação:** validar campos obrigatorios no submit (frontend) e manter validacao canonica no backend via Zod.

---