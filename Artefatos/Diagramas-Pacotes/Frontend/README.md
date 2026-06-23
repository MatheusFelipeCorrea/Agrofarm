# Diagramas de Pacotes — Frontend

Diagramas UML de pacotes da arquitetura frontend do Agrofarm (`web/src`).

---

## Versões dos diagramas

| Versão | Data       | Descrição | Autor | Diagrama |
|--------|------------|-----------|-------|----------|
| 1.1    | 21/06/2026 | Pacotes atualizados: pages, components, queries, services, store e integração com API | Matheus Felipe Correa | [diagrama de pacotes frontend- ti4.png](diagrama%20de%20pacotes%20frontend-%20ti4.png) |
| 1.0    | 21/03/2026 | Versão inicial (PDF) | Gabriel Lacerda | [diagrama de pacotes frontend- ti4.pdf](diagrama%20de%20pacotes%20frontend-%20ti4.pdf) |

---

## Estrutura de pacotes (v1.1)

| Pacote | Responsabilidade |
|--------|------------------|
| `pages` | Telas por módulo (Dashboard, Fazendas, Simulação, Chatbot, etc.) |
| `components` | UI reutilizável e componentes de domínio |
| `layouts` | Estrutura visual (MainLayout) |
| `routes` | Rotas e controle de acesso |
| `queries` | Hooks React Query (cache e mutations) |
| `services` | Chamadas HTTP à API |
| `store` | Estado global (Zustand) |
| `hooks` | Hooks compartilhados |
| `utils` | Formatadores, validadores, helpers |
| `lib` | Query client, notificações, clima |

---

*Adicione novas versões acima da última linha, em ordem decrescente de data.*

**Última atualização do README:** 21/06/2026
