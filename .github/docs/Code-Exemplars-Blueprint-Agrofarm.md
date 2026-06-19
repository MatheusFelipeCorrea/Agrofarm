# Code Exemplars Blueprint - Agrofarm

Data: 2026-04-19

## Objetivo
Este guia define exemplares de codigo para acelerar novas features no padrao atual do projeto.

Stack de referencia:
- API: Node.js, Express, Prisma, Zod, JWT.
- Web: React, Vite, TanStack Query, Zustand, Axios.

## Checklist rapido para criar um novo modulo
- [ ] Definir contrato da feature (rotas, DTOs, regras de negocio).
- [ ] Implementar backend por camadas (`routes -> controller -> service -> repository`).
- [ ] Proteger rotas com `authMiddleware` e `authorize` quando necessario.
- [ ] Criar `queries` e `services` no frontend com invalicao de cache.
- [ ] Garantir validacao de entrada no backend (Zod + `validate`).
- [ ] Cobrir casos criticos com testes (unitario + integracao).

## 1) Exemplar backend (API)

### 1.1 Estrutura de arquivos por dominio
Para um dominio `fazenda`, seguir:

- `src/routes/fazenda.routes.js`
- `src/controllers/fazenda.controller.js`
- `src/services/fazenda.service.js`
- `src/repositories/fazenda.repository.js`
- `src/schemas/fazenda.schema.js`
- `src/views/fazenda.view.js`

### 1.2 Exemplar de schema Zod
```js
import { z } from 'zod'

export const createFazendaSchema = z.object({
  nome: z.string().min(3),
  localizacao: z.string().min(3),
})

export const updateFazendaSchema = createFazendaSchema.partial()
```

### 1.3 Exemplar de rota
```js
import { Router } from 'express'
import { fazendaController } from '../controllers/fazenda.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/role.middleware.js'
import { validate } from '../middlewares/validator.middleware.js'
import { createFazendaSchema, updateFazendaSchema } from '../schemas/fazenda.schema.js'

const router = Router()

router.use(authMiddleware)
router.get('/', fazendaController.getAll)
router.post('/', authorize('ADMIN'), validate(createFazendaSchema), fazendaController.create)
router.put('/:id', authorize('ADMIN'), validate(updateFazendaSchema), fazendaController.update)
router.delete('/:id', authorize('ADMIN'), fazendaController.delete)

export { router as fazendaRoutes }
```

### 1.4 Exemplar de controller
```js
import { fazendaService } from '../services/fazenda.service.js'
import { fazendaView } from '../views/fazenda.view.js'

export const fazendaController = {
  getAll: async (req, res, next) => {
    try {
      const items = await fazendaService.listarTodos(req.usuario)
      return res.status(200).json(items.map(fazendaView.render))
    } catch (error) {
      next(error)
    }
  },

  create: async (req, res, next) => {
    try {
      const item = await fazendaService.criar(req.body, req.usuario)
      return res.status(201).json(fazendaView.render(item))
    } catch (error) {
      next(error)
    }
  },
}
```

### 1.5 Exemplar de service
```js
import { fazendaRepository } from '../repositories/fazenda.repository.js'
import { AppError } from '../shared/errors/AppError.js'

export const fazendaService = {
  listarTodos: async () => {
    return fazendaRepository.buscarTodos()
  },

  criar: async (dados) => {
    const jaExiste = await fazendaRepository.buscarPorNome(dados.nome)
    if (jaExiste) throw new AppError('Fazenda ja cadastrada', 409)

    return fazendaRepository.create(dados)
  },
}
```

### 1.6 Exemplar de repository (Prisma)
```js
import prisma from '../database/client.js'

export const fazendaRepository = {
  buscarTodos: async () => {
    return prisma.fazendas.findMany({ orderBy: { criado_em: 'desc' } })
  },

  buscarPorNome: async (nome) => {
    return prisma.fazendas.findFirst({ where: { nome } })
  },

  create: async (dados) => {
    return prisma.fazendas.create({ data: dados })
  },
}
```

### 1.7 Exemplar de view
```js
export const fazendaView = {
  render: (f) => ({
    id: f.id,
    nome: f.nome,
    localizacao: f.localizacao,
    criado_em: f.criado_em,
  }),
}
```

## 2) Exemplar transversal (erros e seguranca)

### 2.1 Erro de dominio padronizado
```js
throw new AppError('Recurso nao encontrado', 404)
```

### 2.2 Middleware de autenticao
Padrao atual: extrair `Bearer token`, validar com `verifyToken`, preencher `req.usuario`.

### 2.3 Middleware de autorizacao
Padrao atual: `authorize('ADMIN')` para rotas administrativas.

### 2.4 Recomendacao de padrao de resposta
```json
{
  "status": "error",
  "message": "Mensagem amigavel para o cliente"
}
```

## 3) Exemplar frontend (Web)

### 3.1 Service HTTP de dominio
Arquivo sugerido: `src/services/fazenda/fazenda.service.js`

```js
import { api } from '../api.js'

export async function listFazendas() {
  const { data } = await api.get('/fazendas')
  return data
}

export async function createFazenda(payload) {
  const { data } = await api.post('/fazendas', payload)
  return data
}
```

### 3.2 Queries TanStack
Arquivo sugerido: `src/queries/fazenda/useFazendaQueries.js`

```js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFazenda, listFazendas } from '../../services/fazenda/fazenda.service.js'

const FAZENDA_QUERY_KEY = ['fazendas']

export function useFazendaListQuery() {
  return useQuery({ queryKey: FAZENDA_QUERY_KEY, queryFn: listFazendas })
}

export function useCreateFazendaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFazenda,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FAZENDA_QUERY_KEY })
    },
  })
}
```

### 3.3 Exemplar de pagina
Arquivo sugerido: `src/pages/Fazendas/Fazendas.jsx`

```jsx
import { useFazendaListQuery } from '../../queries/fazenda/useFazendaQueries.js'

export default function Fazendas() {
  const { data = [], isLoading, isError } = useFazendaListQuery()

  if (isLoading) return <p>Carregando...</p>
  if (isError) return <p>Falha ao carregar fazendas.</p>

  return (
    <section>
      <h1>Fazendas</h1>
      <ul>
        {data.map((f) => (
          <li key={f.id}>{f.nome}</li>
        ))}
      </ul>
    </section>
  )
}
```

## 4) Exemplar de configuracao de ambiente

### 4.1 API (`Codigo/Agrofarm/api/.env`)
```dotenv
PORT=3333
DATABASE_URL=
JWT_SECRET=
CORS_ORIGIN=http://localhost:5173
```

### 4.2 Web (`Codigo/Agrofarm/web/.env`)
```dotenv
VITE_API_URL=http://localhost:3333/api
```

## 5) Exemplar de testes

### 5.1 Backend (service)
- Cenario feliz: cria recurso quando dados validos.
- Cenario de conflito: retorna erro 409 quando nome duplicado.
- Cenario de autorizacao: bloqueia perfil sem permissao.

### 5.2 Frontend (queries/page)
- Query renderiza loading e sucesso.
- Mutacao invalida cache apos sucesso.
- Estado de erro mostra feedback ao usuario.

## 6) Exemplar de gates de qualidade no CI

Baseado nos scripts atuais de `api` e `web`:
- API: `npm run lint`, `npm run test`, `npm run test:coverage`
- Web: `npm run lint`, `npm run test`, `npm run build`

Pipeline minimo recomendado:
1. Instalar dependencias.
2. Rodar lint em API e Web.
3. Rodar testes em API e Web.
4. Gerar build do frontend.

## 7) Definition of Done (DoD) para novas features
- [ ] DTO e schema validados.
- [ ] Endpoint protegido quando aplicavel.
- [ ] Regras de negocio implementadas no service.
- [ ] Persistencia isolada no repository.
- [ ] Hooks de query/mutation com invalidacao de cache.
- [ ] Testes minimos adicionados.
- [ ] Documentacao atualizada (README ou docs tecnicos).

## 8) Proxima aplicacao sugerida
Aplicar este blueprint primeiro em `gastos` (integracao completa API + Web) e depois replicar para `colheitas` e `cotacoes`, mantendo padrao unico entre os modulos.

