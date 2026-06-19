# [FIX] Sidebar com Menu Dinâmico por Permissão

Tipo:        Fix
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Frontend, Backend, Autorização, UX
Relator:     (preencher)
Pai:         (sem pai)
Data Limite: (preencher)

## 📌 Status Auditado no Codigo (25/04/2026)

- Backend ja monta menu por permissao em `menu.config.js` e devolve `menu` em `login` e `GET /auth/me`. (CONCLUIDO)
- Frontend ja renderiza a sidebar a partir do menu da store, com item ativo, grupo expansivel e logout integrado. (CONCLUIDO)
- Protecao de navegacao com `PublicRoute`, `PrivateRoute` e `AdminRoute` esta ativa e alinhada ao menu. (CONCLUIDO)
- Pendencias atuais do sistema estao nos modulos de destino, nao neste fix de sidebar. (CONCLUIDO)

## 📝 Descrição

Como usuário autenticado do AgroFarm,
eu quero que a sidebar siga o layout e seja carregada a partir do backend conforme meu perfil,
para visualizar apenas os módulos que realmente posso acessar, sem expor para funcionários opções exclusivas do administrador.

Hoje existe um descompasso importante na aplicação:
- a sidebar desktop existente está vazia;
- o menu funcional está hardcoded no header mobile;
- a lista de itens visíveis é definida no frontend;
- o backend não entrega uma árvore de navegação por permissão.

Este fix deve corrigir a navegação lateral para que:
- o layout fique aderente ao layout;
- o menu seja retornado pelo backend conforme o perfil do usuário;
- o frontend renderize apenas os itens recebidos;
- o funcionário não descubra, nem por inspeção simples da UI, módulos exclusivos do administrador.

---

## 🎯 Escopo Funcional

- Implementar sidebar visual conforme o layout.
- Exibir logo, bloco do usuário logado, menu principal e ação de logout.
- Transformar o grupo `Fazendas` em item expansível/retrátil.
- Unificar a mesma fonte de dados para sidebar desktop e menu mobile.
- Carregar a árvore de navegação a partir do backend após autenticação.
- Retornar somente itens permitidos para o perfil do usuário.
- Impedir que o frontend hardcode a lista completa de módulos.
- Permitir destaque visual do item ativo.
- Manter bloqueio real de rotas no frontend e no backend, sem depender só da ocultação do menu.

---

## ✅ Critérios de Aceite

### Cenário 1 — Menu vindo do backend
**Dado** que o usuário está autenticado
**Quando** a aplicação carrega a navegação
**Então** os itens da sidebar são obtidos via backend e não por lista fixa no frontend.

### Cenário 2 — Funcionário não vê itens de administrador
**Dado** que o usuário possui perfil `FUNCIONARIO`
**Quando** a sidebar é carregada
**Então** ela não exibe itens exclusivos de `ADMIN`.

### Cenário 3 — Funcionário não conhece opções ocultas
**Dado** que o usuário possui perfil `FUNCIONARIO`
**Quando** inspeciona a interface já carregada
**Então** o frontend não contém a árvore completa de navegação do administrador hardcoded para simples descoberta.

### Cenário 4 — Layout conforme layout
**Dado** que a sidebar foi renderizada
**Quando** o usuário visualiza a navegação
**Então** ela apresenta estrutura visual aderente ao layout com logo, usuário, itens principais, grupo `Fazendas` expansível e logout no rodapé.

### Cenário 5 — Estado ativo
**Dado** que o usuário está em uma rota da aplicação
**Quando** a sidebar é exibida
**Então** o item correspondente aparece destacado.

### Cenário 6 — Submenu de Fazendas
**Dado** que o item `Fazendas` possui filhos permitidos
**Quando** o usuário expande o grupo
**Então** os subitens permitidos são exibidos abaixo do item pai.

### Cenário 7 — Consistência desktop e mobile
**Dado** que a aplicação é acessada em desktop ou mobile
**Quando** a navegação é aberta
**Então** a mesma árvore de menu e as mesmas permissões são respeitadas nos dois formatos.

### Cenário 8 — Proteção real de acesso
**Dado** que o usuário tenta acessar diretamente uma rota não permitida
**Quando** a navegação é feita por URL
**Então** a aplicação bloqueia o acesso independentemente de o item aparecer ou não na sidebar.

### Cenário 9 — Falha ao carregar menu
**Dado** que ocorre erro ao obter a navegação
**Quando** a sidebar tenta carregar
**Então** a interface mostra fallback seguro sem expor itens indevidos.

---

# [STORY BACKEND] Fix Sidebar — Backend de Navegação por Permissão

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Backend
Relator:     (preencher)
Pai:         [FIX] Sidebar com Menu Dinâmico por Permissão
Data Limite: (preencher)

## 📝 Descrição
Como sistema, eu quero montar e retornar a árvore de navegação permitida para o usuário logado, para que o frontend renderize apenas os módulos autorizados para aquele perfil.

---

## ✅ Critérios de Aceite

### Cenário 1 — Retornar navegação do usuário logado
**Dado** que existe usuário autenticado
**Quando** GET /api/auth/me ou endpoint equivalente de navegação é chamado
**Então** a resposta inclui perfil, dados básicos do usuário e árvore de menu permitida.

### Cenário 2 — Árvore filtrada por perfil
**Dado** que o usuário é `ADMIN` ou `FUNCIONARIO`
**Quando** a navegação é montada
**Então** somente os itens compatíveis com o perfil são retornados.

### Cenário 3 — Filhos condicionais
**Dado** que um grupo possui subitens
**Quando** alguns filhos não são permitidos
**Então** apenas os filhos autorizados são retornados no grupo.

### Cenário 4 — Estrutura estável para frontend
**Dado** que o frontend consome a navegação
**Quando** a resposta é recebida
**Então** cada item possui estrutura padronizada para renderização.

---

## 🛠️ Implementação

### auth.service.js (EXISTENTE — MODIFICAR)

Hoje já retorna dados básicos de sessão no login.

Ajustar para também retornar:
- `menu`: array da navegação permitida;
- `usuario`: com nome e role padronizados para uso na sidebar.

Se necessário, adicionar método novo:
- `obterSessaoAtual()`
- `montarMenuPorPermissao(usuario)`

### auth.controller.js (EXISTENTE — MODIFICAR)

Adicionar ou ajustar endpoint para retornar a sessão atual com navegação.

Sugestão:
- `GET /api/auth/me`

### auth.routes.js (EXISTENTE — MODIFICAR)

Adicionar rota autenticada para sessão atual:
- `GET /api/auth/me`

### shared/navigation/menu.config.js (NOVO — CRIAR)

Criar configuração central de navegação no backend com:
- `id`
- `label`
- `path`
- `icon`
- `allowedRoles`
- `children`
- `ordem`

Observação:
A existência dessa configuração no backend é aceitável porque o problema é evitar exposição ao funcionário no frontend. A regra de negócio deve morar no servidor.

### Exemplo de payload esperado

```json
{
  "usuario": {
    "id": "uuid",
    "nome": "Daniel",
    "role": "ADMIN"
  },
  "menu": [
    {
      "id": "dashboard",
      "label": "Dashboard",
      "path": "/dashboard",
      "icon": "dashboard",
      "children": []
    },
    {
      "id": "fazendas",
      "label": "Fazendas",
      "path": null,
      "icon": "fazendas",
      "children": [
        {
          "id": "gerenciar-fazendas",
          "label": "Gerenciar Fazendas",
          "path": "/fazendas",
          "icon": "fazendas"
        },
        {
          "id": "gerenciar-gastos",
          "label": "Gerenciar Gastos",
          "path": "/gastos",
          "icon": "gastos"
        },
        {
          "id": "gerenciar-lucros",
          "label": "Gerenciar Lucros",
          "path": "/lucros",
          "icon": "lucros"
        },
        {
          "id": "gerenciar-estoque",
          "label": "Gerenciar Estoque",
          "path": "/estoque",
          "icon": "estoque"
        },
        {
          "id": "gerenciar-colheitas",
          "label": "Gerenciar Colheitas",
          "path": "/colheitas",
          "icon": "colheitas"
        }
      ]
    }
  ]
}
```

---

## 🚫 Regras de Negócio

- O frontend não deve ser a fonte de verdade das permissões do menu.
- `FUNCIONARIO` recebe apenas os itens autorizados para seu perfil.
- A ocultação da sidebar não substitui proteção de rota e autorização no backend.
- O grupo `Fazendas` pode existir sem rota própria e servir apenas como agrupador expansível.
- O payload de navegação deve ser único e reutilizável entre desktop e mobile.

---

# [STORY FRONTEND] Fix Sidebar — Frontend e Experiência de Navegação

Tipo:        Story
Prioridade:  🔺 Highest
Sprint:      (preencher)
Categoria:   Frontend
Relator:     (preencher)
Pai:         [FIX] Sidebar com Menu Dinâmico por Permissão
Data Limite: (preencher)

## 📝 Descrição
Como usuário autenticado, eu quero navegar por uma sidebar moderna, consistente e aderente ao layout, para encontrar rapidamente apenas as telas que fazem sentido para meu perfil.

---

## ✅ Critérios de Aceite

### Cenário 1 — Sidebar desktop funcional
**Dado** que estou em layout desktop
**Quando** acesso uma área autenticada
**Então** vejo a sidebar completa no lado esquerdo da tela.

### Cenário 2 — Menu mobile consistente
**Dado** que estou em mobile
**Quando** abro o menu lateral
**Então** vejo a mesma árvore de navegação recebida do backend.

### Cenário 3 — Dados do usuário no topo
**Dado** que a sessão está carregada
**Quando** a sidebar renderiza
**Então** o topo mostra nome e papel do usuário logado.

### Cenário 4 — Logout no rodapé
**Dado** que a sidebar está visível
**Quando** visualizo o rodapé
**Então** o botão de logout aparece fixado na parte inferior.

### Cenário 5 — Grupo expansível
**Dado** que existe item agrupador com filhos
**Quando** clico em `Fazendas`
**Então** o submenu expande e retrai sem quebrar a navegação.

### Cenário 6 — Highlight da rota atual
**Dado** que estou em uma página ativa
**Quando** a sidebar renderiza
**Então** o item correspondente fica com destaque visual.

### Cenário 7 — Loading seguro
**Dado** que a navegação ainda está carregando
**Quando** a sidebar é exibida
**Então** ela mostra skeleton ou estado neutro sem listar itens incorretos.

---

## 🛠️ Implementação

### components/shared/Sidebar/Sidebar.jsx (EXISTENTE — MODIFICAR)

Hoje:
- arquivo existe, mas retorna apenas `<aside className="hidden" aria-hidden />`.

Novo comportamento:
- renderizar sidebar real do desktop;
- consumir menu vindo da sessão/autenticação;
- exibir bloco do usuário logado;
- renderizar itens simples e grupos expansíveis;
- fixar logout no rodapé;
- seguir o visual do layout.

### components/shared/Header/Header.jsx (EXISTENTE — MODIFICAR)

Hoje:
- contém menu mobile hardcoded com `navLinks` locais.

Novo comportamento:
- remover `navLinks` fixos;
- reutilizar a mesma fonte de dados da sidebar;
- usar os mesmos grupos, itens e permissões do backend;
- manter comportamento responsivo de abrir/fechar.

### store/authStore.js (EXISTENTE — MODIFICAR)

Hoje:
- persiste apenas `token` e `usuario`.

Novo comportamento:
- persistir também `menu` ou estrutura equivalente da navegação;
- suportar atualização da sessão via endpoint `GET /api/auth/me`.

### queries/auth/useSessionQuery.js (NOVO — CRIAR)

Criar hook para:
- buscar sessão atual;
- sincronizar `usuario` e `menu` no store;
- lidar com refresh de tela.

### services/auth/auth.service.js (EXISTENTE OU NOVO — AJUSTAR)

Garantir métodos para:
- login;
- obter sessão atual;
- logout;
- normalização do payload com `usuario` + `menu`.

### components/shared/Sidebar/SidebarNavItem.jsx (NOVO — CRIAR)

Componente para item simples e item com filhos.

### components/shared/Sidebar/sidebarIcons.js (NOVO — CRIAR)

Mapa de ícones por chave retornada pelo backend.

---

## 📐 Regras Visuais do layout

- Fundo verde institucional.
- Logo no topo.
- Linha divisória abaixo da marca.
- Card de usuário com nome e perfil.
- Item ativo com fundo destacado.
- Grupo `Fazendas` com seta de expansão.
- Subitens com recuo visual.
- Logout separado por linha no rodapé.

---

# [STORY ROTAS E SEGURANÇA] Fix Sidebar — Alinhamento de Navegação e Proteção

Tipo:        Story
Prioridade:  🔼 High
Sprint:      (preencher)
Categoria:   Frontend, Backend, Segurança
Relator:     (preencher)
Pai:         [FIX] Sidebar com Menu Dinâmico por Permissão
Data Limite: (preencher)

## 📝 Descrição
Como sistema, eu quero alinhar o que aparece na navegação com o que pode ser acessado de fato, para evitar inconsistência entre menu visível e autorização real.

---

## ✅ Critérios de Aceite

### Cenário 1 — Item visível e rota permitida
**Dado** que um item está presente no menu retornado
**Quando** o usuário navega para a rota correspondente
**Então** a proteção de rota permite acesso compatível com o perfil.

### Cenário 2 — Item ausente e rota bloqueada
**Dado** que a rota não foi retornada para o usuário
**Quando** ele tenta acessá-la manualmente
**Então** a navegação é redirecionada ou bloqueada conforme a regra da aplicação.

### Cenário 3 — Expansão futura sem retrabalho
**Dado** que novos módulos forem criados no futuro
**Quando** forem adicionados à configuração central
**Então** o menu e as permissões permanecem consistentes sem duplicação de regra no frontend.

---

## 🛠️ Implementação

### routes/ProtectedRoute.jsx (EXISTENTE — MODIFICAR)

Hoje:
- há `PrivateRoute` e `AdminRoute`.

Ajustar para suportar melhor:
- rota por permissão/role;
- fallback coerente com a primeira rota permitida do usuário;
- integração com a árvore de menu quando fizer sentido.

### App.jsx (EXISTENTE — MODIFICAR)

Hoje:
- existem poucas rotas registradas;
- `/usuarios` está protegida por `AdminRoute`.

Ajustar para manter consistência entre:
- rotas existentes;
- itens disponíveis no menu;
- futuras telas previstas no backlog.

---

## ✅ Resultado Esperado do Fix

Ao final deste fix:
- a sidebar desktop deixa de ser vazia;
- o header mobile deixa de ter menu hardcoded;
- a navegação passa a ser dirigida pelo backend;
- o funcionário não recebe no frontend opções exclusivas do administrador;
- a UI fica aderente ao layout;
- a base de navegação fica preparada para os próximos épicos.

---

## 📂 Arquivos Impactados

### Frontend
- `Codigo/Agrofarm/web/src/components/shared/Sidebar/Sidebar.jsx` (EXISTENTE — MODIFICAR)
- `Codigo/Agrofarm/web/src/components/shared/Header/Header.jsx` (EXISTENTE — MODIFICAR)
- `Codigo/Agrofarm/web/src/store/authStore.js` (EXISTENTE — MODIFICAR)
- `Codigo/Agrofarm/web/src/routes/ProtectedRoute.jsx` (EXISTENTE — MODIFICAR)
- `Codigo/Agrofarm/web/src/App.jsx` (EXISTENTE — MODIFICAR)
- `Codigo/Agrofarm/web/src/components/shared/Sidebar/SidebarNavItem.jsx` (NOVO — CRIAR)
- `Codigo/Agrofarm/web/src/components/shared/Sidebar/sidebarIcons.js` (NOVO — CRIAR)
- `Codigo/Agrofarm/web/src/queries/auth/useSessionQuery.js` (NOVO — CRIAR)
- `Codigo/Agrofarm/web/src/services/auth/auth.service.js` (EXISTENTE OU NOVO — AJUSTAR)

### Backend
- `Codigo/Agrofarm/api/src/controllers/auth.controller.js` (EXISTENTE — MODIFICAR)
- `Codigo/Agrofarm/api/src/services/auth.service.js` (EXISTENTE — MODIFICAR)
- `Codigo/Agrofarm/api/src/routes/auth.routes.js` (EXISTENTE — MODIFICAR)
- `Codigo/Agrofarm/api/src/shared/navigation/menu.config.js` (NOVO — CRIAR)