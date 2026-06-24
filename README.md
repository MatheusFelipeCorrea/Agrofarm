# AgroFarm

O AgroFarm é um sistema desenvolvido com o objetivo de auxiliar o produtor rural na organização e registro das atividades de cada fazenda, reunindo em um único lugar informações sobre produção, uso de insumos, estoque, colheita e demais operações. A proposta é facilitar o acompanhamento das atividades agrícolas e permitir que ele tenha maior controle sobre tudo o que acontece na propriedade, com foco em quem ainda não utiliza nenhum método formal de organização, ajudando a registrar e estruturar essas informações de forma simples, prática e eficiente.
---

## Equipe

| Integrante |
| ---------- |
| Alice Shikida Salomão |
| Fernanda Soares Oliveira Cunha |
| Gabriel Lacerda Lemos da Silva |
| Júlia Rocha Fiorini |
| Matheus Dias Mendes |
| Matheus Felipe Correa da Silva |

**Professores responsáveis:** Leonardo Vilela Cardoso · Filipe Torio Lopes Ruas Nhimi

---

## Visão geral

| Item | Detalhe |
| ---- | ------- |
| **Arquitetura** | Frontend **React 19 + Vite 6** · Backend **Node.js + Express** · **PostgreSQL** via **Prisma 5** |
| **Autenticação** | JWT · papéis **ADMIN** e **FUNCIONARIO** · menu dinâmico por perfil |
| **Integrações** | Google Gemini (chat e insights) · Evolution API (WhatsApp) · cotações USD/EUR · IBPT (simulação fiscal) · Resend (e-mail) |
| **Mapas** | MapLibre GL + talhões georreferenciados (PostGIS) por fazenda |
| **Código-fonte** | `Codigo/Agrofarm/api` (backend) · `Codigo/Agrofarm/web` (frontend) |
| **Hospedagem** | [agrofarm-fawn.vercel.app](https://agrofarm-fawn.vercel.app) (Vercel) |

---

## Módulos do sistema

| Módulo | Descrição | API | Web |
| ------ | --------- | --- | --- |
| **Autenticação** | Login, cadastro, recuperação e troca de senha | ✅ | ✅ |
| **Usuários** | CRUD restrito a ADMIN, vínculo com fazendas | ✅ | ✅ |
| **Fazendas** | CRUD, tipos (própria/arrendamento), detalhe com abas | ✅ | ✅ |
| **Culturas** | Catálogo global + vínculo por fazenda (status operacional) | ✅ | ✅ |
| **Mapa / Talhões** | Desenho de polígonos, hectares automáticos, histórico | ✅ | ✅ |
| **Colheitas** | Registro por fazenda, cultura, área e safra | ✅ | ✅ |
| **Gastos** | CRUD com filtros, resumo, tipos customizados, lembrete opcional | ✅ | ✅ |
| **Lucros** | Vendas de colheita e arrendamento | ✅ | ✅ |
| **Estoque** | Saldo de sacas, arrendamentos pendentes | ✅ | ✅ |
| **Insumos** | Registro de atividades e materiais por fazenda | ✅ | ✅ |
| **Lembretes** | Calendário, recorrência, envio WhatsApp | ✅ | ✅ |
| **Dashboard** | KPIs, gráficos, extrato, produção e estoque | ✅ | ✅ |
| **Simulação** | Cálculo de abatimento de dívida com taxas e câmbio | ✅ | ✅ |
| **Insights IA** | Cards analíticos gerados por Gemini | ✅ | ✅ |
| **Chat IA** | Assistente conversacional com contexto da fazenda | ✅ | ✅ |
| **Notícias** | Feed agro + previsão do tempo por fazenda | ✅ | ✅ |
| **Notificações** | Alertas in-app (lembretes, insumos, arrendamento) | ✅ | ✅ |
| **Cotações** | Dólar, euro e painel de mercado | ✅ | ✅ |

---

## Estrutura do repositório

```text
pmg-es-2026-1-ti4-3170100-agrofarm/
├── Codigo/
│   ├── README.md                    ← guia de execução do código
│   └── Agrofarm/
│       ├── api/                     ← backend Express
│       │   ├── Readme.md
│       │   └── Documents/Readme.md  ← documentação técnica da API
│       └── web/                     ← frontend React
│           ├── README.md
│           └── Documents/Readme.md  ← documentação técnica do web
├── Documentacao/                    ← documentos acadêmicos do projeto
├── Artefatos/                       ← diagramas, atas, DER, casos de uso
├── Divulgacao/                      ← apresentação e vídeo (cópias de divulgação)
├── Apresentacao/                    ← slides (atalho local)
└── Video/                           ← vídeo do projeto (atalho local)
```

---

## Como executar

### Pré-requisitos

- **Node.js** 20+
- **npm** 10+
- Arquivo `.env` preenchido (solicitar credenciais ao responsável técnico da equipe)

### Backend

```bash
cd Codigo/Agrofarm/api
npm install
cp .env.example .env
npm run db:generate
npm run db:seed        # apenas na primeira configuração
npm run dev
```

API disponível em **http://localhost:3333**

### Frontend

```bash
cd Codigo/Agrofarm/web
npm install
cp .env.example .env
npm run dev
```

Interface disponível em **http://localhost:5173**

> Consulte [`Codigo/README.md`](Codigo/README.md) para instruções completas, scripts disponíveis e variáveis de ambiente.

---

## Documentação técnica

| Documento | Conteúdo |
| --------- | -------- |
| [`Codigo/README.md`](Codigo/README.md) | Setup, scripts, integrações e boas práticas |
| [`Codigo/Agrofarm/api/Documents/Readme.md`](Codigo/Agrofarm/api/Documents/Readme.md) | Arquitetura, rotas, camadas e regras de negócio da API |
| [`Codigo/Agrofarm/web/Documents/Readme.md`](Codigo/Agrofarm/web/Documents/Readme.md) | Arquitetura, rotas, camadas e fluxo de dados do frontend |

---

## Papéis de acesso

| Papel | Acesso |
| ----- | ------ |
| **ADMIN** | Dashboard, fazendas, colheitas, gastos, lucros, estoque, insumos, lembretes, simulação, insights, chat IA, notícias, usuários |
| **FUNCIONARIO** | Insumos (registro nas fazendas vinculadas) |

O menu lateral é montado dinamicamente pelo backend (`buildMenuForRole`) e validado no frontend via `routeAccess.js`.

---

## Banco de dados

- **PostgreSQL** hospedado no **Neon** (produção/desenvolvimento compartilhado).
- Modelagem em `Codigo/Agrofarm/api/prisma/schema.prisma`.
- Após alterações no schema: `npm run db:generate` (não executar `migrate dev` sem alinhamento com a equipe).

---

## Testes

```bash
# Backend
cd Codigo/Agrofarm/api && npm test

# Frontend
cd Codigo/Agrofarm/web && npm test
```

Ambos os projetos usam **Vitest 3** com suporte a cobertura (`npm run test:coverage`).
