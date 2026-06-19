import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../repositories/auth.repository.js', () => ({
    authRepository: {
        buscarPorEmail: vi.fn(),
        buscarPorId: vi.fn(),
        create: vi.fn(),
        createComVinculos: vi.fn(),
        salvarTokenReset: vi.fn(),
        buscarPorTokenReset: vi.fn(),
        atualizarSenha: vi.fn(),
        concluirTrocaSenhaInicial: vi.fn(),
    },
}))

vi.mock('../../shared/utils/bcrypt.js', () => ({
    hash: vi.fn(),
    compare: vi.fn(),
}))

vi.mock('../../shared/utils/jwt.js', () => ({
    generateToken: vi.fn(),
}))

vi.mock('../../shared/utils/email.js', () => ({
    enviarEmailRedefinicao: vi.fn(),
}))

const { authService } = await import('../../services/auth.service.js')
const { authRepository } = await import('../../repositories/auth.repository.js')
const { compare, hash } = await import('../../shared/utils/bcrypt.js')
const { generateToken } = await import('../../shared/utils/jwt.js')
const { enviarEmailRedefinicao } = await import('../../shared/utils/email.js')

describe('authService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('exige troca de senha quando must_change_password esta ativo', async () => {
        authRepository.buscarPorEmail.mockResolvedValue({
            id: 'user-pw',
            email: 'novo@agrofarm.com',
            senha: 'hash',
            must_change_password: true,
        })
        compare.mockResolvedValue(true)

        const resultado = await authService.login({
            email: 'novo@agrofarm.com',
            senha: 'Senha123456',
        })

        expect(resultado).toEqual({
            requirePasswordChange: true,
            userId: 'user-pw',
        })
        expect(generateToken).not.toHaveBeenCalled()
    })

    it('retorna sessao com token e menu no login', async () => {
        const usuario = {
            id: 'user-1',
            nome: 'Daniel',
            email: 'daniel@agrofarm.com',
            senha: 'hash',
            role: 'ADMIN',
            must_change_password: false,
        }

        authRepository.buscarPorEmail.mockResolvedValue(usuario)
        compare.mockResolvedValue(true)
        generateToken.mockReturnValue('jwt-token')

        const resultado = await authService.login({
            email: 'daniel@agrofarm.com',
            senha: '123456',
        })

        expect(resultado.token).toBe('jwt-token')
        expect(resultado.usuario).toEqual(usuario)
        expect(resultado.menu).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: 'dashboard' }),
                expect.objectContaining({ id: 'gerenciar-usuarios' }),
            ]),
        )
    })

    it('retorna sessao atual filtrada por role sem token', async () => {
        const usuario = {
            id: 'user-2',
            nome: 'Funcionario',
            email: 'func@agrofarm.com',
            role: 'FUNCIONARIO',
        }

        authRepository.buscarPorEmail.mockResolvedValue(usuario)

        const resultado = await authService.obterSessaoAtual({ email: 'func@agrofarm.com' })

        expect(resultado).not.toHaveProperty('token')
        expect(resultado.usuario).toEqual(usuario)
        expect(resultado.menu.find((item) => item.id === 'gerenciar-usuarios')).toBeUndefined()
        expect(resultado.menu.find((item) => item.id === 'fazendas')).toBeUndefined()
        expect(resultado.menu.find((item) => item.id === 'gerenciar-insumos-funcionario')).toEqual(
            expect.objectContaining({ path: '/insumos' }),
        )
    })

    it('cria usuario com telefone e fazendas vinculadas no cadastro', async () => {
        authRepository.buscarPorEmail.mockResolvedValue(null)
        hash.mockResolvedValue('senha-hash')
        authRepository.createComVinculos.mockResolvedValue({
            id: 'user-3',
            nome: 'Funcionario',
            email: 'novo@agrofarm.com',
            role: 'FUNCIONARIO',
            telefone: '31999999999',
            usuarios_fazendas: [
                { fazendas: { id: 'faz-1', nome: 'Fazenda 1' } },
                { fazendas: { id: 'faz-2', nome: 'Fazenda 2' } },
            ],
        })

        const resultado = await authService.cadastro({
            nome: 'Funcionario',
            email: 'novo@agrofarm.com',
            role: 'FUNCIONARIO',
            telefone: '31999999999',
            fazendaIds: ['faz-1', 'faz-2', 'faz-1'],
        })

        expect(hash).toHaveBeenCalledWith('Senha123456')
        expect(authRepository.createComVinculos).toHaveBeenCalledWith({
            nome: 'Funcionario',
            email: 'novo@agrofarm.com',
            senha: 'senha-hash',
            role: 'FUNCIONARIO',
            telefone: '31999999999',
            fazendaIds: ['faz-1', 'faz-2'],
            mustChangePassword: true,
        })
        expect(resultado).toEqual(
            expect.objectContaining({
                id: 'user-3',
            }),
        )
    })

    it('bloqueia cadastro de funcionario sem fazendas vinculadas', async () => {
        authRepository.buscarPorEmail.mockResolvedValue(null)

        await expect(
            authService.cadastro({
                nome: 'Funcionario',
                email: 'semfazenda@agrofarm.com',
                role: 'FUNCIONARIO',
                fazendaIds: [],
            }),
        ).rejects.toMatchObject({
            message: 'Funcionario deve possuir ao menos uma fazenda vinculada',
            statusCode: 400,
        })

        expect(authRepository.createComVinculos).not.toHaveBeenCalled()
    })

    it('esqueciSenha envia email quando usuario existe', async () => {
        authRepository.buscarPorEmail.mockResolvedValue({ id: 'user-5', email: 'a@b.com', nome: 'User' })
        authRepository.salvarTokenReset.mockResolvedValue(undefined)
        enviarEmailRedefinicao.mockResolvedValue(undefined)

        await authService.esqueciSenha({ email: 'a@b.com' })

        expect(enviarEmailRedefinicao).toHaveBeenCalledWith('a@b.com', expect.any(String))
    })

    it('redefinirSenha atualiza hash quando token valido', async () => {
        authRepository.buscarPorTokenReset.mockResolvedValue({
            id: 'user-6',
            token_reset_expira: new Date(Date.now() + 60_000),
        })
        hash.mockResolvedValue('nova-hash')
        authRepository.atualizarSenha.mockResolvedValue(undefined)

        await authService.redefinirSenha({ token: 'tok', novaSenha: '123456' })

        expect(authRepository.atualizarSenha).toHaveBeenCalledWith('user-6', 'nova-hash')
    })

    it('conclui troca de senha inicial e retorna token de acesso', async () => {
        authRepository.buscarPorId.mockResolvedValue({
            id: 'user-4',
            nome: 'Funcionario',
            email: 'func@agrofarm.com',
            senha: 'hash-padrao',
            role: 'FUNCIONARIO',
            must_change_password: true,
        })
        compare.mockResolvedValue(true)
        hash.mockResolvedValue('nova-senha-hash')
        authRepository.concluirTrocaSenhaInicial.mockResolvedValue({
            id: 'user-4',
            nome: 'Funcionario',
            email: 'func@agrofarm.com',
            role: 'FUNCIONARIO',
            must_change_password: false,
        })
        generateToken.mockReturnValue('jwt-token')

        const resultado = await authService.changeInitialPassword({
            userId: 'user-4',
            oldPassword: 'Senha123456',
            newPassword: 'MinhaSenha8',
            confirmNewPassword: 'MinhaSenha8',
        })

        expect(hash).toHaveBeenCalledWith('MinhaSenha8')
        expect(authRepository.concluirTrocaSenhaInicial).toHaveBeenCalledWith('user-4', 'nova-senha-hash')
        expect(resultado.token).toBe('jwt-token')
    })
})