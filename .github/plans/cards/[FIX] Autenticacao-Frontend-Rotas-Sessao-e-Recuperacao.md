# [FIX] Autenticação Frontend — Rotas, Sessão e Recuperação

Tipo:        Fix
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Frontend, UX, Segurança
Relator:     (preencher)
Pai:         [EPIC] Autenticação e Controle de Acesso
Data Limite: (preencher)

## 📌 Status Auditado no Codigo (25/04/2026)

- Telas de autenticacao `Login`, `RecuperarSenha` e `RedefinirSenha` existem no frontend. (CONCLUIDO)
- Service frontend de auth expõe `login`, `cadastroUsuario`, `esqueciSenha`, `redefinirSenha`, `obterSessaoAtual` e `logout`. (CONCLUIDO)
- Endpoints backend de auth (`/login`, `/cadastro`, `/logout`, `/esqueci-senha`, `/redefinir-senha`) existem em `auth.routes.js`. (CONCLUIDO)
- Endpoint de sessao atual `GET /api/auth/me` implementado com retorno de `usuario` + `menu` por permissao. (CONCLUIDO)
- `PublicRoute`, redirecionamento pos-login por primeira rota permitida e integracao de logout na navegacao implementados. (CONCLUIDO)
- `api/src/routes/index.js` consolidado com auth/usuarios/fazendas e demais dominios ativos. (CONCLUIDO)

## 📝 Descrição

Como equipe do produto, precisamos alinhar a implementação atual da autenticação com o fluxo aprovado de navegação e recuperação de senha, porque hoje o módulo existe de forma parcial e com comportamentos divergentes do backlog.

## 🔎 Situação Atual

- Existe tela de login implementada.
- A rota publica de autenticacao esta em `/login` com suporte a `PublicRoute`.
- O pos-login usa a primeira rota permitida pelo `menu` retornado do backend.
- As telas de recuperacao e redefinicao existem e estao integradas ao fluxo.
- O frontend sincroniza sessao por `GET /api/auth/me` e persiste `token`, `usuario` e `menu`.
- O logout esta integrado em header/sidebar com limpeza de sessao local.

## 🎯 Objetivo do Fix

- Alinhar rotas públicas e privadas com o fluxo aprovado.
- Implementar recuperação e redefinição de senha no frontend.
- Integrar logout real na navegação autenticada.
- Centralizar regras de redirecionamento pós-login e pós-logout.

## ✅ Critérios de Aceite

### Cenário 1 — Entrada pública consistente
**Dado** que o usuário não está autenticado
**Quando** acessa a aplicação
**Então** é direcionado para a tela pública correta de login.

### Cenário 2 — Redirecionamento após login
**Dado** que o login foi concluído com sucesso
**Quando** a sessão é persistida
**Então** o usuário é redirecionado para a rota inicial definida pelo produto.

### Cenário 3 — Recuperação de senha
**Dado** que o usuário esqueceu sua senha
**Quando** acessa o fluxo de recuperação
**Então** consegue requisitar nova senha e redefini-la com feedback claro.

### Cenário 4 — Logout funcional
**Dado** que o usuário está autenticado
**Quando** aciona logout no menu
**Então** a sessão local é limpa e a navegação retorna para login.

### Cenário 5 — Proteção de rotas
**Dado** que um usuário tenta acessar uma rota indevida
**Quando** a regra de proteção é avaliada
**Então** a aplicação redireciona corretamente conforme autenticação e papel.

## 📂 Arquivos Impactados

- `Codigo/Agrofarm/web/src/App.jsx`
- `Codigo/Agrofarm/web/src/routes/ProtectedRoute.jsx`
- `Codigo/Agrofarm/web/src/pages/Auth/Login.jsx`
- `Codigo/Agrofarm/web/src/pages/Auth/` (novas telas)
- `Codigo/Agrofarm/web/src/services/auth/auth.service.js`
- `Codigo/Agrofarm/web/src/store/authStore.js`
- `Codigo/Agrofarm/web/src/components/shared/Header/Header.jsx`
- `Codigo/Agrofarm/web/src/components/shared/Sidebar/Sidebar.jsx`

## ⚠️ Observação

Este fix conversa diretamente com o fix da sidebar dinâmica, porque logout, menu autenticado e carga da sessão precisam sair do mesmo fluxo de navegação.
