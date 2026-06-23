# Diagramas de Pacotes — Backend

Diagramas UML de pacotes da arquitetura backend do Agrofarm (`api/src`).

---

## Versões dos diagramas

| Versão | Data       | Descrição | Autor | Diagrama |
|--------|------------|-----------|-------|----------|
| 1.1    | 21/06/2026 | Pacotes atualizados: routes, controllers, services, repositories, jobs, shared e integrações | Matheus Felipe Correa | [diagrama de pacote backend- ti4.png](diagrama%20de%20pacote%20backend-%20ti4.png) |
| 1.0    | 21/03/2026 | Versão inicial (PDF) | Gabriel Lacerda | [diagrama de pacote backend- ti4.pdf](diagrama%20de%20pacote%20backend-%20ti4.pdf) |

---

## Estrutura de pacotes (v1.1)

| Pacote | Responsabilidade |
|--------|------------------|
| `config` | Variáveis de ambiente, CORS |
| `middlewares` | Auth, roles, validação Zod, logger, rate limit, erros |
| `routes` | Endpoints REST por domínio |
| `controllers` | Entrada/saída HTTP |
| `schemas` | Validação de payloads |
| `services` | Regras de negócio e integrações externas |
| `repositories` | Acesso a dados (Prisma) |
| `views` | Formatação de respostas (DTO) |
| `shared` | Utilitários, Gemini, menu, constantes |
| `jobs` | Cron: lembretes, cotações, arquivamento de mapa |
| `database` | Client Prisma e seeds |

---

*Adicione novas versões acima da última linha, em ordem decrescente de data.*

**Última atualização do README:** 21/06/2026
