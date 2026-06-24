# Diagramas de Arquitetura — Agrofarm

Diagramas de arquitetura e modelagem do sistema Agrofarm (padrão **C4 Model Level 2 — Container**).

---

## Versões dos diagramas

| Versão | Data       | Descrição | Autor | Arquivo |
|--------|------------|-----------|-------|---------|
| 2.0    | 21/06/2026 | Arquitetura atualizada: React, Express, Prisma, jobs (lembretes, cotações, mapa), integrações Gemini, Evolution, cotações e IBPT | Matheus Felipe Correa | [Diagrama de Arquitetura2.png](Diagrama%20de%20Arquitetura2.png) |
| 1.1    | 04/05/2026 | Mapa visual da arquitetura (camadas, integrações e fluxos) | Gabriel Lacerda | [Diagrama de Arquitetura Mapa- ti4.png](Diagrama%20de%20Arquitetura%20Mapa-%20ti4.png) |
| 1.0    | 24/03/2026 | Diagrama inicial da arquitetura do backend (PDF) | Gabriel Lacerda | [Diagrama de Arquitetura - ti4.pdf](Diagrama%20de%20Arquitetura%20-%20ti4.pdf) |

> **Referência recomendada:** versão **2.0** (`Diagrama de Arquitetura2.png`).

**Fonte editável:** [agrofarm-arquitetura-c4.puml](agrofarm-arquitetura-c4.puml) — exporte para PNG/PDF com a extensão PlantUML ou [plantuml.com](https://www.plantuml.com/plantuml/uml/).

---

## Conteúdo da versão 2.0

- Frontend React (Vite) e backend Node.js/Express
- Camadas: middlewares → routes → controllers → services → views → repositories
- Persistência PostgreSQL (Neon) via Prisma ORM
- Jobs em background: lembretes, atualização/limpeza de cotações, arquivamento de talhões
- Integrações externas: Google Gemini (Chat IA + Insights), Evolution API (WhatsApp), APIs de cotação, IBPT/Valraw (simulação), Resend (e-mail), RSS e Open-Meteo (clima)

---

## Fluxo de dados

```
Usuário (React SPA)
    ↓ HTTPS/JSON
Express Server (/api)
    ↓
Middlewares (Helmet, CORS, JWT, Zod, Rate Limit, Logger)
    ↓
Controllers → Services → Views
    ↓
Repositories (Prisma)
    ↓
PostgreSQL (Neon)
```

---

## Padrões utilizados

- MVC + Service Layer + Repository Pattern
- Autenticação JWT e autorização por perfil (ADMIN / FUNCIONARIO)
- Validação de entrada com Zod
- Logs estruturados (Pino) e tratamento centralizado de erros

---

*Adicione novas versões acima da última linha, em ordem decrescente de data.*

**Última atualização do README:** 21/06/2026
