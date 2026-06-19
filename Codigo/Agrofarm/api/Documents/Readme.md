# ⚙️ API — Backend

Servidor HTTP construído com **Node.js + Express** seguindo o padrão **MVC**
com camadas extras de **Service** e **Repository** para separação de
responsabilidades.

---

## 🗂️ Índice

- [Tecnologias](#-tecnologias)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Descrição das Camadas](#-descrição-das-camadas)
- [Fluxo de uma Requisição](#-fluxo-de-uma-requisição)
- [Rotas da API](#-rotas-da-api)
- [Regras de Negócio](#-regras-de-negócio)
- [Como Rodar](#-como-rodar)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Padrão de Erros](#-padrão-de-erros)

---

## 🛠️ Tecnologias

| Tecnologia    | Uso |
|---------------|-----|
| Node.js       | Runtime |
| Express       | Framework HTTP |
| Prisma 5      | ORM / Banco de dados |
| PostgreSQL    | Banco de dados (Neon) |
| Zod           | Validação de dados |
| JWT           | Autenticação |
| Bcrypt        | Criptografia de senhas |
| Pino          | Logs |
| node-cron     | Agendamento de lembretes |
| Google Gemini | Inteligência Artificial |
| Evolution API | Envio de mensagens WhatsApp |
| Vitest        | Testes |

---

## 📁 Estrutura de Pastas

```text
Agrofarm/api/
├── 📄 package.json
├── 📄 .env
├── 📄 .env.example
├── 📄 .gitignore
│
├── 📁 prisma/
│   ├── 📄 schema.prisma
│   └── 📁 migrations/
│
└── 📁 src/
   ├── 📄 server.js
   ├── 📄 app.js
   │
   ├── 📁 models/
   │   ├── 📄 Fazenda.js
   │   ├── 📄 Cultura.js
   │   ├── 📄 Colheita.js
   │   ├── 📄 Gasto.js
   │   ├── 📄 Lucro.js
   │   ├── 📄 Lembrete.js
   │   ├── 📄 Insumo.js
   │   └── 📄 Cotacao.js
   │
   ├── 📁 views/
   │   ├── 📄 fazenda.view.js
   │   ├── 📄 cultura.view.js
   │   ├── 📄 colheita.view.js
   │   ├── 📄 gasto.view.js
   │   ├── 📄 lucro.view.js
   │   ├── 📄 lembrete.view.js
   │   ├── 📄 insumo.view.js
   │   ├── 📄 estoque.view.js
   │   ├── 📄 cotacao.view.js
   │   └── 📄 simulacao.view.js
   │
   ├── 📁 controllers/
   │   ├── 📄 auth.controller.js
   │   ├── 📄 fazenda.controller.js
   │   ├── 📄 cultura.controller.js
   │   ├── 📄 colheita.controller.js
   │   ├── 📄 gasto.controller.js
   │   ├── 📄 lucro.controller.js
   │   ├── 📄 lembrete.controller.js
   │   ├── 📄 insumo.controller.js
   │   ├── 📄 estoque.controller.js
   │   ├── 📄 cotacao.controller.js
   │   ├── 📄 simulacao.controller.js
   │   └── 📄 ia.controller.js
   │
   ├── 📁 services/
   │   ├── 📄 auth.service.js
   │   ├── 📄 fazenda.service.js
   │   ├── 📄 cultura.service.js
   │   ├── 📄 colheita.service.js
   │   ├── 📄 gasto.service.js
   │   ├── 📄 lucro.service.js
   │   ├── 📄 lembrete.service.js
   │   ├── 📄 insumo.service.js
   │   ├── 📄 estoque.service.js
   │   ├── 📄 cotacao.service.js
   │   ├── 📄 simulacao.service.js
   │   ├── 📄 whatsapp.service.js
   │   └── 📄 ia.service.js
   │
   ├── 📁 repositories/
   │   ├── 📄 auth.repository.js
   │   ├── 📄 fazenda.repository.js
   │   ├── 📄 cultura.repository.js
   │   ├── 📄 colheita.repository.js
   │   ├── 📄 gasto.repository.js
   │   ├── 📄 lucro.repository.js
   │   ├── 📄 lembrete.repository.js
   │   ├── 📄 insumo.repository.js
   │   └── 📄 estoque.repository.js
   │
   ├── 📁 routes/
   │   ├── 📄 auth.routes.js
   │   ├── 📄 fazenda.routes.js
   │   ├── 📄 cultura.routes.js
   │   ├── 📄 colheita.routes.js
   │   ├── 📄 gasto.routes.js
   │   ├── 📄 lucro.routes.js
   │   ├── 📄 lembrete.routes.js
   │   ├── 📄 insumo.routes.js
   │   ├── 📄 estoque.routes.js
   │   ├── 📄 cotacao.routes.js
   │   ├── 📄 simulacao.routes.js
   │   ├── 📄 ia.routes.js
   │   └── 📄 index.js
   │
   ├── 📁 middlewares/
   │   ├── 📄 auth.middleware.js
   │   ├── 📄 error.middleware.js
   │   ├── 📄 limitador.middleware.js
   │   ├── 📄 validator.middleware.js
   │   └── 📄 logger.middleware.js
   │
   ├── 📁 schemas/
   │   ├── 📄 auth.schema.js
   │   ├── 📄 fazenda.schema.js
   │   ├── 📄 cultura.schema.js
   │   ├── 📄 colheita.schema.js
   │   ├── 📄 gasto.schema.js
   │   ├── 📄 lucro.schema.js
   │   ├── 📄 lembrete.schema.js
   │   ├── 📄 insumo.schema.js
   │   └── 📄 simulacao.schema.js
   │
   ├── 📁 jobs/
   │   └── 📄 lembretes.job.js
   │
   ├── 📁 config/
   │   ├── 📄 env.js
   │   ├── 📄 cors.js
   │   └── 📄 index.js
   │
   ├── 📁 database/
   │   ├── 📄 client.js
   │   └── 📁 seeds/
   │       └── 📄 admin.seed.js
   │
   ├── 📁 shared/
   │   ├── 📁 errors/
   │   │   ├── 📄 AppError.js
   │   │   └── 📄 index.js
   │   └── 📁 utils/
   │       ├── 📄 logger.js
   │       ├── 📄 jwt.js
   │       └── 📄 bcrypt.js
   │
   └── 📁 tests/
       ├── 📄 setup.js
       ├── 📁 unit/
       │   ├── 📄 fazenda.service.spec.js
       │   ├── 📄 colheita.service.spec.js
       │   ├── 📄 gasto.service.spec.js
       │   ├── 📄 lucro.service.spec.js
       │   ├── 📄 lembrete.service.spec.js
       │   └── 📄 simulacao.service.spec.js
       └── 📁 integration/
           ├── 📄 fazenda.spec.js
           ├── 📄 colheita.spec.js
           ├── 📄 gasto.spec.js
           └── 📄 lucro.spec.js
```

---

## 📖 Descrição das Camadas

---

### 📄 `server.js`
> Ponto de entrada da aplicação

```text
→ Importa o app.js
→ Sobe o servidor na porta definida no .env
→ Inicia o cron job de lembretes
→ Loga confirmação no console
```

---

### 📄 `app.js`
> Configura e monta o Express

```text
→ Registra middlewares globais (helmet, cors, json)
→ Registra todas as rotas com prefixo /api
→ Registra o error.middleware (sempre por último)
```

---

### 📁 `models/` — M do MVC
> Define a **estrutura dos dados** da aplicação

```text
Fazenda.js
 → id, nome
 → tipo: PROPRIA | ARRENDADA_DE_TERCEIROS | ARRENDADA_PARA_TERCEIROS
 → localizacao, criadoEm, atualizadoEm

Cultura.js
 → id, nome, cor (gerada automaticamente), criadoEm

Colheita.js
 → id, fazendaId (FK → fazendas)
 → culturaId (FK → culturas)
 → area (hectares), sacasProduzidas, ano
 → dataColheita, criadoEm, atualizadoEm

Gasto.js
 → id, colheitaId (FK → colheitas)
 → tipo (VARCHAR — texto livre)
 → tipoPersonalizado (preenchido quando tipo = "Outro")
 → valor, dataVencimento (opcional)
 → status: PAGO | PENDENTE
 → descricao, data, criadoEm, atualizadoEm

Lucro.js
 → id, colheitaId (FK → colheitas)
 → quantidadeSacas, valorUnitario
 → comprador, data, criadoEm

Lembrete.js
 → id, usuarioId (FK → usuarios)
 → fazendaId (FK → fazendas, opcional)
 → titulo, descricao, dataLembrete
 → telefoneWhatsapp, status, criadoEm

Insumo.js
 → id, funcionarioId (FK → usuarios)
 → fazendaId (FK → fazendas)
 → item, quantidade, observacoes, data, criadoEm

Cotacao.js
 → id, valor, fonte, atualizadoEm

✅ Define a "forma" dos dados da aplicação
✅ Complementa o schema do Prisma
❌ Sem regra de negócio
❌ Sem acesso direto ao banco
```

---

### 📁 `views/` — V do MVC
> **Formata o JSON** de resposta — controla o que é exposto ao frontend

```text
fazenda.view.js
 → render(fazenda)       → formata um único registro
 → renderMany(fazendas)  → formata uma lista

cultura.view.js
 → render(cultura)
 → renderMany(culturas)

colheita.view.js
 → render(colheita)
 → renderMany(colheitas)

gasto.view.js
 → render(gasto)
 → renderMany(gastos)

lucro.view.js
 → render(lucro)
 → renderMany(lucros)

lembrete.view.js
 → render(lembrete)
 → renderMany(lembretes)

insumo.view.js
 → render(insumo)
 → renderMany(insumos)

estoque.view.js
 → render(estoque)       → saldo de sacas disponíveis

cotacao.view.js
 → render(cotacao)       → valor do dólar e horário de atualização

simulacao.view.js
 → render(simulacao)     → resultado do cálculo de abatimento

✅ Padroniza o formato de todas as respostas
✅ Remove campos sensíveis antes de responder
❌ Nunca expõe dados internos desnecessários
```

---

### 📁 `controllers/` — C do MVC
> **Recebe a requisição**, chama o service e **retorna a resposta**

```text
auth.controller.js
 → login    POST  /api/auth/login
 → cadastro POST  /api/auth/cadastro
 → logout   POST  /api/auth/logout

fazenda.controller.js
 → getAll       GET    /api/fazendas
 → getPorId     GET    /api/fazendas/:id
 → create       POST   /api/fazendas
 → update       PUT    /api/fazendas/:id
 → delete       DELETE /api/fazendas/:id

cultura.controller.js
 → getAll   GET    /api/culturas
 → create   POST   /api/culturas
 → update   PUT    /api/culturas/:id
 → delete   DELETE /api/culturas/:id

colheita.controller.js
 → getAll         GET    /api/colheitas
 → getPorId       GET    /api/colheitas/:id
 → getPorFazenda  GET    /api/colheitas/fazenda/:fazendaId
 → create         POST   /api/colheitas
 → update         PUT    /api/colheitas/:id
 → delete         DELETE /api/colheitas/:id

gasto.controller.js
 → getAll          GET    /api/gastos
 → getPorColheita  GET    /api/gastos/colheita/:colheitaId
 → create          POST   /api/gastos
 → update          PUT    /api/gastos/:id
 → delete          DELETE /api/gastos/:id

lucro.controller.js
 → getAll          GET    /api/lucros
 → getPorColheita  GET    /api/lucros/colheita/:colheitaId
 → create          POST   /api/lucros
 → update          PUT    /api/lucros/:id
 → delete          DELETE /api/lucros/:id

lembrete.controller.js
 → getAll    GET    /api/lembretes
 → getPorId  GET    /api/lembretes/:id
 → create    POST   /api/lembretes
 → update    PUT    /api/lembretes/:id
 → delete    DELETE /api/lembretes/:id

insumo.controller.js
 → getAll        GET    /api/insumos
 → getPorFazenda GET    /api/insumos/fazenda/:fazendaId
 → create        POST   /api/insumos
 → delete        DELETE /api/insumos/:id

estoque.controller.js
 → getAll         GET    /api/estoque
 → getPorColheita GET    /api/estoque/colheita/:colheitaId

cotacao.controller.js
 → getDolar       GET    /api/cotacao/dolar

simulacao.controller.js
 → calcularAbatimento GET  /api/simulacao/dividas
 → calcularSacas      POST /api/simulacao/calcular-sacas

ia.controller.js
 → gerarInsights  GET  /api/ia/insights
 → chat           POST /api/ia/chat

✅ Recebe req e res
✅ Chama o service correto
✅ Retorna resposta usando a view
✅ Erros sempre com try/catch → next(error)
❌ Sem regra de negócio
❌ Sem acesso direto ao banco
```

---

### 📁 `services/`
> **Regras de negócio** — coração da aplicação

```text
fazenda.service.js
 → Valida tipo obrigatório:
    PROPRIA | ARRENDADA_DE_TERCEIROS | ARRENDADA_PARA_TERCEIROS
 → Bloqueia exclusão se tiver colheitas vinculadas

cultura.service.js
 → Valida nome único antes de criar
 → Gera cor automaticamente baseada no nome
 → Bloqueia exclusão se tiver colheitas vinculadas

colheita.service.js
 → Valida se fazenda existe antes de criar
 → Valida se cultura existe (via culturaId)

gasto.service.js
 → Valida se colheita existe antes de criar
 → Gerencia status (PAGO | PENDENTE)
 → Aceita tipo como texto livre (VARCHAR)
 → Valida tipoPersonalizado quando tipo = "Outro"
 → Valida dataVencimento (opcional)

lucro.service.js
 → Valida se colheita existe
 → Verifica estoque antes de registrar lucro

lembrete.service.js
 → Cria e atualiza lembretes
 → Gerencia status (PENDENTE | ENVIADO | CANCELADO)

whatsapp.service.js
 → Conecta com Evolution API via axios
 → Envia mensagem de lembrete no WhatsApp

ia.service.js
 → gerarInsights: busca dados do banco, monta
   prompt estruturado e chama Google Gemini
 → chat: recebe pergunta do usuário, busca dados
   relevantes e retorna resposta em linguagem
   natural via Google Gemini (RF14)

insumo.service.js
 → Valida se fazenda e funcionário existem
 → Registra uso de insumos pelo funcionário

estoque.service.js
 → Calcula: sacas_produzidas - sacas_vendidas

cotacao.service.js
 → Verifica se existe cache válido
 → Busca na API externa se cache estiver vencido
 → Salva novo valor no cache com timestamp

simulacao.service.js
 → Busca total de gastos (PAGO + PENDENTE)
 → Calcula sacas necessárias para abater dívida
 → Retorna breakdown por status com cores

✅ Toda regra de negócio fica aqui
✅ Chama o repository para acessar o banco
✅ Lança erros com AppError quando algo é inválido
❌ Não conhece req/res
❌ Sem acesso direto ao banco
```

---

### 📁 `repositories/`
> **Única camada que fala com o banco** de dados

```text
fazenda.repository.js
 → buscarTodos, buscarPorId, buscarComColheitas
 → create, update, delete

cultura.repository.js
 → buscarTodos, buscarPorId, buscarPorNome
 → create, update, delete

colheita.repository.js
 → buscarTodos, buscarPorId, buscarPorFazenda
 → create, update, delete

gasto.repository.js
 → buscarTodos, buscarPorColheita
 → totalPorStatus → soma separada de PAGO e PENDENTE
 → create, update, delete

lucro.repository.js
 → buscarTodos, buscarPorColheita
 → create, update, delete

lembrete.repository.js
 → buscarTodos, buscarPorId, buscarPendentes
 → create, update, delete

insumo.repository.js
 → buscarTodos, buscarPorFazenda
 → create, delete

estoque.repository.js
 → totalSacasPorColheita    → soma total de sacas colhidas
 → totalVendidasPorColheita → soma total de sacas já vendidas

✅ Toda query de banco fica aqui
✅ Se trocar de banco, só mexe aqui
❌ Sem regra de negócio
❌ Sem req/res
```

---

### 📁 `routes/`
> Define as **URLs** e conecta aos controllers

```text
auth.routes.js      → rotas de /api/auth
fazenda.routes.js   → rotas de /api/fazendas
cultura.routes.js   → rotas de /api/culturas
colheita.routes.js  → rotas de /api/colheitas
gasto.routes.js     → rotas de /api/gastos
lucro.routes.js     → rotas de /api/lucros
lembrete.routes.js  → rotas de /api/lembretes
insumo.routes.js    → rotas de /api/insumos
estoque.routes.js   → rotas de /api/estoque
cotacao.routes.js   → rotas de /api/cotacao
simulacao.routes.js → rotas de /api/simulacao
ia.routes.js        → rotas de /api/ia

index.js
 → Agrupa todas as rotas em um único lugar
 → É o único arquivo registrado no app.js

✅ Aplica middlewares específicos por rota
✅ Chama o controller correto
```

---

### 📁 `middlewares/`
> Funções que rodam **entre a requisição e o controller**

```text
auth.middleware.js
 → Verifica se o token JWT existe e é válido
 → Bloqueia com 401 se inválido ou ausente
 → Anexa os dados do usuário no req

error.middleware.js
 → Captura TODOS os erros da aplicação
 → Retorna resposta padronizada com status e mensagem
 → DEVE ser o último middleware registrado no app.js
 → Loga o erro com o logger

validator.middleware.js
 → Recebe um schema Zod como parâmetro
 → Valida o req.body antes de chegar no controller
 → Retorna 400 com mensagem clara se dados inválidos

limitador.middleware.js
 → Limita quantidade de requisições por IP
 → Protege contra ataques de força bruta
 → Configurável por rota (login mais restrito)

logger.middleware.js
 → Loga toda requisição que chega
 → Registra: método, URL, status e tempo de resposta
```

---

### 📁 `schemas/`
> **Validação dos dados** de entrada com Zod

```text
auth.schema.js
 → email: string obrigatório
 → senha: string obrigatório, mínimo 6 caracteres

fazenda.schema.js
 → nome: string obrigatório
 → tipo: enum obrigatório
   (PROPRIA | ARRENDADA_DE_TERCEIROS | ARRENDADA_PARA_TERCEIROS)
 → localizacao: string opcional

cultura.schema.js
 → nome: string obrigatório
 → cor: string opcional (gerada automaticamente se omitida)

colheita.schema.js
 → fazendaId: uuid obrigatório
 → culturaId: uuid obrigatório (FK → culturas)
 → area: número obrigatório (hectares)
 → sacasProduzidas: número obrigatório
 → ano: número obrigatório
 → dataColheita: data obrigatória

gasto.schema.js
 → colheitaId: uuid obrigatório
 → tipo: string obrigatório (texto livre)
 → tipoPersonalizado: string opcional
   (obrigatório quando tipo = "Outro")
 → valor: número obrigatório
 → dataVencimento: data opcional
 → status: enum obrigatório (PAGO | PENDENTE)
 → descricao: string opcional

lucro.schema.js
 → colheitaId: uuid obrigatório
 → quantidadeSacas: número obrigatório
 → valorUnitario: número obrigatório
 → comprador: string obrigatório
 → data: data obrigatória

lembrete.schema.js
 → titulo: string obrigatório
 → dataLembrete: datetime obrigatório
 → fazendaId: uuid opcional
 → telefoneWhatsapp: string opcional
 → descricao: string opcional

insumo.schema.js
 → fazendaId: uuid obrigatório
 → item: string obrigatório
 → quantidade: número obrigatório
 → observacoes: string opcional
 → data: data obrigatória

simulacao.schema.js
 → colheitaId: uuid obrigatório
 → valorDivida: número obrigatório

✅ Garante que dados inválidos nem chegam no controller
✅ Retorna mensagens de erro claras e padronizadas
✅ Sempre usado junto com o validator.middleware
```

---

### 📁 `jobs/`
> Tarefas agendadas que rodam em **paralelo ao servidor**

```text
lembretes.job.js
 → Cron que roda de hora em hora
 → Busca lembretes com data próxima
 → Chama whatsapp.service para enviar a mensagem
 → Atualiza status do lembrete para ENVIADO
```

---

### 📁 `config/`
> **Configurações técnicas** da aplicação

```text
env.js
 → Valida se todas as variáveis de ambiente existem
 → A aplicação não sobe se faltar alguma variável

cors.js
 → Define quais origens podem acessar a API
 → Configurado via variável de ambiente CORS_ORIGIN

index.js
 → Exporta todas as configurações juntas
```

---

### 📁 `database/`
> Tudo relacionado ao **banco de dados**

```text
client.js
 → Instância do Prisma 5 pronta pra usar em toda a aplicação
 → Importado pelos repositories

seeds/
 admin.seed.js
   → Cria o usuário administrador padrão
   → Executado uma única vez ao configurar o ambiente
```

---

### 📁 `shared/`
> Código **reutilizado em todo o backend**

```text
errors/
 AppError.js
   → Classe de erro customizado da aplicação
   → Recebe mensagem e statusCode
   → Lançado nos services quando algo é inválido
   → Capturado e tratado pelo error.middleware

utils/
 logger.js
   → Instância configurada do Pino
   → Substitui o console.log em toda a aplicação

 jwt.js
   → generateToken(payload)   → gera um token JWT
   → verifyToken(token)       → valida e retorna os dados

 bcrypt.js
   → hash(password)           → gera o hash da senha
   → compare(password, hash)  → compara senha com hash
```

---

### 📁 `tests/`
> **Testes automatizados** da aplicação

```text
setup.js
 → Configurações globais antes de rodar os testes
 → Conexão com banco de teste
 → Limpeza de dados entre cada teste

unit/
 → Testa funções isoladas de cada service
 → Sem banco real — usa mock do repository

 fazenda.service.spec.js
   → testa bloqueio de exclusão com colheitas vinculadas
   → testa validação dos 3 tipos de fazenda

 colheita.service.spec.js
   → testa validação de fazenda e cultura existentes

 gasto.service.spec.js
   → testa validação de colheita existente
   → testa gerenciamento de status (PAGO | PENDENTE)
   → testa tipo personalizado

 lucro.service.spec.js
   → testa bloqueio por estoque insuficiente
   → testa vínculo com colheita existente

 lembrete.service.spec.js
   → testa criação e atualização de status

 simulacao.service.spec.js
   → testa cálculo de abatimento de dívida

integration/
 → Testa o fluxo completo da rota até o banco

 fazenda.spec.js   → CRUD completo + regras de exclusão
 colheita.spec.js  → CRUD + vínculo com fazenda e cultura
 gasto.spec.js     → CRUD + validação de status
 lucro.spec.js     → criação + validação de estoque
```

---

## 🔄 Fluxo de uma Requisição

```text
                 REQUEST
                    │
                    ▼
             ┌────────────┐
             │   routes   │
             │  index.js  │  agrupa todas as rotas
             └─────┬──────┘
                    │
                    ▼
    ┌───────────────────────────────┐
    │           middlewares         │
    │                               │
    │  1. logger.middleware         │ loga a requisição
    │  2. auth.middleware           │ token válido?
    │  3. validator.middleware      │ body válido?
    └───────────────┬───────────────┘
                    │
                    ▼
           ┌─────────────────┐
           │   controller    │◄── C do MVC
           │                 │
           │ recebe req/res  │
           │ chama o service │
           │ retorna resposta│
           └────────┬────────┘
                    │
                    ▼
            ┌───────────────┐
            │    service    │
            │               │
            │ regra de      │
            │ negócio       │
            │ lança AppError│
            └───┬───────────┘
                │
    ┌───────────┼────────────┐
    ▼           ▼            ▼
repository  whatsapp.svc   ia.svc
(banco)     (Evolution)    (Gemini)
    │
    ▼
  model     ◄── M do MVC
    │
    ▼
   view     ◄── V do MVC
    │
    ▼
RESPONSE

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
CRON (paralelo ao servidor)
 lembretes.job.js
   → roda de hora em hora
   → busca lembretes pendentes
   → envia via whatsapp.service
   → atualiza status para ENVIADO
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
Se ocorrer erro em qualquer etapa:

service lança AppError
  │
  ▼
controller → next(error)
  │
  ▼
error.middleware
 → loga o erro
 → retorna JSON padronizado
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
```

---

## 🛣️ Rotas da API

```text
Todas as rotas seguem o prefixo /api

AUTH
 POST   /api/auth/login
 POST   /api/auth/cadastro
 POST   /api/auth/logout

FAZENDAS
 GET    /api/fazendas
 GET    /api/fazendas/:id
 POST   /api/fazendas
 PUT    /api/fazendas/:id
 DELETE /api/fazendas/:id

CULTURAS
 GET    /api/culturas
 POST   /api/culturas
 PUT    /api/culturas/:id
 DELETE /api/culturas/:id

COLHEITAS
 GET    /api/colheitas
 GET    /api/colheitas/:id
 GET    /api/colheitas/fazenda/:fazendaId
 POST   /api/colheitas
 PUT    /api/colheitas/:id
 DELETE /api/colheitas/:id

GASTOS
 GET    /api/gastos
 GET    /api/gastos/colheita/:colheitaId
 POST   /api/gastos
 PUT    /api/gastos/:id
 DELETE /api/gastos/:id

LUCROS
 GET    /api/lucros
 GET    /api/lucros/colheita/:colheitaId
 POST   /api/lucros
 PUT    /api/lucros/:id
 DELETE /api/lucros/:id

ESTOQUE
 GET    /api/estoque
 GET    /api/estoque/colheita/:colheitaId

COTAÇÃO
 GET    /api/cotacao/dolar

LEMBRETES
 GET    /api/lembretes
 GET    /api/lembretes/:id
 POST   /api/lembretes
 PUT    /api/lembretes/:id
 DELETE /api/lembretes/:id

INSUMOS
 GET    /api/insumos
 GET    /api/insumos/fazenda/:fazendaId
 POST   /api/insumos
 DELETE /api/insumos/:id

SIMULAÇÃO (RF09)
 GET    /api/simulacao/dividas
 POST   /api/simulacao/calcular-sacas

IA (RF11 + RF14)
 GET    /api/ia/insights
 POST   /api/ia/chat
```

---

## ⚙️ Regras de Negócio

```text
Fazendas
 → Tipo obrigatório:
   PROPRIA | ARRENDADA_DE_TERCEIROS | ARRENDADA_PARA_TERCEIROS
 → Não pode excluir se tiver colheitas vinculadas

Culturas
 → Nome único no sistema
 → Cor gerada automaticamente
 → Não pode excluir se tiver colheitas vinculadas

Colheitas
 → Fazenda deve existir antes de criar
 → Cultura deve existir (via culturaId — FK dinâmico)

Gastos
 → Colheita deve existir antes de criar
 → Status obrigatório (PAGO | PENDENTE)
 → Tipo é texto livre (VARCHAR)
 → tipoPersonalizado obrigatório quando tipo = "Outro"
 → dataVencimento é opcional

Lucros
 → Colheita deve existir
 → Quantidade não pode ser maior que o estoque disponível

Lembretes
 → Enviados automaticamente via WhatsApp pelo cron job
 → Status: PENDENTE → ENVIADO após envio

Insumos
 → Somente FUNCIONARIO pode registrar
 → Fazenda deve existir

IA
 → Insights: dados do banco enviados ao Google Gemini
 → Chat: pergunta do usuário + contexto do banco →
   resposta em linguagem natural via Gemini (RF14)
```

---

## ▶️ Como Rodar

```bash
# Instalar dependências
npm install

# Copiar o .env
cp .env.example .env
# → solicitar o .env preenchido ao líder do projeto

# Gerar o client do Prisma
npm run db:generate

# Popular o banco com dados iniciais
npm run db:seed

# Rodar em desenvolvimento
npm run dev
# → servidor rodando em http://localhost:3333
```

> ⚠️ **Importante:** o banco já está criado e configurado no Neon.
> Não rodar `npx prisma migrate dev` — pode gerar conflitos.
> Usar apenas `npx prisma generate` para gerar o client.

---

## 📋 Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Desenvolvimento com hot reload |
| `npm start` | Produção |
| `npm test` | Testes |
| `npm run test:coverage` | Testes com cobertura |
| `npm run db:generate` | Gera o client do Prisma |
| `npm run db:studio` | Interface visual do banco |
| `npm run db:seed` | Popula dados iniciais |

---

## 🔑 Variáveis de Ambiente

Copie o `.env.example` e crie seu `.env`:

```bash
cp .env.example .env
env
# Servidor
PORT=3333
NODE_ENV=development

# Banco de dados
DATABASE_URL=
DIRECT_URL=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Evolution API (WhatsApp)
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=

# Google Gemini (IA)
GEMINI_API_KEY=
```

---

## ⚠️ Padrão de Erros

Todos os erros retornam o mesmo formato:

```json
{
 "status": "error",
 "message": "Descrição clara do que aconteceu"
}
```

| Código | Situação |
|--------|----------|
| 400 | Dados inválidos ou regra de negócio violada |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Registro não encontrado |
| 409 | Conflito (ex: cultura com nome duplicado) |
| 500 | Erro interno do servidor |

---

## 🆕 Atualização — Integração WhatsApp (Evolution API)

### O que foi implementado

- Base funcional da API com `app.js`, `server.js`, `config`, `middlewares`, `logger` e tratamento global de erros.
- Módulo completo de lembretes com as camadas:
  - `repositories/lembrete.repository.js`
  - `services/lembrete.service.js`
  - `controllers/lembrete.controller.js`
  - `routes/lembrete.routes.js`
  - `schemas/lembrete.schema.js`
  - `views/lembrete.view.js`
- Integração com a Evolution API em `services/whatsapp.service.js`.
- Job agendado em `jobs/lembretes.job.js` para processar lembretes pendentes.

### Endpoints novos/confirmados para lembretes

```text
GET    /api/health
GET    /api/lembretes
GET    /api/lembretes/:id
POST   /api/lembretes
PUT    /api/lembretes/:id
DELETE /api/lembretes/:id
POST   /api/lembretes/:id/enviar
GET    /api/lembretes/whatsapp/status
POST   /api/lembretes/whatsapp/provisionar
```

### Comportamento do envio WhatsApp

- `POST /api/lembretes/:id/enviar`: força envio manual e marca o lembrete como `ENVIADO`.
- Job (`node-cron`) processa lembretes `PENDENTE` automaticamente.
- Se `telefoneWhatsapp` não existir, o service tenta fallback para `usuarios.telefone`.
- Se as variáveis `EVOLUTION_API_URL`, `EVOLUTION_API_KEY` e `EVOLUTION_INSTANCE` não estiverem completas, o envio retorna erro controlado (integração desabilitada).
- `POST /api/lembretes/whatsapp/provisionar`: cria a instância na Evolution API (se ainda não existir) e retorna dados de conexão (QR/pairing).
- `GET /api/lembretes/whatsapp/status`: além de validar env, consulta o estado real da conexão da instância (`open`, `connecting`, `close` ou `nao_encontrada`).

### Infraestrutura local da Evolution

- Arquivo pronto para subir stack local:
  - `docker-compose.evolution.yml`
- Serviços:
  - Evolution API
  - Redis
  - PostgreSQL
- Comando:
  - `docker compose -f docker-compose.evolution.yml up -d`

### Testes

- Teste unitário implementado para fluxo de envio em:
  - `src/tests/unit/lembrete.service.spec.js`