# Diagramas do Projeto Agrofarm

Este diretório contém os diagramas de arquitetura e modelagem do sistema Agrofarm.

---

## Versões dos diagramas

| Versão | Data       | Descrição | Autor | Arquivo |
|--------|------------|-----------|-------|---------|
| 1.0    | 24/03/2026 | Diagrama inicial da arquitetura do backend (PDF) | Gabriel Lacerda | [Diagrama de Arquitetura - ti4.pdf](Diagrama%20de%20Arquitetura%20-%20ti4.pdf) |
| 1.1    | 04/05/2026 | Mapa visual atualizado da arquitetura (camadas, integrações e fluxos) | Gabriel Lacerda | [Diagrama de Arquitetura Mapa- ti4.png](Diagrama%20de%20Arquitetura%20Mapa-%20ti4.png) |

---

## Arquivos

### 1.0 — `Diagrama de Arquitetura - ti4.pdf`

**Descrição**: Diagrama completo da arquitetura do backend do sistema Agrofarm.

**Conteúdo**:
- Arquitetura em camadas (MVC + Service + Repository)
- Integração com APIs externas (Google Gemini AI, Evolution API, Cotação API)
- Fluxo de dados e comunicação entre componentes
- Background processes (Cron Jobs para lembretes)
- Middlewares de segurança e validação
- Camada de persistência (PostgreSQL via Prisma ORM)

**Padrão**: C4 Model Level 2 (Container Level)

### 1.1 — `Diagrama de Arquitetura Mapa- ti4.png`

**Descrição**: Mapa único da arquitetura atual (recomendado para consulta rápida e entregas acadêmicas).

**Conteúdo** (alinhado ao código e às integrações descritas abaixo):

- Visão em mapa das camadas e dos fluxos principais
- Backend Node.js/Express, frontend React e persistência PostgreSQL (Prisma)
- Integrações externas (IA, WhatsApp, cotações) e job de lembretes

**Padrão**: C4 Model Level 2 (Container Level), em formato imagem.

---

## Visão geral da arquitetura

### **Frontend**
- React App (Cliente Web)
- Comunicação via HTTPS/JSON com o backend

### **Backend (Node.js + Express)**

#### **1. API Entry Point & Routing**
- Express Server
- Roteamento de requisições HTTP

#### **2. Middlewares**
- **Zod Validator**: Validação de dados de entrada
- **Auth JWT**: Autenticação via JSON Web Token
- **Role Middleware**: Autorização baseada em perfil (ADMIN/FUNCIONARIO)
- **Pino Logger**: Logs estruturados
- **Rate Limit**: Limitador de requisições
- **Error Middleware**: Tratamento centralizado de erros
- **Helmet**: Proteção de headers HTTP
- **Validação & Segurança**: Proteção contra ataques

#### **3. Controllers (MVC Pattern)**
- Recebe requisições HTTP
- Processa requisições
- Retorna respostas

#### **4. Domain Services (Business Logic)**
- **Fazenda Service**: Gestão de fazendas
- **Colheita Service**: Gestão de colheitas
- **Gasto Service**: Gestão de gastos
- **Lucro Service**: Gestão de lucros
- **Lembrete Service**: Gestão de lembretes
- **Insumo Service**: Gestão de insumos
- **Estoque Service**: Controle de estoque
- **Auth Service**: Autenticação e autorização
- **Usuario Service**: Gerenciamento de usuários (ADMIN)
- **Cultura Service**: Gestão de culturas
- **Cotacao Service**: Cotações financeiras
- **Simulacao Service**: Simulações financeiras
- **WhatsApp Service**: Integração com WhatsApp
- **AI Service**: Integração com IA

#### **5. Views Layer**
- Formata JSON de resposta
- Transforma dados dos Services em respostas padronizadas para o cliente
- Remove dados sensíveis

#### **6. Repositories (Prisma ORM)**
- Data Access Layer
- Única camada que acessa o banco de dados
- Abstração do Prisma ORM

#### **7. Database**
- **PostgreSQL** (Neon Host)
- Main Data Store
- Agrofarm DB

### **Background Process**

#### **Cron Job (node-cron)**
Dispara lembretes periodicamente:

1. Dispara o Cron periodicamente
2. Busca lembretes pendentes no banco
3. Atualiza status do lembrete
4. Envia mensagem via WhatsApp
5. Atualiza status para ENVIADO no banco

**Status**: PENDENTE → ENVIADO

### **External API Integrations**

#### **1. Google Gemini AI**
- Perguntas e Insights
- Análise inteligente de dados agrícolas

#### **2. Evolution API (WhatsApp)**
- Mensagens do WhatsApp
- Envio de lembretes e notificações

#### **3. Cotação API**
- Cotações Financeiras
- Preços de commodities agrícolas

---

## Fluxo de dados

```
User/Client (React)
    ↓ HTTPS/JSON
Express Server
    ↓
Middlewares (Validation, Auth, Logger)
    ↓
Controllers (MVC Pattern)
    ↓
Domain Services (Business Logic)
    ↓
Views Layer (Format JSON)
    ↓
Repositories (Prisma ORM)
    ↓
PostgreSQL (Neon Host)
```

---

## Legenda

- **Azul** (Sistema Container-Level): Componentes principais do sistema
- **Verde** (Nível de Abstração): Camadas lógicas da aplicação
- **Amarelo** (C4 Model Level 2): Detalhamento de componentes
- **Roxo tracejado** (Limite de Backend Externo): APIs externas

---

## Padrões utilizados

### **Arquitetura**
- MVC (Model-View-Controller)
- Service Layer (Lógica de negócio)
- Repository Pattern (Acesso a dados)
- Dependency Injection

### **Segurança**
- JWT (JSON Web Token)
- Bcrypt (Criptografia de senhas)
- Rate Limiting
- Validação de entrada (Zod)
- Middleware de autenticação
- Middleware de autorização (role-based)

### **Qualidade**
- Logs estruturados (Pino)
- Tratamento centralizado de erros
- Validação em camadas
- Separação de responsabilidades

---

## Integrações externas

### **Google Gemini AI**
- **Uso**: Análise inteligente de dados agrícolas
- **Endpoints**: `/api/ia/insights`, `/api/ia/chat`
- **Funcionalidade**: Gera insights e responde perguntas sobre a fazenda

### **Evolution API (WhatsApp)**
- **Uso**: Envio de mensagens e lembretes
- **Integração**: WhatsApp Service
- **Funcionalidade**: Notificações automáticas via WhatsApp

### **Cotação API**
- **Uso**: Consulta de cotações financeiras
- **Endpoint**: `/api/cotacao/dolar`
- **Funcionalidade**: Preços atualizados de commodities

---

## Observações

- Os diagramas seguem o padrão **C4 Model Level 2** (Container Level).
- Todas as camadas seguem o princípio de **separação de responsabilidades**.
- A arquitetura permite **escalabilidade** e **manutenibilidade**.
- Integração com APIs externas é **isolada** em services específicos.
- Processos em background rodam **independentemente** do servidor HTTP.
- **Versão 1.1 (PNG)**: use como referência visual atual; o **PDF 1.0** pode estar defasado em relação ao repositório.

### Evoluções recentes no código (conferir no mapa 1.1 e no código)

- **Usuario Service**: gerenciamento de usuários (ADMIN).
- **Role Middleware**: acesso por perfil (ADMIN / FUNCIONARIO).
- **Helmet**: segurança de headers HTTP.

---

**Última atualização do README**: 04/05/2026
