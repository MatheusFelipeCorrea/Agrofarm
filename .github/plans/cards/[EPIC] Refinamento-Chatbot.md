# [EPIC] Refinamento do Chatbot

Tipo:        Epic
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Frontend, Backend, IA, Segurança, UX
Relator:     (preencher)
Pai:         [EPIC] Refinamento do Dashboard
Data Limite: (preencher)

## 📌 Status Auditado no Codigo (25/04/2026)

- Estrutura de persistencia do chatbot ja existe no Prisma com `chat_sessoes`, `chat_mensagens` e indices de consulta. (CONCLUIDO)
- Nao ha backend ativo de chatbot no estado atual: `ia.controller.js` esta vazio e `ia.routes.js` segue sem endpoints reais. (PENDENTE)
- A superficie frontend continua pendente: pagina de IA vazia e sem botao/fluxo real no dashboard atual. (PENDENTE)

## 📝 Descrição

Como usuário do AgroFarm,
eu quero abrir um chatbot a partir do dashboard e fazer perguntas rápidas sobre os dados da aplicação,
para obter respostas úteis e contextualizadas sem precisar navegar por várias telas.

Este epic define o Chatbot como funcionalidade transversal da plataforma, com contexto de domínio (estoque, lucros, gastos, colheitas, lembretes, cotação), respeitando rigorosamente as permissões por perfil e escopo de fazendas vinculadas.

---

## 🎯 Escopo Funcional

- O ícone do Chatbot fica no Dashboard e abre o modal/painel de conversa.
- Interface de chat com histórico de mensagens (usuário e assistente).
- Campo de entrada para perguntas livres.
- Respostas baseadas em dados reais da aplicação (não mock).
- Contexto multi-módulo:
  - Estoque
  - Gastos
  - Lucros
  - Colheitas
  - Lembretes
  - Cotação/simulação
- Restrição por perfil:
  - ADMIN pode consultar uma fazenda específica, várias fazendas ou consolidado.
  - FUNCIONARIO só pode consultar dados das fazendas vinculadas.
- Suporte a perguntas como:
  - "Quanto tem no estoque de café da minha fazenda?"
  - "Na fazenda X e Y, quanto tem de café nos estoques?" (ADMIN)

---

## ✅ Critérios de Aceite

### Cenário 1 — Abertura pelo Dashboard
**Dado** que o usuário está no dashboard
**Quando** clica no ícone do chatbot
**Então** o modal/painel de chat abre com foco no campo de pergunta.

### Cenário 2 — Consulta contextual simples
**Dado** que existem dados no sistema
**Quando** o usuário pergunta sobre estoque/lucro/gasto
**Então** o chatbot responde com valores consistentes com o banco.

### Cenário 3 — Restrição por perfil (FUNCIONARIO)
**Dado** que o usuário é FUNCIONARIO
**Quando** faz uma pergunta envolvendo fazendas fora do seu escopo
**Então** o chatbot bloqueia/ajusta a resposta para apenas as fazendas permitidas.

### Cenário 4 — Consulta multi-fazenda (ADMIN)
**Dado** que o usuário é ADMIN
**Quando** pergunta sobre fazenda X e Y ou "todas"
**Então** o chatbot retorna dados consolidados ou segmentados conforme solicitado.

### Cenário 5 — Sem dados
**Dado** que não há dados para o filtro solicitado
**Quando** o chatbot processa a pergunta
**Então** responde de forma clara, sem erro técnico, indicando ausência de dados.

### Cenário 6 — Erro de IA/integração
**Dado** falha no provedor de IA
**Quando** uma pergunta é enviada
**Então** retorna mensagem amigável de indisponibilidade e loga erro para observabilidade.

### Cenário 7 — Performance inicial
**Dado** uso normal da tela
**Quando** o chatbot abre e responde
**Então** mantém responsividade da UI e não bloqueia o dashboard.

---

# [STORY DATABASE] Refinamento Chatbot — Banco de Dados

Tipo:        Story
Prioridade:  🔼 High
Sprint:      (preencher)
Categoria:   Banco de Dados
Relator:     (preencher)
Pai:         [EPIC] Refinamento do Chatbot
Data Limite: (preencher)

Como sistema, eu quero persistir histórico e metadados de conversas do chatbot, para auditoria, rastreabilidade e melhoria contínua das respostas.

SQL a executar:

-- **1. Sessões de chat (NOVA TABELA)**
CREATE TABLE IF NOT EXISTS chat_sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  titulo VARCHAR(150) NULL,
  criado_em TIMESTAMP(6) NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessoes_usuario_id
ON chat_sessoes (usuario_id);

-- **2. Mensagens de chat (NOVA TABELA)**
CREATE TABLE IF NOT EXISTS chat_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id UUID NOT NULL REFERENCES chat_sessoes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  papel VARCHAR(20) NOT NULL, -- USER | ASSISTANT | SYSTEM
  conteudo TEXT NOT NULL,
  metadados JSONB NULL,
  criado_em TIMESTAMP(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_mensagens_sessao_id
ON chat_mensagens (sessao_id);

CREATE INDEX IF NOT EXISTS idx_chat_mensagens_criado_em
ON chat_mensagens (criado_em DESC);

Após executar o SQL:

- Executar no backend:
  - npx prisma db pull
  - npm run db:generate
- Atualizar Prisma:
  - model chat_sessoes
  - model chat_mensagens

**Critérios de Aceite:**

→ Histórico de sessão e mensagens persiste com vínculo ao usuário.
→ Estrutura suporta guardar metadados de contexto/filtros utilizados na resposta.
→ Consultas de histórico por usuário/sessão têm índice adequado.

---

# [STORY BACKEND] Refinamento Chatbot — Backend

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Backend
Relator:     (preencher)
Pai:         [EPIC] Refinamento do Chatbot
Data Limite: (preencher)

## 📝 Descrição
Como sistema, eu quero processar perguntas do chatbot com contexto de domínio e regras de permissão, para retornar respostas rápidas e seguras.

---

## ✅ Critérios de Aceite

### Cenário 1 — Enviar pergunta
**Dado** usuário autenticado
**Quando** POST /api/ia/chat é chamado com pergunta
**Então** retorna resposta textual e metadados básicos de contexto.

### Cenário 2 — Restrição por fazendas vinculadas
**Dado** usuário FUNCIONARIO
**Quando** pergunta sobre fazenda fora do escopo
**Então** backend limita consulta ao conjunto de fazendas permitidas.

### Cenário 3 — Escopo solicitado pelo ADMIN
**Dado** usuário ADMIN
**Quando** pergunta sobre uma fazenda, várias, ou todas
**Então** backend aplica escopo solicitado na geração da resposta.

### Cenário 4 — Pergunta de estoque
**Dado** pergunta "quanto tem de café no estoque"
**Quando** processada
**Então** backend consulta dados reais de estoque e responde com valores coerentes.

### Cenário 5 — Persistência de conversa
**Dado** sessão ativa
**Quando** pergunta/resposta são processadas
**Então** ambas são gravadas no histórico da sessão.

---

## 🛠️ Implementação

### ia.controller.js (EXISTENTE — MODIFICAR)

Métodos existentes (não alterar):
* Arquivo existente sem implementação.

Métodos NOVOS a adicionar:
* chat() -> POST /api/ia/chat
* getHistorico() -> GET /api/ia/chat/sessoes/:sessaoId

### ia.service.js (EXISTENTE — MODIFICAR)

Lógica existente (não alterar):
→ Arquivo existente sem implementação.

Lógica NOVA a adicionar:
→ Resolver contexto do usuário (role + fazendas vinculadas).
→ Interpretar intenção da pergunta (estoque, gastos, lucros, etc.).
→ Consultar repositórios de domínio necessários.
→ Montar prompt contextualizado para o provedor de IA.
→ Aplicar guardrails de escopo e segurança.
→ Persistir histórico de sessão/mensagens.

### ia.repository.js (NOVO — CRIAR)

Criar em: src/repositories/ia.repository.js
Seguir padrão de: src/repositories/usuario.repository.js
→ criarSessao(usuarioId)
→ salvarMensagem(sessaoId, papel, conteudo, metadados)
→ buscarHistorico(sessaoId, usuarioId)

### ia.routes.js (EXISTENTE — MODIFICAR)

Rotas existentes (não alterar):
* Arquivo existente sem implementação.

Rotas NOVAS a adicionar:
* POST /api/ia/chat
* GET /api/ia/chat/sessoes/:sessaoId

### routes/index.js (EXISTENTE — MODIFICAR)

Rotas NOVAS a adicionar:
* /api/ia

---

## 📐 Schemas (Zod)

### ia.schema.js (NOVO — CRIAR)

Criar em: src/schemas/ia.schema.js

→ chatPerguntaSchema:
- sessaoId: string uuid opcional
- pergunta: string min(2) obrigatoria
- contextoFazendas: array opcional (ADMIN)

→ chatHistoricoSchema:
- sessaoId: string uuid obrigatorio

---

## 🚫 Regras de Negócio

- Chatbot nunca pode retornar dados fora do escopo autorizado do usuário.
- Para FUNCIONARIO, consultas sempre limitadas às fazendas vinculadas.
- Para ADMIN, permitir consultas segmentadas por uma/múltiplas/todas fazendas.
- Respostas devem priorizar dados da aplicação antes de inferências gerais.

---

# [STORY FRONTEND] Refinamento Chatbot — Frontend

Tipo:        Story
Prioridade:  🔼 High
Sprint:      (preencher)
Categoria:   Frontend
Relator:     (preencher)
Pai:         [EPIC] Refinamento do Chatbot
Data Limite: (preencher)

## 📝 Descrição
Como usuário do AgroFarm, eu quero abrir um modal/painel de chat a partir do dashboard e fazer perguntas rápidas, para obter respostas contextuais da operação.

---

## ✅ Critérios de Aceite

### Cenário 1 — Abrir/fechar modal
**Dado** dashboard carregado
**Quando** clico no ícone do chatbot
**Então** abre modal/painel com histórico e input.

### Cenário 2 — Enviar mensagem
**Dado** pergunta digitada
**Quando** pressiono enviar
**Então** mensagem do usuário aparece e resposta do assistente é renderizada na sequência.

### Cenário 3 — Estados de carregamento
**Dado** requisição em andamento
**Quando** aguardando resposta
**Então** exibe estado de "digitando/carregando" sem travar UI.

### Cenário 4 — Persistência de sessão
**Dado** conversa em andamento
**Quando** modal é fechado e reaberto
**Então** histórico da sessão permanece disponível.

### Cenário 5 — Tratamento de erro
**Dado** falha na API de chat
**Quando** envio pergunta
**Então** mostra mensagem amigável de erro e permite tentar novamente.

---

## 🛠️ Implementação

### pages/Dashboard/Dashboard.jsx (EXISTENTE — MODIFICAR)

NOVO a adicionar:
→ Acionador do chatbot no botão fixo ✨.
→ Controle de estado open/close do modal.

### components/chatbot/ChatbotModal.jsx (NOVO — CRIAR)

Criar em: src/components/chatbot/ChatbotModal.jsx
Seguir padrão de: modais existentes (Gastos/Usuários)
→ Estrutura de conversa (mensagens usuário/assistente).
→ Input + botão enviar.
→ Scroll automático para última mensagem.

### components/chatbot/ChatMessageList.jsx (NOVO — CRIAR)

Criar em: src/components/chatbot/ChatMessageList.jsx
→ Render das mensagens com estilos distintos por papel.

### components/chatbot/ChatInputBar.jsx (NOVO — CRIAR)

Criar em: src/components/chatbot/ChatInputBar.jsx
→ Campo de texto + ação de envio.

### queries/ia/useIAQueries.js (EXISTENTE — MODIFICAR)

Existente (não alterar):
→ Arquivo existente sem implementação.

NOVO a adicionar:
→ useChatMutation()
→ useChatHistoryQuery(sessaoId)

### services/ia/ia.service.js (EXISTENTE — MODIFICAR)

Existente (não alterar):
→ Arquivo existente sem implementação.

NOVO a adicionar:
→ enviarPergunta({ sessaoId, pergunta, contextoFazendas? }) -> POST /api/ia/chat
→ buscarHistorico(sessaoId) -> GET /api/ia/chat/sessoes/:sessaoId

### Endpoints consumidos

- POST /api/ia/chat
- GET /api/ia/chat/sessoes/:sessaoId

---
