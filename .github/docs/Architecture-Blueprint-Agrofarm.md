# Blueprint de Arquitetura - Agrofarm

Data: 2026-04-19

## 1) Contexto do sistema (C4 - Context)

### Objetivo de negocio
Plataforma web para gestao agricola de fazendas, com foco em organizacao operacional, controle de gastos, colheitas, estoque/insumos e gestao de usuarios.

### Atores
- Administrador: gerencia usuarios, configuracoes e dados da operacao.
- Funcionario: registra e consulta operacoes permitidas (ex.: gastos e colheitas).
- Gestor/Produtor: acompanha indicadores e operacao consolidada.

### Sistemas externos
- Banco PostgreSQL (persistencia principal via Prisma).
- Provedor de e-mail (fluxos de recuperacao de senha).
- Provedores de cotacao (integracao atual/planejada para dados de mercado).

### Fronteiras
- Frontend SPA React/Vite (`Codigo/Agrofarm/web`)
- Backend API Express (`Codigo/Agrofarm/api`)
- Banco de dados PostgreSQL

## 2) Arquitetura de containers e componentes

## 2.1 Containers

### Web (React + Vite)
Responsavel por autenticacao, roteamento protegido, UX dos modulos de dominio e consumo da API.

Camadas:
- `pages/`: telas por dominio (Login, Gastos, Usuarios etc.).
- `components/`: componentes reutilizaveis.
- `queries/`: hooks de dados (TanStack Query).
- `services/`: clientes HTTP e servicos de dominio.
- `store/`: estado global (sessao/prefs) com Zustand.
- `routes/`: protecao por perfil (`ProtectedRoute.jsx`: `PrivateRoute` e `AdminRoute`).

Sessao no Web: interceptor Axios trata **401** limpando a sessao e redirecionando para `/login`, exceto em `/login`, `/recuperar-senha`, `/redefinir-senha` e na chamada `POST /auth/login`.

### API (Node.js + Express)
Responsavel por regras de negocio, autenticacao/autorizacao, validacao, persistencia e integracoes.

Camadas:
- `routes/`: definicao dos endpoints e middlewares.
- `controllers/`: orquestracao de request/response.
- `services/`: regras de negocio e casos de uso.
- `repositories/`: acesso ao banco (Prisma).
- `schemas/`: validacoes (Zod).
- `middlewares/`: auth, autorizacao, tratamento de erro, validacao.
- `jobs/`: tarefas agendadas (node-cron).
- `shared/`: logger, JWT, utilitarios e adaptadores externos.

### Banco de dados (PostgreSQL)
Entidades de dominio modeladas no Prisma (`fazendas`, `usuarios`, `gastos`, `colheitas`, etc.), com migracoes e seed inicial de admin.

## 2.2 Decisoes arquiteturais recomendadas
- Manter API stateless com JWT de curta expiracao + refresh token rotacionavel.
- Padronizar contratos REST versionados (`/api/v1`).
- Consolidar DTOs/validacoes por modulo para evitar divergencia entre front e API.
- Isolar integracoes externas por adaptadores para facilitar testes e fallback.

## 3) Fluxos principais de dados

## 3.1 Autenticacao
1. Usuario envia credenciais no Web.
2. API valida credenciais (bcrypt) e emite JWT.
3. Web persiste sessao com **um unico** store Zustand (`store/authStore.js`, persist em `localStorage` chave `agrofarm-auth`): `token` + `usuario` (sem store paralelo de sessao).
4. Requests subsequentes enviam token via interceptor Axios.
5. Middleware valida token e perfil antes de acessar recursos.

### Recuperacao de senha (Web + API)
1. `POST /api/auth/esqueci-senha` com email — tela `/recuperar-senha`.
2. E-mail com link `/redefinir-senha?token=...` (base URL via `WEB_APP_URL` / `CORS_ORIGIN`, ver secao 3.2).
3. `POST /api/auth/redefinir-senha` com `{ token, novaSenha }` — tela `/redefinir-senha`.

## 3.2 CRUD de entidades (usuarios, fazendas, gastos)
1. Tela envia payload validado no client.
2. Controller delega para service.
3. Service aplica regras de negocio (escopo por fazenda, perfil, consistencia).
4. Repository persiste via Prisma.
5. API responde DTO padronizado; Web atualiza cache React Query.

### Escopo e perfil (implementacao atual na API)
- **Fazendas**: `ADMIN` lista todas e pode criar, atualizar e excluir. `FUNCIONARIO` lista apenas fazendas vinculadas em `usuarios_fazendas` e pode ler detalhes e gerir **culturas da fazenda** (`fazenda_culturas`) somente nessas fazendas.
- **Culturas (catalogo global)**: leitura para qualquer usuario autenticado; criacao, edicao e exclusao apenas `ADMIN`.
- **Validacao de body**: middleware Zod usa `ZodError.issues` (Zod 3).
- **Links em e-mail**: usar `WEB_APP_URL` no `.env` quando `CORS_ORIGIN` for uma lista; caso contrario a primeira origem de `CORS_ORIGIN` e usada como fallback.

## 3.3 Cotacoes
1. Job periodico ou endpoint on-demand coleta dados externos.
2. Service normaliza dados e armazena snapshot.
3. Front consulta historico e ultima cotacao por cultura.
4. Fallback: em indisponibilidade externa, usa ultimo snapshot valido.

## 3.4 Colheitas
1. Usuario registra evento de colheita (quantidade, data, cultura, fazenda).
2. API valida consistencia temporal e relacao com fazenda/cultura.
3. Persistencia no banco e atualizacao de agregados (indicadores).
4. Front exibe lista e consolidado para acompanhamento.

## 4) Topologia de deploy

## 4.1 Desenvolvimento
- Web: `vite dev` local.
- API: `node --watch` local.
- DB: PostgreSQL local ou remoto de dev.
- Observacao: CORS aberto apenas para origem de dev.

## 4.2 Staging
- Web buildado e servido por CDN/host estatico.
- API containerizada com variaveis de ambiente segregadas.
- Banco dedicado de staging com mascara de dados sensiveis.
- Telemetria ativa (logs estruturados, traces e metricas basicas).

## 4.3 Producao
- Web em CDN + cache agressivo de assets.
- API em 2+ replicas atras de load balancer.
- PostgreSQL gerenciado com backup automatico e PITR.
- Segredos em cofre gerenciado; TLS ponta a ponta.
- Jobs em worker separado (quando volume crescer).

## 5) Requisitos nao funcionais (NFR)

### Seguranca
- JWT curto, refresh rotativo e invalidacao em logout sensivel.
- RBAC por perfil (ADMIN/FUNCIONARIO) com autorizacao no backend.
- Rate limit por IP/rota, helmet e sanitizacao de input.
- Politica de senha forte e trilha de auditoria para acoes administrativas.

### Observabilidade
- Logs JSON com correlation-id por request.
- Dashboards com latencia p95/p99, taxa de erro e throughput.
- Alertas para erro 5xx, aumento de latencia e falha em jobs.

### Escalabilidade
- API stateless para escalar horizontalmente.
- Uso de cache para consultas de leitura frequente (ex.: cotacoes).
- Paginacao e filtros no backend para listas grandes.

### Confiabilidade
- Timeouts e retries com backoff em integracoes externas.
- Circuit breaker para dependencia de cotacoes/e-mail.
- Backup testado e plano de restauracao.

## 6) Roadmap faseado

### Fase 1 (0-4 semanas) - Estabilizacao do core
- Concluir API de gastos e integrar tela de gastos (remover mock).
- Padronizar resposta de erros e contratos DTO.
- Fechar testes de integracao para auth e usuarios.

### Fase 2 (4-8 semanas) - Dominio operacional
- Entregar modulo de fazendas e colheitas ponta a ponta.
- Introduzir snapshots de cotacao com fallback.
- Instrumentar observabilidade minima (logs + metricas + alertas).

### Fase 3 (8-12 semanas) - Prontidao de producao
- CI/CD completo (lint, test, build, deploy).
- Hardening de seguranca (cookies seguros, rotacao de segredos, auditoria).
- Escalabilidade inicial (replicas API, cache seletivo).

## 7) Riscos e mitigacao
- Divergencia entre front e API: mitigar com contrato versionado e testes de contrato.
- Crescimento de complexidade no dominio: mitigar com modularizacao por bounded context.
- Dependencia de servicos externos (cotacao/e-mail): mitigar com fallback e retentativas.
- Baixa cobertura de testes: mitigar com meta minima por modulo critico.

## 8) Indicadores de sucesso
- Tempo medio de resposta API < 300 ms (p95 em rotas de leitura).
- Taxa de erro 5xx < 1%.
- Cobertura de testes em modulos criticos >= 70%.
- Reducao de retrabalho por inconsistencias front/API.

## 9) Proximos artefatos recomendados
- Diagrama C4 (Context/Container/Component) em Mermaid ou Draw.io.
- ADRs das decisoes centrais (auth, contratos, deploy).
- Matriz de permissao por papel e endpoint.

