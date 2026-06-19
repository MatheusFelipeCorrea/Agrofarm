# [EPIC] Tela Fazenda Selecionada

Tipo:        Epic
Prioridade:  🔼 High
Sprint:      (preencher)
Categoria:   Frontend, Backend, Banco de Dados, UX
Relator:     (preencher)
Pai:         (sem pai)
Data Limite: (preencher)

## 📌 Status Auditado no Codigo (25/04/2026)

- Base de dados de fazendas/culturas/vinculos (`fazendas`, `culturas`, `fazenda_culturas`) existe no schema. (CONCLUIDO)
- Backend de fazendas e de culturas por fazenda existe (controllers/services/repositories/routes/schemas/views). (CONCLUIDO)
- Frontend de fazendas ja possui tela de listagem e tela de detalhe com fluxo base de visualizar, editar fazenda e vincular/editar/remover cultura. (CONCLUIDO)
- Colunas de soft delete `deletado_em` e `deletado_por` ja existem em `fazenda_culturas`. (CONCLUIDO)
- Ainda faltam o indice parcial de ativos, o fluxo em duas etapas com resumo de impacto e a exclusao logica real do vinculo em vez de remocao definitiva. (PENDENTE)

## 📝 Descrição

Como equipe de produto, queremos refinar a tela de Fazenda Selecionada para permitir visualização consistente para todos os usuários autenticados e edição controlada para `ADMIN`, com gestão de culturas e fluxo seguro de exclusão em duas etapas, incluindo aviso claro de impacto em cascata.

## 🎯 Objetivos

- Exibir detalhes da fazenda ao clicar na linha da tabela.
- Permitir edição dos dados da fazenda apenas para `ADMIN`.
- Exibir tabela de culturas vinculadas com nome, hectares, status e ações.
- Restringir ações de edição/exclusão de cultura para não `ADMIN`.
- Implementar exclusão lógica com cascata lógica e aviso explícito.

## 🚫 Fora de Escopo

- Excluir fazenda nesta tela.
- Criar/editar cadastro global de cultura nesta tela.
- Alterar regras de segurança de módulos fora de Fazendas.

## ✅ Critérios de Aceite

- Tela de detalhe abre ao clicar na fazenda.
- `ADMIN` consegue editar dados da fazenda.
- Não `ADMIN` visualiza sem editar/deletar cultura.
- Exclusão de cultura funciona em duas etapas.
- Exclusão usa soft delete com cascata lógica e aviso de impacto.
- Não existe ação de excluir fazenda na tela de Fazenda Selecionada.
- Edição de cultura nesta tela altera apenas o vínculo `fazenda_culturas` (hectares/status), sem alterar o cadastro global em `culturas`.

## 📦 Sub-issues

- [STORY BANCO DE DADOS] Fazenda Selecionada — Soft Delete e Cascata Lógica
- [STORY BACKEND] Fazenda Selecionada — Regras, Permissões e Endpoints
- [STORY FRONTEND] Fazenda Selecionada — Tela, Modais e Fluxo de Exclusão
- [FIX] Limites de Escopo — Cultura Global x Cultura na Fazenda

---

# [STORY BANCO DE DADOS] Fazenda Selecionada — Soft Delete e Cascata Lógica

Como sistema, eu quero registrar exclusões de vínculo fazenda/cultura via soft delete e aplicar cascata lógica controlada, para manter histórico e evitar perda irreversível de dados.

## 🧱 Escopo Técnico
- Adicionar colunas de soft delete no vínculo de cultura da fazenda.
- Garantir que consultas padrão retornem apenas registros ativos.
- Preparar base para cascata lógica em entidades relacionadas.

## SQL a executar

```sql
ALTER TABLE fazenda_culturas
ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS deletado_por UUID;

CREATE INDEX IF NOT EXISTS idx_fazenda_culturas_ativas
ON fazenda_culturas (fazenda_id, cultura_id)
WHERE deletado_em IS NULL;
```

## 🗄️ Checklist — Banco de Dados

Marque conforme você executar cada comando no BD:

- [x] SQL-1: `ALTER TABLE fazenda_culturas ADD COLUMN deletado_em / deletado_por` (CONCLUIDO no schema local)
- [X] SQL-2: `CREATE INDEX idx_fazenda_culturas_ativas`
- [X] Execute: `npm run db:generate`

**Nota:** A estrutura base de `fazenda_culturas` e as colunas de soft delete ja existem no schema local. Ainda faltam o indice parcial de ativos e a logica completa de consumo desse soft delete.

## Pós-SQL
- `npm run db:generate`

## ✅ Critérios de Aceite
- Vínculo fazenda/cultura é removido logicamente.
- Consultas ativas ignoram registros com `deletado_em`.
- Estrutura permite cascata lógica nas camadas superiores.

---

# [STORY BACKEND] Fazenda Selecionada — Regras, Permissões e Endpoints

Como API, eu quero expor e proteger operações de detalhe/edição da fazenda e exclusão lógica de cultura por perfil, para que o frontend respeite permissões e regras de negócio.

## 🛠️ Implementação

### src/controllers/fazenda.controller.js (EXISTENTE — MODIFICAR)
Métodos novos:
- `getImpactoExclusaoCultura()`
- `softDeleteCulturaDaFazenda()`

### src/services/fazenda.service.js (EXISTENTE — MODIFICAR)
- Validar permissão: apenas `ADMIN` para editar fazenda e excluir/editar cultura
- Gerar resumo de impacto da exclusão
- Executar soft delete no vínculo cultura/fazenda
- Aplicar cascata lógica conforme domínio

### src/repositories/fazenda.repository.js (EXISTENTE — MODIFICAR)
Métodos novos:
- `buscarImpactoExclusaoCultura(fazendaId, culturaId)`
- `softDeleteCulturaDaFazenda(fazendaId, culturaId, usuarioId)`
- `listarCulturasAtivasDaFazenda(fazendaId)`

### src/routes/fazenda.routes.js (EXISTENTE — MODIFICAR)
Rotas novas:
- `GET /api/fazendas/:fazendaId/culturas/:culturaId/impacto-exclusao`
- `DELETE /api/fazendas/:fazendaId/culturas/:culturaId`

## ✅ Critérios de Aceite
- Não `ADMIN` recebe bloqueio para editar fazenda e cultura.
- `ADMIN` consegue editar fazenda.
- Endpoint de impacto retorna aviso para o frontend.
- Exclusão de cultura usa soft delete e respeita cascata lógica.
- Erros seguem padrão da API.

---

# [STORY FRONTEND] Fazenda Selecionada — Tela, Modais e Fluxo de Exclusão

Como usuário autenticado, eu quero abrir a fazenda selecionada ao clicar na tabela e visualizar seus dados; como `ADMIN`, quero editar a fazenda e gerenciar culturas com segurança.

Regra explícita:
- NÃO existe possibilidade de excluir fazenda nessa tela.

## 🎨 Escopo Visual/UX
- Tela de detalhe com: nome da fazenda, localização, hectares, culturas e tipo.
- Tabela de culturas com: nome, hectares na fazenda, status e ações.
- Modais seguem o layout validado.
- Fluxo de exclusão de cultura em 2 etapas:
  - digitar nome da cultura;
  - confirmar exclusão final com aviso de impacto em cascata.

## ⚙️ Integração Técnica

### src/pages/Fazendas/Fazendas.jsx (EXISTENTE — MODIFICAR)
- Tornar linha da tabela clicável para abrir detalhe.
- Renderizar ações condicionais por papel do usuário.

### src/services/fazenda/fazenda.service.js (EXISTENTE — MODIFICAR)
Métodos novos:
- `buscarImpactoExclusaoCultura(fazendaId, culturaId)`
- `softDeleteCulturaDaFazenda(fazendaId, culturaId)`

### src/queries/fazenda/useFazendaQueries.js (EXISTENTE — MODIFICAR)
Hooks novos:
- `useGetImpactoExclusaoCultura(fazendaId, culturaId)`
- `useSoftDeleteCulturaDaFazenda()`

### src/components/shared/FazendaSelecionada/ (NOVO — CRIAR)
Criar componentes para:
- cartão de detalhe da fazenda
- tabela de culturas
- modal editar fazenda
- modal editar vínculo de cultura na fazenda (hectares/status)
- modal etapa 1 da exclusão
- modal etapa 2 da exclusão

## ✅ Critérios de Aceite
- Clique na fazenda abre detalhe.
- Dados principais aparecem corretamente.
- `ADMIN` vê ações de edição/exclusão.
- Não `ADMIN` não vê ações de editar/deletar cultura.
- Exclusão exige 2 etapas e mostra aviso de impacto.
- Após mutações, lista e detalhe sincronizam via invalidation.

## ⚠️ Observação

Este épico depende de uma base mínima do módulo de Fazendas. Como o arquivo da página principal de fazendas existe vazio hoje, o backlog precisa considerar também a listagem/entrada da tela para que o fluxo de clique na linha realmente exista.

Além disso, o layout mistura operações de vínculo de cultura com operações de cadastro global de cultura. Para evitar ambiguidade de regra de negócio, a separação fica registrada no fix dedicado de limites de escopo.
