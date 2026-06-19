# [FIX] Fazendas - Sincronizacao do Banco Local com Banco Hospedado

Tipo:        Fix
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Backend, Banco de Dados
Relator:     (preencher)
Pai:         [EPIC] Tela Fazenda Selecionada
Data Limite: (preencher)

## 📌 Status Auditado no Codigo (25/04/2026)

- Schema Prisma contem `fazendas`, `culturas` e `fazenda_culturas` com enums/constraints esperados. (CONCLUIDO)
- Backend de fazendas (controller/service/repository/routes/schema/view) existe com CRUD e rotas de culturas por fazenda. (CONCLUIDO)
- Sincronizacao especifica no banco hospedado depende de execucao operacional (SQL + `db:pull` + `db:generate`) e nao pode ser confirmada apenas pelo codigo local. (PENDENTE)

## 📝 Descricao
Como time de plataforma,
eu quero aplicar no banco hospedado as mesmas estruturas ja existentes no banco local para o modulo de Fazendas,
para garantir consistencia de schema entre ambientes e evitar regressao de API em producao.

Este fix cobre exclusivamente Backend + Banco de Dados:
- alinhar tabelas `fazendas`, `culturas` e `fazenda_culturas` no banco hospedado;
- garantir enums, constraints, indices e FKs com o mesmo contrato da migracao local;
- validar o backend existente contra o schema hospedado apos sincronizacao.

---

## ✅ Criterios de Aceite

### Cenario 1 - Estrutura de fazendas no banco hospedado
**Dado** que o banco hospedado estava defasado
**Quando** a migracao de sincronizacao e executada
**Entao** a tabela `fazendas` passa a ter `id`, `nome`, `tipo`, `localizacao`, `criado_em`, `atualizado_em` conforme o schema local.

### Cenario 2 - Estrutura de culturas no banco hospedado
**Dado** que o catalogo global de culturas precisa estar alinhado
**Quando** a migracao e executada
**Entao** a tabela `culturas` possui `nome` unico, `cor` e `hectares DECIMAL(10,2) NOT NULL DEFAULT 0`.

### Cenario 3 - Estrutura de fazenda_culturas no banco hospedado
**Dado** que a cultura na fazenda e representada por vinculo N:1
**Quando** a migracao e executada
**Entao** `fazenda_culturas` possui `fazenda_id`, `cultura_id`, `hectares`, `status` e unicidade em (`fazenda_id`, `cultura_id`).

### Cenario 4 - Integridade referencial
**Dado** que existem relacoes entre tabelas
**Quando** as FKs sao aplicadas
**Entao** `fazenda_culturas` referencia `fazendas(id)` e `culturas(id)` com `ON DELETE NO ACTION` e `ON UPDATE CASCADE`.

### Cenario 5 - Backend funcional apos alinhamento
**Dado** o backend atual de fazendas
**Quando** os endpoints de consulta e manutencao sao exercitados
**Entao** as respostas continuam consistentes com status HTTP esperado e sem erro de schema.

---

# [STORY DATABASE] Sincronizacao Fazendas - Banco Hospedado

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Banco de Dados
Relator:     (preencher)
Pai:         [FIX] Fazendas - Sincronizacao do Banco Local com Banco Hospedado
Data Limite: (preencher)

## 📝 Descricao
Como sistema, eu quero que o banco hospedado reflita o schema homologado no ambiente local para o modulo de Fazendas, para que o backend opere com o mesmo contrato estrutural em todos os ambientes.

---

## SQL a executar (banco hospedado)

```sql
-- 1) Garantir enums necessarios
DO $$
BEGIN
    CREATE TYPE tipo_fazenda AS ENUM ('PROPRIA', 'ARRENDADA_DE_TERCEIROS', 'ARRENDADA_PARA_TERCEIROS');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE status_cultura AS ENUM ('SECAGEM', 'COLHEITA', 'PLANTIO', 'ADUBACAO', 'PULVERIZACAO');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2) Tabela fazendas
CREATE TABLE IF NOT EXISTS fazendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    tipo tipo_fazenda NOT NULL,
    localizacao VARCHAR(255),
    criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE fazendas
    ADD COLUMN IF NOT EXISTS nome VARCHAR(150),
    ADD COLUMN IF NOT EXISTS tipo tipo_fazenda,
    ADD COLUMN IF NOT EXISTS localizacao VARCHAR(255),
    ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3) Tabela culturas (catalogo global)
CREATE TABLE IF NOT EXISTS culturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    cor VARCHAR(7) NOT NULL,
    criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hectares DECIMAL(10,2) NOT NULL DEFAULT 0
);

ALTER TABLE culturas
    ADD COLUMN IF NOT EXISTS nome VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cor VARCHAR(7),
    ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS hectares DECIMAL(10,2) NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS culturas_nome_key ON culturas(nome);

-- 4) Tabela fazenda_culturas (cultura na fazenda)
CREATE TABLE IF NOT EXISTS fazenda_culturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fazenda_id UUID NOT NULL,
    cultura_id UUID NOT NULL,
    hectares DECIMAL(10,2) NOT NULL,
    status status_cultura NOT NULL,
    criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE fazenda_culturas
    ADD COLUMN IF NOT EXISTS fazenda_id UUID,
    ADD COLUMN IF NOT EXISTS cultura_id UUID,
    ADD COLUMN IF NOT EXISTS hectares DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS status status_cultura,
    ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS fazenda_culturas_fazenda_id_cultura_id_key
    ON fazenda_culturas (fazenda_id, cultura_id);

-- 5) FKs esperadas na migracao local
DO $$
BEGIN
    ALTER TABLE fazenda_culturas
        ADD CONSTRAINT fazenda_culturas_fazenda_id_fkey
        FOREIGN KEY (fazenda_id) REFERENCES fazendas(id)
        ON DELETE NO ACTION ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE fazenda_culturas
        ADD CONSTRAINT fazenda_culturas_cultura_id_fkey
        FOREIGN KEY (cultura_id) REFERENCES culturas(id)
        ON DELETE NO ACTION ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
```

## Pos-SQL

- Executar `npm run db:pull` para refletir o estado do banco hospedado localmente.
- Executar `npm run db:generate` para regenerar client Prisma.
- Validar `Codigo/Agrofarm/api/prisma/schema.prisma` sem divergencias.

## OBS ATUALIZAR NO DIAGRAMA

- Entidade `fazendas`.
- Entidade `culturas` (incluindo `hectares`).
- Entidade `fazenda_culturas`.
- Relacoes e cardinalidades entre as tres entidades.

## ✅ Criterios de Aceite

→ Banco hospedado contem as 3 estruturas com os tipos e defaults esperados.
→ Existe unicidade de `culturas.nome`.
→ Existe unicidade composta em `fazenda_culturas(fazenda_id, cultura_id)`.
→ FKs de `fazenda_culturas` estao ativas com `ON DELETE NO ACTION` e `ON UPDATE CASCADE`.
→ Prisma consegue sincronizar (`db:pull`) sem erro.

---

# [STORY BACKEND] Sincronizacao Fazendas - Backend

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Backend
Relator:     (preencher)
Pai:         [FIX] Fazendas - Sincronizacao do Banco Local com Banco Hospedado
Data Limite: (preencher)

## 📝 Descricao
Como API, eu quero garantir que os contratos e fluxos do modulo de Fazendas continuem operando apos a sincronizacao do banco hospedado, para evitar quebra de endpoint por diferenca de schema entre ambientes.

---

## ✅ Criterios de Aceite

### Cenario 1 - Listagem de fazendas
**Dado** que o banco hospedado foi alinhado
**Quando** `GET /api/fazendas` e chamado
**Entao** a API retorna lista de fazendas sem erro de coluna/tipo ausente.

### Cenario 2 - CRUD de fazendas
**Dado** que o schema de `fazendas` esta sincronizado
**Quando** `POST`, `PUT` e `DELETE /api/fazendas/:id` sao executados por `ADMIN`
**Entao** as operacoes respeitam validacao e retornam status esperados (201/200/204).

### Cenario 3 - Vinculo cultura na fazenda
**Dado** que `fazenda_culturas` possui unicidade por par
**Quando** o fluxo de vincular cultura for executado mais de uma vez para o mesmo par
**Entao** a API responde erro de integridade (ou fluxo de update controlado), sem duplicar linhas.

### Cenario 4 - Consistencia de leitura com relacoes
**Dado** que o repository inclui `fazenda_culturas` com `culturas`
**Quando** `GET /api/fazendas` e `GET /api/fazendas/:id` sao executados
**Entao** o payload retorna estrutura coerente com `fazenda.view`.

---

## 🛠️ Implementacao

### `Codigo/Agrofarm/api/src/routes/fazenda.routes.js` (EXISTENTE - MODIFICAR)

Rotas existentes (nao alterar):
- `GET /api/fazendas`
- `GET /api/fazendas/:id`
- `POST /api/fazendas`
- `PUT /api/fazendas/:id`
- `DELETE /api/fazendas/:id`
- `GET /api/fazendas/:fazendaId/culturas`
- `POST /api/fazendas/:fazendaId/culturas`
- `PUT /api/fazendas/:fazendaId/culturas/:id`
- `DELETE /api/fazendas/:fazendaId/culturas/:id`

Ajustes necessarios:
- validar no ambiente hospedado se todas as rotas continuam funcionais apos sincronizacao do banco.

### `Codigo/Agrofarm/api/src/controllers/fazenda.controller.js` (EXISTENTE - MODIFICAR)

Metodos existentes (nao alterar):
- `getAll`
- `getPorId`
- `create`
- `update`
- `delete`

Ajustes necessarios:
- sem novos metodos obrigatorios neste fix; foco em validacao de contrato com o banco hospedado.

### `Codigo/Agrofarm/api/src/services/fazenda.service.js` (EXISTENTE - MODIFICAR)

Logica existente (nao alterar):
- `listarTodas(usuario)`
- `buscarPorId(id, usuario)`
- `criar(dados)`
- `atualizar(id, dados)`
- `deletar(id)`

Ajustes necessarios:
- reforcar tratamento de erro para violacao de unicidade em `fazenda_culturas` quando aplicavel.
- validar mensagens de dominio para dados inconsistentes oriundos de ambiente hospedado.

### `Codigo/Agrofarm/api/src/repositories/fazenda.repository.js` (EXISTENTE - MODIFICAR)

Metodos existentes (nao alterar):
- `buscarTodos()`
- `buscarTodosPorUsuario(usuarioId)`
- `usuarioTemVinculo(usuarioId, fazendaId)`
- `buscarPorId(id)`
- `create(dados)`
- `update(id, dados)`
- `delete(id)`
- `contarVinculos(id)`

Ajustes necessarios:
- garantir compatibilidade com tipos e constraints do banco hospedado.
- manter includes de `fazenda_culturas`/`culturas` conforme schema sincronizado.

### `Codigo/Agrofarm/api/src/schemas/fazenda.schema.js` (EXISTENTE - MODIFICAR)

Schemas existentes (nao alterar):
- `createFazendaSchema`
- `updateFazendaSchema`

Ajustes necessarios:
- validar aderencia dos limites aos tipos persistidos no banco hospedado (`nome`, `tipo`, `localizacao`).

### `Codigo/Agrofarm/api/src/views/fazenda.view.js` (EXISTENTE - MODIFICAR)

Metodos existentes (nao alterar):
- `render(fazenda)`
- `renderMany(fazendas)`

Ajustes necessarios:
- assegurar serializacao consistente apos alinhamento de dados em ambiente hospedado.

### `Codigo/Agrofarm/api/prisma/schema.prisma` (EXISTENTE - MODIFICAR)

Ajustes necessarios:
- confirmar alinhamento final de `fazendas`, `culturas` e `fazenda_culturas` apos `db:pull`.

---

## 🚫 Regras de Negocio

- Nao criar frontend para este fix.
- `culturas.nome` deve permanecer unico no banco.
- Nao permitir duplicidade de (`fazenda_id`, `cultura_id`) em `fazenda_culturas`.
- A camada backend deve continuar protegendo regras por perfil e vinculo.

---

## 🧪 Validacao Tecnica

- Rodar migracao SQL no banco hospedado em janela controlada.
- Rodar `npm run db:pull` e `npm run db:generate`.
- Executar smoke test dos endpoints de fazendas e de culturas da fazenda.
- Validar no log da API ausencia de erro de coluna/tipo/constraint inexistente.

---

## 🚀 Checklist de Rollout (Producao)

- [ ] Confirmar backup/snapshot do banco hospedado imediatamente antes da mudanca.
- [ ] Definir janela de manutencao e comunicar time/usuarios impactados.
- [ ] Executar SQL idempotente em staging e registrar evidencias.
- [ ] Executar SQL idempotente em producao por lote (enums -> tabelas/colunas -> indices -> FKs).
- [ ] Rodar `npm run db:pull` e versionar diff do `schema.prisma` (se houver).
- [ ] Rodar `npm run db:generate` no backend conectado ao ambiente alvo.
- [ ] Validar endpoints criticos: `GET /api/fazendas`, `GET /api/fazendas/:id`, `POST /api/fazendas`.
- [ ] Validar vinculacao de cultura na fazenda sem duplicidade do par (`fazenda_id`, `cultura_id`).
- [ ] Monitorar logs de erro e latencia por pelo menos 30 minutos apos deploy.

## 🔁 Checklist de Rollback

- [ ] Se houver falha critica, interromper novas escritas no modulo de Fazendas.
- [ ] Restaurar snapshot/backup do banco hospedado conforme runbook do ambiente.
- [ ] Reimplantar versao estavel anterior do backend (se necessario).
- [ ] Revalidar endpoints de fazenda em smoke test minimo.
- [ ] Registrar incidente e causas no card para ajuste da proxima janela.

---

## 🛠️ Refinamento

- **Decisao tecnica:** tratar o banco hospedado como ambiente a sincronizar com o baseline de migracao local.
- **Ordem de execucao:** Database primeiro, Backend depois.
- **Risco controlado:** usar SQL idempotente para minimizar impacto em ambientes parcialmente migrados.