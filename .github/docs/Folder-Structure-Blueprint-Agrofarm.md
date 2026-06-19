# Folder Structure Blueprint - Agrofarm

Data: 2026-04-19

## Objetivo
Padronizar a estrutura de pastas do monorepo para acelerar onboarding, reduzir divergencias entre modulos e facilitar manutencao.

## 1) Snapshot atual (resumo)

- Monorepo em `Codigo/Agrofarm/` com dois apps principais:
  - `api/`: Node.js + Express + Prisma + Zod + JWT.
  - `web/`: React + Vite + React Query + Zustand.
- Documentacao concentrada em `Documentacao/`.
- Backend com padrao em camadas (`routes`, `controllers`, `services`, `repositories`, `schemas`, `middlewares`, `views`).
- Frontend com separacao por tipo tecnico (`pages`, `components`, `queries`, `services`, `store`, `styles`).

## 2) Estrutura alvo

### 2.1 Raiz do repositorio

```text
pmg-es-2026-1-ti4-3170100-agrofarm/
  Codigo/
    Agrofarm/
      api/
      web/
  Documentacao/
  Artefatos/
  Divulgacao/
  README.md
```

### 2.2 API (alvo incremental)

```text
Codigo/Agrofarm/api/
  prisma/
    schema.prisma
    migrations/
  src/
    app.js
    server.js
    config/
    routes/
      index.js
      auth.routes.js
      usuario.routes.js
      <dominio>.routes.js
    controllers/
      auth.controller.js
      usuario.controller.js
      <dominio>.controller.js
    services/
      auth.service.js
      usuario.service.js
      <dominio>.service.js
    repositories/
      auth.repository.js
      usuario.repository.js
      <dominio>.repository.js
    schemas/
      auth.schema.js
      usuario.schema.js
      <dominio>.schema.js
    views/
      usuario.view.js
      <dominio>.view.js
    middlewares/
    shared/
      errors/
      utils/
    jobs/
    tests/
  package.json
  .env.example
```

### 2.3 Web (alvo incremental)

```text
Codigo/Agrofarm/web/
  src/
    App.jsx
    main.jsx
    routes/
      ProtectedRoute.jsx
    pages/
      Auth/
      Usuarios/
      Gastos/
      <Dominio>/
    components/
      common/
      <dominio>/
    services/
      api.js
      <dominio>/
        <dominio>.service.js
    queries/
      auth/
      usuario/
      gasto/
      <dominio>/
        use<Dominio>Queries.js
    store/
      authStore.js
      index.js
    hooks/
    utils/
    constants/
    styles/
      globals.css
      <dominio>.css
  public/
  package.json
  .env.example
```

### 2.4 Documentacao

```text
Documentacao/
  README.md
  Architecture-Blueprint-Agrofarm.md
  Code-Exemplars-Blueprint-Agrofarm.md
  Folder-Structure-Blueprint-Agrofarm.md
  Diagramas-*/
  Documentos/
```

## 3) Convencoes de nomenclatura

- Arquivo de rota: `<dominio>.routes.js`
- Arquivo de controller: `<dominio>.controller.js`
- Arquivo de service: `<dominio>.service.js`
- Arquivo de repository: `<dominio>.repository.js`
- Arquivo de schema: `<dominio>.schema.js`
- Hook de query: `use<Dominio>Queries.js`
- Pasta de pagina: `pages/<Dominio>/`
- Simbolos JS:
  - `camelCase` para variaveis/funcoes.
  - `PascalCase` para componentes React.
  - constantes de query em `SCREAMING_SNAKE_CASE`.

## 4) Template de modulo (API + Web)

## 4.1 Backend

Para criar modulo `colheita`:
- `src/routes/colheita.routes.js`
- `src/controllers/colheita.controller.js`
- `src/services/colheita.service.js`
- `src/repositories/colheita.repository.js`
- `src/schemas/colheita.schema.js`
- `src/views/colheita.view.js`

Fluxo obrigatorio:
1. Route valida entrada (Zod + middleware `validate`).
2. Controller orquestra request/response.
3. Service aplica regra de negocio.
4. Repository acessa Prisma.
5. View normaliza resposta publica.

## 4.2 Frontend

Para criar modulo `colheita`:
- `src/pages/Colheitas/Colheitas.jsx`
- `src/services/colheita/colheita.service.js`
- `src/queries/colheita/useColheitaQueries.js`
- `src/components/colheita/` (se houver UI reutilizavel)
- `src/styles/colheita.css` (se necessario)

Fluxo obrigatorio:
1. Service encapsula chamadas HTTP.
2. Query hooks centralizam cache/invalidation.
3. Pagina consome hooks sem logica de acesso a API inline.

## 5) Regras de organizacao (Do / Don't)

### Do
- Manter regra de negocio no `service`.
- Manter acesso a banco apenas no `repository`.
- Manter validacao de entrada em `schema` + middleware.
- Manter consumo HTTP centralizado em `services` no frontend.
- Manter query keys estaveis por dominio.

### Don't
- Nao acessar Prisma direto em controller.
- Nao chamar `api.get/post` direto dentro de componentes de pagina.
- Nao duplicar validacoes de dominio em varios pontos.
- Nao criar nomes mistos para o mesmo modulo (ex.: `user` e `usuario`).

## 6) Plano de migracao por fases

### Fase 1 - Higiene estrutural (curto prazo)
- Garantir que todos os modulos ativos sigam nomes padrao de arquivo.
- Consolidar `routes/index.js` para registrar todos os dominios ativos.
- Revisar imports quebrados e remover arquivos mortos.

### Fase 2 - Padronizacao de modulo (medio prazo)
- Aplicar template completo em `gasto`, `colheita` e `cotacao`.
- Padronizar retorno de erro e views de resposta.
- Garantir `queries` por dominio no frontend.

### Fase 3 - Governanca (medio/longo prazo)
- Checklist obrigatorio em PR para estrutura de pastas.
- Linters/checks para bloquear violacoes de padrao.
- Atualizar documentacao tecnica a cada novo modulo.

## 7) Checklist de validacao por PR

- [ ] Arquivos seguem convencao de nomes por camada.
- [ ] Novo endpoint registrado em `src/routes/index.js`.
- [ ] Schema Zod criado/atualizado para entrada.
- [ ] Service contem regra de negocio; repository contem acesso a banco.
- [ ] Frontend usa `services` + `queries` dedicados ao dominio.
- [ ] Testes minimos adicionados ou atualizados.
- [ ] Documentacao do modulo atualizada em `Documentacao/`.

## 8) Resultado esperado
Com este blueprint, cada nova feature entra no repositorio com o mesmo desenho tecnico, diminuindo retrabalho e aumentando previsibilidade de manutencao.

