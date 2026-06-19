# [ANALISE] Revisão de Cards e FIXes

## 📌 Status Auditado no Codigo (25/04/2026)

- Documento de analise/revisao de backlog mantido e atualizado no repositorio. (CONCLUIDO)
- Nao representa por si so item implementado de produto; a implementacao efetiva esta nos cards e no codigo. (CONCLUIDO)

## Objetivo

Consolidar a revisão entre:
- cards refinados anteriormente no repositório;
- cards novos trazidos pelo time;
- estado real do código atual.

## Cards recebidos do time

- [EPIC] Autenticação e Controle de Acesso
- [EPIC] Tela Fazenda Selecionada
- Histórias de Gerenciar Usuários associadas ao épico de autenticação

## Compatibilidade com o backlog já criado

### 1. Gerenciar Usuários
Situação:
- O módulo já existe implementado no código.
- O card original do time cobre CRUD básico.
- O backlog refinado depois ganhou uma nova regra estrutural: um usuário pode estar vinculado a uma ou mais fazendas.

Impacto:
- O card original de Gerenciar Usuários não é mais suficiente sozinho.
- O fix [FIX] Gerenciar-Usuarios-Vinculo-com-Fazendas.md passa a ser obrigatório e substitui parte do fluxo original.

Decisão:
- manter o card do time como base visual e CRUD;
- tratar vínculo com fazendas como correção mandatória sobre ele.

### 2. Autenticação
Situação:
- O backend de autenticação já existe com `login`, `cadastro`, `logout`, `esqueci-senha`, `redefinir-senha` e `GET /auth/me`.
- O frontend já possui `Login`, `RecuperarSenha`, `RedefinirSenha`, `PublicRoute`, `PrivateRoute`, `AdminRoute` e hidratação de sessão.
- O fluxo aprovado pelo time foi majoritariamente absorvido pela implementação atual.

Impacto:
- o fix complementar continua válido como rastreio de escopo;
- as divergências principais de rotas públicas, recuperação de senha e logout já foram resolvidas no repositório;
- o fluxo agora conversa com a sidebar dinâmica via `menu` retornado pelo backend.

Decisão:
- manter o épico de Autenticação;
- manter o fix complementar para registrar o que foi alinhado, mas com status concluído no código atual.

### 3. Tela Fazenda Selecionada
Situação:
- O domínio de `fazendas`, `culturas` e `fazenda_culturas` existe no schema.
- As páginas `Fazendas.jsx` e `FazendaDetalhe.jsx` existem com fluxo real de listagem, detalhe e manutenção base.
- Controller e service de fazenda no backend existem implementados, incluindo acesso por perfil.
- O que segue pendente é o refinamento de soft delete/cascata lógica e o resumo de impacto antes da exclusão.

Impacto:
- o épico é válido e necessário;
- ele deixou de ser criação do zero e passou a ser refinamento sobre uma base já funcional;
- ele ainda deve entrar antes dos épicos que dependem de detalhe seguro por fazenda.

Decisão:
- incluir o épico no roadmap antes do núcleo operacional;
- registrar necessidade de concluir soft delete, impacto de exclusão e regras finais da tela de detalhe.

## FIXes que devem ser abertos ou mantidos

### FIX obrigatório já existente
- [FIX] Gerenciar-Usuarios-Vinculo-com-Fazendas.md

### FIX obrigatório já existente
- [FIX] Sidebar-Menu-Dinamico-por-Permissao.md

### FIX novo identificado nesta revisão
- [FIX] Autenticacao-Frontend-Rotas-Sessao-e-Recuperacao.md

## Onde mexer no código

### Autenticação
Frontend:
- `Codigo/Agrofarm/web/src/App.jsx`
- `Codigo/Agrofarm/web/src/routes/ProtectedRoute.jsx`
- `Codigo/Agrofarm/web/src/pages/Auth/Login.jsx`
- `Codigo/Agrofarm/web/src/services/auth/auth.service.js`
- `Codigo/Agrofarm/web/src/store/authStore.js`

Backend:
- `Codigo/Agrofarm/api/src/controllers/auth.controller.js`
- `Codigo/Agrofarm/api/src/services/auth.service.js`
- `Codigo/Agrofarm/api/src/routes/auth.routes.js`

### Gerenciar Usuários
Frontend:
- `Codigo/Agrofarm/web/src/pages/Usuarios/GerenciarUsuarios.jsx`
- `Codigo/Agrofarm/web/src/components/usuarios/UserFormModal.jsx`
- `Codigo/Agrofarm/web/src/components/usuarios/UsuariosTable.jsx`

Backend:
- `Codigo/Agrofarm/api/src/controllers/usuario.controller.js`
- `Codigo/Agrofarm/api/src/services/usuario.service.js`
- `Codigo/Agrofarm/api/src/routes/usuario.routes.js`

### Fazendas
Frontend:
- `Codigo/Agrofarm/web/src/pages/Fazendas/Fazendas.jsx`
- `Codigo/Agrofarm/web/src/components/shared/FazendaSelecionada/` (novo)
- `Codigo/Agrofarm/web/src/queries/fazenda/` (novo ou complementar)
- `Codigo/Agrofarm/web/src/services/fazenda/` (novo ou complementar)

Backend:
- `Codigo/Agrofarm/api/src/controllers/fazenda.controller.js`
- `Codigo/Agrofarm/api/src/services/fazenda.service.js`
- `Codigo/Agrofarm/api/src/repositories/fazenda.repository.js`
- `Codigo/Agrofarm/api/src/routes/fazenda.routes.js`
- `Codigo/Agrofarm/api/prisma/schema.prisma`

## Recomendação de backlog após a revisão

1. Fechar autenticação base e sessão.
2. Fechar fix de vínculo entre usuários e fazendas.
3. Fechar fix de sidebar dinâmica por permissão.
4. Fechar módulo de Fazendas com tela selecionada e gestão de culturas.
5. Só depois avançar com Colheitas, Lucros e Gastos como base operacional.
