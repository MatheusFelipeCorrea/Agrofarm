# [FIX] Limites de Escopo — Cultura Global x Cultura na Fazenda

Tipo:        Fix
Prioridade:  🔼 High
Sprint:      3
Categoria:   Produto, Backend, Frontend, Regras de Negócio
Relator:     (preencher)
Pai:         [EPIC] Tela Fazenda Selecionada
Data Limite: (preencher)

## 📌 Status Auditado no Codigo (25/04/2026)

- Separacao estrutural entre `culturas` (catalogo global) e `fazenda_culturas` (vinculo por fazenda) esta no schema. (CONCLUIDO)
- Restricao de unicidade por (`fazenda_id`, `cultura_id`) em `fazenda_culturas` esta aplicada. (CONCLUIDO)
- O fluxo de detalhe da fazenda usa endpoints e queries especificos para vinculo (`/fazendas/:id/culturas`) e ja altera hectares/status no contexto da fazenda. (CONCLUIDO)
- A clareza total de produto/UI segue parcial porque o catalogo global de culturas ainda e gerenciado na mesma area funcional de Fazendas. (PENDENTE)

## 📝 Descrição

Como time de produto e engenharia, precisamos separar claramente o que é operação no cadastro global de culturas e o que é operação no vínculo da cultura com uma fazenda, para evitar ambiguidade de regra, retrabalho e inconsistência de dados.

## 🔎 Problema

O layout inclui fluxos de:
- adicionar/editar cultura na fazenda;
- criar/editar cultura (catálogo global).

Sem separação explícita, a implementação pode misturar:
- edição de `culturas` (entidade global);
- edição de `fazenda_culturas` (entidade de vínculo por fazenda).

## ✅ Decisão de Escopo

### Tela Fazenda Selecionada
Pode fazer:
- vincular cultura existente à fazenda;
- editar campos do vínculo (hectares na fazenda e status);
- remover vínculo por soft delete em duas etapas.

Não pode fazer:
- criar nova cultura global;
- editar nome/cor/hectares globais de cultura;
- excluir cultura global.

### Cadastro Global de Culturas
Fica em card próprio (épico ou story dedicado), fora da Tela Fazenda Selecionada.

## ✅ Critérios de Aceite

### Cenário 1 — Edição na tela selecionada
**Dado** que estou na tela de uma fazenda
**Quando** edito uma cultura dessa fazenda
**Então** apenas os dados do vínculo `fazenda_culturas` são alterados.

### Cenário 2 — Integridade do cadastro global
**Dado** que existe cultura no catálogo global
**Quando** operações da tela de fazenda acontecem
**Então** nome/cor/hectares globais de `culturas` permanecem intactos.

### Cenário 3 — UI sem ambiguidade
**Dado** que o usuário abre modais da tela de fazenda
**Quando** visualiza os formulários
**Então** fica claro que ele está gerenciando vínculo da cultura com a fazenda, não o cadastro global.

### Cenário 4 — Endpoint coerente
**Dado** que o frontend envia atualização de cultura na fazenda
**Quando** backend processa a operação
**Então** o endpoint e payload refletem regra de vínculo e não operação global de cultura.

## 📂 Arquivos-Alvo de Refinamento

### Frontend
- `Codigo/Agrofarm/web/src/components/shared/FazendaSelecionada/`
- `Codigo/Agrofarm/web/src/pages/Fazendas/Fazendas.jsx`
- `Codigo/Agrofarm/web/src/services/fazenda/fazenda.service.js`

### Backend
- `Codigo/Agrofarm/api/src/controllers/fazenda.controller.js`
- `Codigo/Agrofarm/api/src/services/fazenda.service.js`
- `Codigo/Agrofarm/api/src/repositories/fazenda.repository.js`
- `Codigo/Agrofarm/api/src/routes/fazenda.routes.js`

## 🧭 Resultado Esperado

Ao fechar este fix, a sprint 3 começa sem dúvida de modelagem e sem conflito entre regras de cultura global e cultura por fazenda.