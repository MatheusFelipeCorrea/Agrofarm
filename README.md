# Agrofarm

O AgroFarm é um sistema desenvolvido com o objetivo de auxiliar o produtor rural na organização e registro das atividades de cada fazenda, reunindo em um único lugar informações sobre produção, uso de insumos, estoque, colheita e demais operações. A proposta é facilitar o acompanhamento das atividades agrícolas e permitir que ele tenha maior controle sobre tudo o que acontece na propriedade, com foco em quem ainda não utiliza nenhum método formal de organização, ajudando a registrar e estruturar essas informações de forma simples, prática e eficiente.

## Alunos integrantes da equipe

* Alice Shikida Salomão
* Fernanda Soares Oliveira Cunha
* Gabriel Lacerda Lemos da Silva
* Júlia Rocha Fiorini
* Matheus Dias Mendes
* Matheus Felipe Correa da Silva

## Professores responsáveis

* Leonardo Vilela Cardoso
* Filipe Torio Lopes Ruas Nhimi

---

## Sumário

* [Visão rápida](#visão-rápida)
* [Situação atual do repositório](#situação-atual-do-repositório)
* [Andamento por feature](#andamento-por-feature)
* [Entregas técnicas (detalhamento)](#entregas-técnicas-detalhamento)
* [Roadmap sugerido](#roadmap-sugerido)
* [Instruções de utilização](#instruções-de-utilização)

---

## Visão rápida

| Item | Resumo |
| ---- | ------ |
| **Contexto** | Projeto acadêmico TI4 — aplicação web para gestão agrícola (fazendas, gastos, colheitas, usuários). |
| **Arquitetura** | Frontend **React (Vite)** + backend **Node.js (Express)** + **PostgreSQL** via **Prisma**. |
| **Autenticação** | JWT; papéis **ADMIN** e **FUNCIONÁRIO**; rotas protegidas no web e middlewares na API. |
| **Situação atual** | **Auth**, **cadastro**, **CRUD de usuários (API + tela admin)** e **protótipo de Gastos no front (dados em memória)** estão utilizáveis. Próximo passo natural: **persistir gastos e demais domínios na API** e evoluir telas conforme o modelo de dados. |

---

## Situação atual do repositório

O repositório já contém a base técnica dos dois projetos em `Codigo/Agrofarm/` (**`api`** e **`web`**), modelagem Prisma alinhada a várias entidades do negócio (por exemplo `fazendas`, `colheitas`, `gastos`, `usuarios`), fluxo completo de **login e cadastro** com hash de senha, **gestão de usuários restrita a ADMIN** (listagem, criação via cadastro + atualização de telefone, edição e exclusão), e a tela de **Gastos** com CRUD e interface alinhada ao layout — hoje os gastos da interface usam **serviço mock em memória** no browser, **sem** endpoints dedicados na API.

> **Para desenvolvedores:** use a [tabela de andamento por feature](#andamento-por-feature) para ver o que já fecha sprint e o que ainda é dívida técnica ou backlog. A coluna **Responsável** deve ser atualizada no planning (nome sugerido ou “Equipe” quando a entrega foi colaborativa).

---

## Andamento por feature

Tabela principal: **Feature** (nome macro), **Descrição** (escopo), **Sprint** (marco sugerido), **Status**, **Responsável** (owner ou “Equipe” / “A definir”).

| Feature | Descrição | Sprint | Status | Responsável |
| ------- | --------- | ------ | ------ | ----------- |
| **Repositório e documentação** | Estrutura Git, pastas `Codigo`, `Documentacao`, `Artefatos`, READMEs por módulo. | Sprint 01 | Concluído | Matheus Felipe |
| **Modelagem de dados (Prisma)** | `schema.prisma` com entidades do domínio agrícola e de usuários; migrations iniciais. | Sprint 02 | Concluído | Matheus Felipe |
| **API — núcleo Express** | `app`, `server`, rotas, logger, tratamento de erros, validação com schemas. | Sprint 02 | Concluído | Matheus Felipe |
| **API — autenticação JWT** | `POST /auth/login`, `POST /auth/logout`, middleware `auth`, geração/validação de token. | Sprint 02 | Concluído | Matheus Felipe e Matheus Dias |
| **API — cadastro de usuário** | `POST /auth/cadastro` com BCrypt; geração de `id` (UUID) na persistência. | Sprint 02 | Concluído | Gabriel e Fernanda |
| **API — recuperação de senha** | `POST /auth/esqueci-senha` e `POST /auth/redefinir-senha` (fluxo com e-mail / Resend conforme env). | Sprint 02–03 | Concluído | Matheus Felipe |
| **API — CRUD usuários (ADMIN)** | `GET/PUT/DELETE /api/usuarios`, autorização `ADMIN`, views/serviços/repositório. | Sprint 05 | Concluído | Gabriel e Fernanda |
| **API — seed administrador** | Script `db:seed` para usuário inicial (ver `api`). | Sprint 02 | Concluído | Matheus Felipe |
| **Web — base React + Vite** | Build, ESLint, React Router, TanStack Query, Tailwind. | Sprint 03 | Concluído | Matheus Felipe |
| **Web — login** | Página de login integrada à API, armazenamento de sessão/token. | Sprint 03 | Concluído | Matheus Dias |
| **Web — rotas protegidas** | `PrivateRoute` e `AdminRoute` com base no papel do usuário. | Sprint 03–05 | Concluído | Julia Fiorini |
| **Web — layout e identidade** | `MainLayout`, header, variáveis CSS e componentes de UI reutilizáveis. | Sprint 03 | Concluído | Equipe |
| **Web — módulo Gastos (protótipo)** | Tela `Gastos`: tabela, filtros, modais criar/editar/excluir; dados **mock em memória** (sem API). | Sprint 04 | Concluído | Alice |
| **Web — gestão de usuários** | Página `GerenciarUsuarios`: listagem, criar, editar, excluir, validação, React Query, modais. | Sprint 05 | Concluído | Gabriel e Fernanda |
| **Web — CSS módulo usuários** | Folha `gerenciamento-usuarios.css` (tabela + modais em portal) desacoplada do `globals.css`. | Sprint 05 | Concluído | Fernanda |
| **API — Gastos persistidos** | Endpoints REST alinhados ao model `gastos` (CRUD, auth, regras de negócio). | Sprint 06 | Planejado | A definir |
| **Web — Gastos integrados à API** | Substituir `gasto.service` mock por chamadas HTTP à API; cache e erros unificados. | Sprint 06 | Planejado | A definir |
| **Fazendas e colheitas (produto)** | Telas e API para cadastro e consulta de fazendas/colheitas conforme modelo. | Sprint 06–07 | Planejado |Julia |
| **Lembretes / insumos** | Fluxos alinhados a `lembretes`, `insumos_atividades` no Prisma. | Sprint 07+ | Planejado | A definir |
| **Testes automatizados** | Aumentar cobertura em `api` e `web` (unitários/integração). | Sprint 06–07 | Planejado | A definir |
| **CI/CD** | Pipeline (lint, test, build) no GitHub Actions ou equivalente. | Sprint 07 | Planejado | A definir |
| **Deploy** | Publicação da API e do frontend + variáveis de ambiente em produção. | Sprint 07 | Planejado | A definir |
| **README raiz — instruções finais** | Substituir placeholder de utilização por passo a passo único (clone, `.env`, subir api + web). | Sprint 07 | Em andamento | Equipe |

**Legenda de status:** `Concluído` · `Em andamento` · `Planejado` · `Bloqueado` (use quando dependência externa impedir a sprint).

---

## Entregas técnicas (detalhamento)

Checklist fino para localizar trabalho no código (similar ao “Entregas concretas já implementadas” do projeto de referência).

| Entrega | Status |
| ------- | ------ |
| Monorepo `Codigo/Agrofarm` (`api` + `web`) | Concluído |
| Prisma Client + `DATABASE_URL` / `DIRECT_URL` | Concluído |
| Rotas ` /api/auth/*` (login, cadastro, logout, esqueci/redefinir senha) | Concluído |
| Rotas ` /api/usuarios` protegidas (JWT + role ADMIN) | Concluído |
| Middlewares: `auth`, `authorize`, `validate`, `error` | Concluído |
| Repositórios `auth.repository`, `usuario.repository` | Concluído |
| Serviços `auth.service`, `usuario.service` | Concluído |
| Hash BCrypt e utilitários JWT | Concluído |
| `App.jsx`: rotas `/`, `/gastos`, `/usuarios` | Concluído |
| Páginas `Login`, `Gastos`, `GerenciarUsuarios` | Concluído |
| Queries React Query (`useUsuarioQueries`, `useGastoQueries`) | Concluído |
| Serviços web: `auth` + API real; `gasto` mock in-memory | Concluído (gasto parcial) |
| Componentes de usuários: `UserFormModal`, `DeleteUserModal`, `UsuariosTable` | Concluído |
| Hook `useDialogEscapeAndScrollLock` | Concluído |
| Estilos globais de tabela gastos em `globals.css` | Concluído |
| Estilos de usuários em `styles/gerenciamento-usuarios.css` | Concluído |
| Endpoints REST de gastos na API Express | Planejado |
| Migrações / seeds adicionais para dados de demonstração agrícola | Planejado |
| Testes E2E ou integração front + API | Planejado |

---

## Roadmap

Ordem para próximas sprints (alinhar com o backlog do board):

| Sprint | Foco principal |
| ------ | -------------- |
| **Sprint 06** | API de gastos + integração na tela `Gastos`; alinhar DTOs ao Prisma. |
| **Sprint 07** | Fazendas/colheitas (mínimo viável); qualidade (testes + CI); documentação e deploy. |
| **Sprint 08+** | Lembretes, insumos, relatórios e refinamentos de UX. |

---

## Instruções de utilização

### Backend (API)

```bash
cd Codigo/Agrofarm/api
npm install
cp .env.example .env
npm run db:generate
npm run dev
```

API em `http://localhost:3333`.

### Frontend (Web)

```bash
cd Codigo/Agrofarm/web
npm install
cp .env.example .env
npm run dev
```

Web em `http://localhost:5173`.

### Documentação detalhada

- Backend: `Codigo/Agrofarm/api/Documents/Readme.md`
- Frontend: `Codigo/Agrofarm/web/Documents/Readme.md`
