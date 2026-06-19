# Copilot Instructions Blueprint - Agrofarm

Data: 2026-04-19

## Objetivo
Definir um padrao de instrucoes para uso de agentes Copilot no projeto, garantindo respostas consistentes com a arquitetura, convencoes e qualidade esperada.

## 1) Escopo

Este blueprint cobre:
- Como descrever contexto de negocio e contexto tecnico.
- Regras de implementacao para `api` e `web`.
- Criterios minimos de testes e validacao.
- Checklist de PR orientado por qualidade.
- Padroes de prompt para tarefas recorrentes.

Este blueprint nao cobre:
- Politicas institucionais fora do repositorio.
- Processo formal de release/gestao de mudanca.

## 2) Contexto do projeto (base para instrucoes)

- Monorepo principal em `Codigo/Agrofarm/`.
- Backend em `Codigo/Agrofarm/api`:
  - Node.js + Express.
  - Prisma para persistencia.
  - Zod para validacao.
  - JWT para autenticacao e RBAC.
- Frontend em `Codigo/Agrofarm/web`:
  - React + Vite.
  - TanStack Query para cache e sincronizacao.
  - Zustand para estado de sessao.
- Documentacao tecnica em `Documentacao/`.

## 3) Estrutura recomendada para instrucoes Copilot

Toda instrucao local (por exemplo em `AGENTS.md` ou `copilot-instructions.md`) deve ter:

1. **Objetivo da tarefa**
   - Resultado concreto esperado.
2. **Contexto tecnico minimo**
   - Arquivos-chave e stack do modulo.
3. **Restricoes de arquitetura**
   - Onde cada tipo de logica deve ficar.
4. **Criterios de aceite**
   - Testes, lint, cobertura, comportamento.
5. **Formato da resposta**
   - Resumo, arquivos alterados e proximos passos.

## 4) Regras de engenharia por stack

### 4.1 API (`Codigo/Agrofarm/api`)
- Manter fluxo em camadas: `routes -> controllers -> services -> repositories`.
- Validar entrada via Zod em `schemas/` + `validate` middleware.
- Regras de negocio ficam em `services/`.
- Acesso ao banco fica em `repositories/` (Prisma).
- Autenticacao/autorizacao via `authMiddleware` e `authorize`.
- Erros de dominio com `AppError`; erro tecnico no `error.middleware`.

### 4.2 Web (`Codigo/Agrofarm/web`)
- Chamada HTTP apenas em `services/`.
- `queries/` concentram `useQuery`/`useMutation` e invalidacao de cache.
- Componentes/paginas nao devem chamar `axios` diretamente.
- Sessao/token centralizados no `authStore`.
- Rotas protegidas com `PrivateRoute`/`AdminRoute`.

## 5) Padroes de codigo e nomenclatura

- Arquivos por dominio:
  - API: `<dominio>.routes.js`, `<dominio>.service.js`, etc.
  - Web: `use<Dominio>Queries.js`, `<dominio>.service.js`.
- Funcoes/variaveis em `camelCase`.
- Componentes React em `PascalCase`.
- Query keys como constantes estaveis.
- Evitar mistura de idiomas para o mesmo modulo (`usuario` vs `user`).

## 6) Requisitos de teste e validacao

### Minimo obrigatorio por alteracao funcional
- Rodar lint no modulo alterado.
- Rodar testes existentes do modulo alterado.
- Adicionar teste para nova regra critica (quando aplicavel).

### Comandos de referencia

```powershell
# API
npm run lint
npm run test

# Web
npm run lint
npm run test
npm run build
```

## 7) Checklist de PR orientado a Copilot

- [ ] Escopo da tarefa foi atendido sem mudar comportamento nao solicitado.
- [ ] Arquitetura por camadas foi respeitada.
- [ ] Validacao de entrada e tratamento de erro foram aplicados.
- [ ] Rotas sensiveis estao protegidas por auth/role quando necessario.
- [ ] `services` + `queries` no web seguem padrao de cache/invalidation.
- [ ] Testes/lint foram executados no que foi alterado.
- [ ] Documentacao tecnica foi atualizada se houve mudanca estrutural.

## 8) Prompt patterns reutilizaveis

### 8.1 Nova feature backend
"Implemente o modulo `<dominio>` na API seguindo `routes -> controller -> service -> repository -> schema -> view`, com validacao Zod, erros padronizados e testes minimos."

### 8.2 Integracao frontend com endpoint
"Integre a tela `<Tela>` com endpoint `<rota>`, criando `services/<dominio>` e `queries/<dominio>` com invalidacao de cache apos mutacoes."

### 8.3 Refatoracao segura
"Refatore `<arquivo/modulo>` sem alterar comportamento externo, mantendo contratos de resposta e adicionando testes de regressao para os casos criticos."

### 8.4 Revisao de codigo
"Revise as mudancas com foco em bugs, regressao, seguranca e cobertura de testes; priorize findings por severidade com arquivo/linha."

## 9) Exemplos Do / Don't para instrucoes

### Do
- "Use `validate(schema)` em toda rota de escrita."
- "Se criar endpoint, registre em `src/routes/index.js`."
- "Se alterar query de lista, invalide a query key correspondente."

### Don't
- "Implemente como achar melhor." (vago)
- "Pode misturar regra de negocio no controller." (quebra padrao)
- "Ignore testes por enquanto." (aumenta risco de regressao)

## 10) Processo de manutencao das instrucoes

- Revisao quinzenal das instrucoes tecnicas em grooming.
- Atualizacao obrigatoria quando houver:
  - nova convencao de pastas,
  - mudanca de arquitetura,
  - alteracao relevante de fluxo (auth, erros, dados).
- Manter historico de versoes no topo do arquivo com data e resumo.

## 11) Template pronto para colar em instrucoes locais

```markdown
## Contexto do projeto
- Monorepo Agrofarm: API (`Codigo/Agrofarm/api`) e Web (`Codigo/Agrofarm/web`).
- API: Express + Prisma + Zod + JWT.
- Web: React + Vite + React Query + Zustand.

## Regras obrigatorias
1. Respeitar arquitetura por camadas.
2. Validar entradas no backend com schema + middleware.
3. Nao chamar API direto em componentes React; usar `services` e `queries`.
4. Preservar contratos de resposta e erros.
5. Executar lint/testes do escopo alterado antes de concluir.

## Formato de entrega
- O que mudou e por que.
- Arquivos alterados.
- Como validar.
- Riscos e proximos passos.
```

## Resultado esperado
Instrucoes Copilot mais objetivas e verificaveis, com menor retrabalho, menor ambiguidade e maior aderencia ao padrao tecnico do Agrofarm.

