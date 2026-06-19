# [FIX] Gerenciar Usuarios - Vinculo com Uma ou Mais Fazendas

Tipo:        Fix
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Frontend, Backend, Banco de Dados, Auth
Relator:     (preencher)
Pai:         [EPIC] Autenticacao e Controle de Acesso
Data Limite: (preencher)

## 📌 Status Auditado no Codigo (25/04/2026)

- Estrutura N:N `usuarios_fazendas` com unique composto e indices esta no schema Prisma. (CONCLUIDO)
- Backend de usuarios (controller/service/repository/routes/schema/view) existe para CRUD base. (CONCLUIDO)
- Modal de usuarios com busca/chips para vinculo de fazendas implementado. (CONCLUIDO)
- Contrato de create/update com `fazendaIds` e retorno `fazendasVinculadas` implementado em backend/frontend. (CONCLUIDO)
- Fluxo de criacao em chamada unica (sem segunda chamada para telefone) implementado. (CONCLUIDO)
- Tabela de usuarios com bloqueio de autoexclusao do usuario logado implementada. (CONCLUIDO)
- Lucros permanece sem integracao pratica neste fix por ausencia de implementacao funcional da tela no repositorio atual. (PENDENTE)

## 📝 Descricao
Como ADMIN do AgroFarm,
eu quero criar e editar usuarios com vinculo a uma ou mais fazendas,
para que o escopo de operacao dos perfis FUNCIONARIO reflita exatamente as fazendas permitidas.

O modulo de usuarios hoje ja permite CRUD basico, mas ainda esta com lacunas funcionais para o novo layout e para o controle de escopo:
- o modal nao permite buscar/selecionar fazendas vinculadas;
- o fluxo de criacao de usuario usa duas chamadas (cadastro + update para telefone);
- o backend ainda nao persiste os vinculos na criacao/edicao de usuarios;
- a tabela ainda exibe acao de excluir para o proprio usuario logado.

Este fix consolida as correcoes para que o vinculo N:N entre usuarios e fazendas vire fonte de verdade de permissao operacional.

---

## 🎯 Escopo Funcional

- Permitir vincular usuario a 1..N fazendas no modal de criar/editar.
- Tornar `fazendaIds` parte do contrato de create/update de usuario.
- Persistir vinculos em `usuarios_fazendas` de forma consistente.
- Eliminar criacao em duas chamadas para salvar telefone.
- Expor no payload de usuario as fazendas vinculadas para uso do frontend.
- Impedir exclusao do proprio usuario logado na interface.
- Ajustar premissas de Lucros e Colheitas para escopo por vinculo multiplo.

---

## ✅ Criterios de Aceite

### Cenario 1 - Criar usuario com fazendas vinculadas
**Dado** que sou ADMIN
**Quando** abro o modal "Criar Usuario"
**Entao** vejo pesquisa de fazenda, selecao e chips de fazendas vinculadas.

**E** se o tipo for `FUNCIONARIO`, ao menos 1 fazenda e obrigatoria.

### Cenario 2 - Editar usuario com fazendas vinculadas
**Dado** que sou ADMIN
**Quando** abro o modal "Editar Usuario"
**Entao** as fazendas vinculadas sao carregadas e posso adicionar/remover itens.

### Cenario 3 - Persistencia backend
**Dado** que o payload de create/update contem `fazendaIds`
**Quando** a API processa a requisicao
**Entao** o vinculo em `usuarios_fazendas` e persistido e o retorno inclui `fazendasVinculadas`.

### Cenario 4 - Escopo operacional por fazenda
**Dado** que um FUNCIONARIO possui fazendas vinculadas
**Quando** acessa modulos escopados por fazenda
**Entao** so visualiza e opera dados dessas fazendas.

### Cenario 5 - Compatibilidade 1 fazenda e N fazendas
**Dado** que um FUNCIONARIO possui 1 fazenda vinculada
**Quando** abre o modal de criacao em Lucros/Colheitas
**Entao** a fazenda vem pre-selecionada.

**Dado** que possui mais de 1 fazenda vinculada
**Quando** abre o mesmo modal
**Entao** so pode selecionar entre as fazendas vinculadas.

### Cenario 6 - Exclusao do proprio usuario
**Dado** que estou na tabela de usuarios
**Quando** a linha representa meu proprio usuario
**Entao** a acao de excluir nao deve ser exibida.

---

# [STORY DATABASE] Fix Gerenciar Usuarios - Banco de Dados

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Banco de Dados
Relator:     (preencher)
Pai:         [FIX] Gerenciar Usuarios - Vinculo com Uma ou Mais Fazendas
Data Limite: (preencher)

## 📝 Descricao
Como sistema, eu quero manter uma relacao N:N entre usuarios e fazendas, para suportar permissao multipla por usuario sem depender de coluna unica em `usuarios`.

---

## 📌 Estado Atual no Repositorio

A estrutura ja existe no schema Prisma:
- `model usuarios_fazendas` presente;
- relacoes em `usuarios` e `fazendas` presentes.

Arquivo validado:
- `Codigo/Agrofarm/api/prisma/schema.prisma` (EXISTENTE - MODIFICAR apenas se houver ajuste fino futuro)

---

## ✅ Criterios de Aceite

- [x] Existe tabela/entidade de vinculo N:N de usuarios e fazendas. (CONCLUIDO)
- [x] Existe unicidade composta para nao duplicar vinculo usuario-fazenda. (CONCLUIDO)
- [x] Existem indices para consulta por `usuario_id` e por `fazenda_id`. (CONCLUIDO)
- [ ] Diagrama ER atualizado com `usuarios_fazendas` (se ainda nao atualizado em artefatos).

---

# [STORY BACKEND] Fix Gerenciar Usuarios - Backend

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Backend, Auth
Relator:     (preencher)
Pai:         [FIX] Gerenciar Usuarios - Vinculo com Uma ou Mais Fazendas
Data Limite: (preencher)

## 📝 Descricao
Como sistema, eu quero aceitar `telefone` e `fazendaIds` no fluxo de cadastro/edicao de usuario e devolver o usuario com fazendas vinculadas, para garantir consistencia de contrato e de escopo entre autenticacao e gerenciamento de usuarios.

---

## ✅ Criterios de Aceite

### Cenario 1 - Cadastro com `fazendaIds`
**Dado** que `POST /api/auth/cadastro` recebe `nome`, `email`, `senha`, `role`, `telefone` e `fazendaIds`
**Quando** o cadastro e processado
**Entao** o usuario e criado e os vinculos com fazenda sao persistidos na mesma operacao logica.

### Cenario 2 - Regra por role
**Dado** que `role = FUNCIONARIO`
**Quando** `fazendaIds` vem vazio
**Entao** retorna erro de validacao.

**E** quando `role = ADMIN`, `fazendaIds` pode ser vazio.

### Cenario 3 - Update com substituicao de vinculos
**Dado** que `PUT /api/usuarios/:id` recebe `fazendaIds`
**Quando** o update e executado
**Entao** os vinculos antigos sao substituidos pelo novo conjunto informado.

### Cenario 4 - Payload consistente
**Dado** que create/update/list/get usuario sao chamados
**Quando** a API responde
**Entao** o payload inclui `fazendasVinculadas: [{ id, nome }]` sem expor senha.

---

## 🛠️ Implementacao

### auth.schema.js (EXISTENTE - MODIFICAR)

Schemas existentes (nao alterar):
- `loginSchema`
- `esqueciSenhaSchema`
- `redefinirSenhaSchema`

Schema existente a evoluir:
- `cadastroSchema`

NOVO a adicionar:
- `telefone` opcional no cadastro
- `fazendaIds: string[]` opcional
- refinamento condicional:
  - `FUNCIONARIO` exige `fazendaIds.length >= 1`
  - `ADMIN` permite vazio

### usuario.schema.js (EXISTENTE - MODIFICAR)

Schema existente (nao alterar como base):
- `updateUsuarioSchema`

NOVO a adicionar:
- `fazendaIds: string[]` opcional com validacao UUID por item
- regra condicional por role

### auth.service.js (EXISTENTE - MODIFICAR)

Metodos existentes (nao alterar assinatura base):
- `login({ email, senha })`
- `cadastro({ nome, email, senha, role })`
- `esqueciSenha({ email })`
- `redefinirSenha({ token, novaSenha })`

Evolucoes no metodo existente:
- ampliar `cadastro` para aceitar `telefone` e `fazendaIds`
- criar usuario + vinculos de fazenda no mesmo fluxo transacional

### auth.repository.js (EXISTENTE - MODIFICAR)

Metodos existentes (nao alterar):
- `buscarPorEmail(email)`
- `create(dados)`
- `salvarTokenReset(email, token, expira)`
- `buscarPorTokenReset(token)`
- `atualizarSenha(id, senhaHash)`

Metodos NOVOS a adicionar:
- `createComVinculos({ nome, email, senha, role, telefone, fazendaIds })`

### usuario.service.js (EXISTENTE - MODIFICAR)

Metodos existentes (nao alterar):
- `listarTodos()`
- `buscarPorId(id)`
- `atualizar(id, dados)`
- `deletar(id, usuarioLogadoId)`

Evolucoes:
- listar/buscar retornando usuario com fazendas vinculadas
- atualizar com substituicao de vinculos N:N quando `fazendaIds` for informado
- bloquear `FUNCIONARIO` sem vinculo

### usuario.repository.js (EXISTENTE - MODIFICAR)

Metodos existentes (nao alterar):
- `buscarTodos()`
- `buscarPorId(id)`
- `buscarPorEmail(email)`
- `update(id, dados)`
- `delete(id)`

Metodos NOVOS a adicionar:
- `buscarTodosComFazendas()`
- `buscarPorIdComFazendas(id)`
- `substituirFazendasDoUsuario(usuarioId, fazendaIds)`
- `criarVinculosDeFazenda(usuarioId, fazendaIds)`
- `removerVinculosDeFazenda(usuarioId)`

### usuario.view.js (EXISTENTE - MODIFICAR)

Metodos existentes (nao alterar):
- `render(usuario)`
- `renderMany(usuarios)`

NOVO a adicionar:
- incluir `fazendasVinculadas` no output

### auth.controller.js (EXISTENTE - MODIFICAR)

Metodos existentes (nao alterar):
- `login`
- `cadastro`
- `logout`
- `esqueciSenha`
- `redefinirSenha`

Evolucao:
- garantir que `cadastro` retorne usuario com `fazendasVinculadas`

### usuario.controller.js (EXISTENTE - MODIFICAR)

Metodos existentes (nao alterar):
- `getAll`
- `getPorId`
- `update`
- `delete`

Evolucao:
- `getAll`, `getPorId`, `update` devolvendo payload com `fazendasVinculadas`

### auth.routes.js e usuario.routes.js (EXISTENTE - MODIFICAR)

Rotas existentes (nao alterar):
- `POST /api/auth/cadastro`
- `GET /api/usuarios`
- `GET /api/usuarios/:id`
- `PUT /api/usuarios/:id`
- `DELETE /api/usuarios/:id`

Evolucao:
- manter mesmas rotas e evoluir contratos para `telefone`/`fazendaIds`

---

## 🚫 Regras de Negocio

- `ADMIN` pode existir sem fazendas vinculadas.
- `FUNCIONARIO` deve possuir ao menos 1 fazenda vinculada.
- Usuario nao pode operar fora do conjunto de fazendas vinculadas.
- Viculo N:N em `usuarios_fazendas` e a fonte de verdade para escopo por fazenda.

---

# [STORY FRONTEND] Fix Gerenciar Usuarios - Frontend

Tipo:        Story
Prioridade:  🔼 High
Sprint:      (preencher)
Categoria:   Frontend
Relator:     (preencher)
Pai:         [FIX] Gerenciar Usuarios - Vinculo com Uma ou Mais Fazendas
Data Limite: (preencher)

## 📝 Descricao
Como ADMIN, eu quero criar e editar usuarios em uma unica interacao com validacao de vinculos de fazenda, para reduzir erros operacionais e refletir no frontend as regras reais de permissao do sistema.

---

## ✅ Criterios de Aceite

### Cenario 1 - Modal com selecao de fazendas
**Dado** que o modal de usuario esta aberto
**Quando** informo tipo e dados do usuario
**Entao** posso pesquisar, selecionar e remover fazendas vinculadas via chips.

### Cenario 2 - Validacao por role
**Dado** que o tipo e `FUNCIONARIO`
**Quando** tento salvar sem fazendas
**Entao** o frontend bloqueia submit e mostra mensagem clara.

### Cenario 3 - Criacao em chamada unica
**Dado** que clico em salvar no modo criacao
**Quando** os dados sao enviados
**Entao** a mutacao cria usuario com telefone e fazendas sem segunda chamada de update.

### Cenario 4 - Tabela sem autoexclusao
**Dado** que a linha representa o usuario logado
**Quando** a tabela renderiza acoes
**Entao** o botao de excluir nao aparece para essa linha.

---

## ⚙️ Integracao Tecnica

### UserFormModal.jsx (EXISTENTE - MODIFICAR)

Comportamento existente (nao alterar base):
- formulario de create/edit com campos de usuario

NOVO a adicionar:
- campo de busca de fazendas
- lista de sugestoes/selecionador
- chips de fazendas vinculadas
- comportamento condicional por `role`

### userFormValidation.js (EXISTENTE - MODIFICAR)

Funcao existente (nao alterar assinatura):
- `validateUsuarioFormForSubmit(form, mode, editUserId)`

NOVO a adicionar:
- `fazendaIds` no draft
- validacao condicional por role (`FUNCIONARIO` exige >= 1)
- payload de create/update incluindo `fazendaIds`

### GerenciarUsuarios.jsx (EXISTENTE - MODIFICAR)

Fluxo existente (nao alterar base):
- abertura/fechamento de modais
- submit create/edit/delete

NOVO a adicionar:
- carregar lista de fazendas para o modal
- enviar payload unico com `telefone` + `fazendaIds`

### useUsuarioQueries.js (EXISTENTE - MODIFICAR)

Hooks existentes (nao alterar):
- `useUsuarioListQuery`
- `useCreateUsuarioMutation`
- `useUpdateUsuarioMutation`
- `useDeleteUsuarioMutation`

Evolucoes:
- `useCreateUsuarioMutation` sem fallback de segunda chamada para telefone
- create/update enviando `fazendaIds`
- manter invalidacao de lista apos mutacoes

### auth.service.js (web) (EXISTENTE - MODIFICAR)

Metodo existente (nao alterar nome):
- `cadastroUsuario({ nome, email, senha, role })`

Evolucao:
- aceitar e enviar `telefone` e `fazendaIds`

### usuario.service.js (web) (EXISTENTE - MODIFICAR)

Metodos existentes (nao alterar):
- `listarUsuarios()`
- `buscarUsuario(id)`
- `atualizarUsuario(id, payload)`
- `excluirUsuario(id)`

Evolucao:
- update com `fazendaIds`

### UsuariosTable.jsx (EXISTENTE - MODIFICAR)

Comportamento existente (nao alterar base):
- tabela com acoes de editar/excluir

NOVO a adicionar:
- ocultar acao de excluir para o proprio usuario logado
- opcional: mostrar resumo de fazendas vinculadas na linha ou detalhe

### Endpoint consumidos

- `POST /api/auth/cadastro`
- `GET /api/usuarios`
- `GET /api/usuarios/:id`
- `PUT /api/usuarios/:id`
- `DELETE /api/usuarios/:id`

---

## 🚫 Regras de Negocio

- Frontend nao substitui validacao de backend.
- Nao permitir submit de `FUNCIONARIO` sem fazenda vinculada.
- Nao exibir opcao de autoexclusao.
- Dados de fazendas vinculadas devem guiar o escopo de selecao em Lucros/Colheitas.

---

## 🔁 Impacto em Cards Dependentes

Este fix altera a premissa dos cards:
- `[EPIC] Refinamento-Tela-de-Lucros`
- `[EPIC] Refinamento-Tela-de-Colheitas`

Atualizacao esperada nas historias desses modulos:
- trocar premissa de `usuario.fazenda_id` unico por vinculo multiplo (`fazendaIds`/`usuarios_fazendas`);
- manter listagem e criacao sempre restritas ao conjunto de fazendas vinculadas;
- pre-selecionar fazenda automaticamente quando houver apenas 1 vinculada.

Status da atualizacao (25/04/2026):
- Premissa de vinculo multiplo aplicada nos fluxos de usuarios e no placeholder de Colheitas.
- Modulo de Lucros continua aguardando implementacao funcional para receber a mesma regra em UI.

---

## 🧪 Validacao Integrada

- Criar `FUNCIONARIO` com 2 fazendas vinculadas.
- Editar usuario e substituir conjunto de fazendas.
- Confirmar retorno da API sem `senha` e com `fazendasVinculadas`.
- Confirmar frontend sem fluxo em duas chamadas para telefone.
- Confirmar bloqueio de autoexclusao na tabela.
- Confirmar comportamento de escopo em Lucros/Colheitas apos integracao.

---

## 🛠️ Refinamento

- **Decisao Arquitetural:** manter fonte de verdade no vinculo N:N `usuarios_fazendas`.
- **Estado Global:** continuar com TanStack Query para dados remotos e form-state local no modal.
- **Validacao:** reforcar Zod no backend e validacao de submit no frontend para coerencia de UX + regra de negocio.