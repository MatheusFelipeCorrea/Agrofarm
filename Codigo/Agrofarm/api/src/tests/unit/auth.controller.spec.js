import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../services/auth.service.js', () => ({
    authService: {
        login: vi.fn(),
        obterSessaoAtual: vi.fn(),
        cadastro: vi.fn(),
        esqueciSenha: vi.fn(),
        redefinirSenha: vi.fn(),
        changeInitialPassword: vi.fn(),
    },
}))

const { authController } = await import('../../controllers/auth.controller.js')
const { authService } = await import('../../services/auth.service.js')

function createRes() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    }
}

describe('authController', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('responde 403 quando login exige troca de senha', async () => {
        const req = { body: { email: 'novo@agrofarm.com', senha: 'Senha123456' } }
        const res = createRes()
        const next = vi.fn()

        authService.login.mockResolvedValue({
            requirePasswordChange: true,
            userId: 'user-pw',
        })

        await authController.login(req, res, next)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                requirePasswordChange: true,
                userId: 'user-pw',
            }),
        )
        expect(next).not.toHaveBeenCalled()
    })

    it('responde login com usuario renderizado e menu', async () => {
        const req = { body: { email: 'admin@agrofarm.com', senha: '123456' } }
        const res = createRes()
        const next = vi.fn()

        authService.login.mockResolvedValue({
            token: 'jwt-token',
            usuario: {
                id: 'user-1',
                nome: 'Admin',
                email: 'admin@agrofarm.com',
                role: 'ADMIN',
                telefone: null,
                criado_em: new Date('2026-04-24T00:00:00.000Z'),
            },
            menu: [{ id: 'dashboard', label: 'Dashboard', path: '/', icon: 'dashboard', children: [] }],
        })

        await authController.login(req, res, next)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                token: 'jwt-token',
                menu: [{ id: 'dashboard', label: 'Dashboard', path: '/', icon: 'dashboard', children: [] }],
                usuario: expect.objectContaining({
                    id: 'user-1',
                    nome: 'Admin',
                    role: 'ADMIN',
                }),
            }),
        )
        expect(next).not.toHaveBeenCalled()
    })

    it('responde sessao atual com usuario renderizado e menu', async () => {
        const req = { usuario: { id: 'user-2', email: 'func@agrofarm.com', role: 'FUNCIONARIO' } }
        const res = createRes()
        const next = vi.fn()

        authService.obterSessaoAtual.mockResolvedValue({
            usuario: {
                id: 'user-2',
                nome: 'Funcionario',
                email: 'func@agrofarm.com',
                role: 'FUNCIONARIO',
                telefone: '31999999999',
                criado_em: new Date('2026-04-24T00:00:00.000Z'),
            },
            menu: [{ id: 'dashboard', label: 'Dashboard', path: '/', icon: 'dashboard', children: [] }],
        })

        await authController.me(req, res, next)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                menu: [{ id: 'dashboard', label: 'Dashboard', path: '/', icon: 'dashboard', children: [] }],
                usuario: expect.objectContaining({
                    id: 'user-2',
                    nome: 'Funcionario',
                    role: 'FUNCIONARIO',
                }),
            }),
        )
        expect(next).not.toHaveBeenCalled()
    })
})