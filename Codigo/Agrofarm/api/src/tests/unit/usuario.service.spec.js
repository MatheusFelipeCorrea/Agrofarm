import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../repositories/usuario.repository.js', () => ({
    usuarioRepository: {
        buscarTodos: vi.fn(),
        buscarTodosComFazendas: vi.fn(),
        buscarPorId: vi.fn(),
        buscarPorIdComFazendas: vi.fn(),
        buscarPorEmail: vi.fn(),
        update: vi.fn(),
        substituirFazendasDoUsuario: vi.fn(),
        delete: vi.fn(),
    },
}))

vi.mock('../../shared/utils/bcrypt.js', () => ({
    hash: vi.fn(),
}))

const { usuarioService } = await import('../../services/usuario.service.js')
const { usuarioRepository } = await import('../../repositories/usuario.repository.js')
const { hash } = await import('../../shared/utils/bcrypt.js')

describe('usuarioService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('lista usuarios com fazendas vinculadas', async () => {
        const usuarios = [{ id: 'user-1', usuarios_fazendas: [] }]
        usuarioRepository.buscarTodosComFazendas.mockResolvedValue(usuarios)

        const resultado = await usuarioService.listarTodos()

        expect(resultado).toEqual(usuarios)
        expect(usuarioRepository.buscarTodosComFazendas).toHaveBeenCalledTimes(1)
    })

    it('substitui fazendas vinculadas no update quando fazendaIds e informado', async () => {
        usuarioRepository.buscarPorIdComFazendas.mockResolvedValue({
            id: 'user-2',
            email: 'user@agrofarm.com',
            role: 'FUNCIONARIO',
        })
        usuarioRepository.update.mockResolvedValue({ id: 'user-2' })
        usuarioRepository.substituirFazendasDoUsuario.mockResolvedValue({
            id: 'user-2',
            usuarios_fazendas: [{ fazendas: { id: 'faz-1', nome: 'Fazenda 1' } }],
        })

        const resultado = await usuarioService.atualizar('user-2', {
            telefone: '31988887777',
            fazendaIds: ['faz-1', 'faz-1'],
        })

        expect(usuarioRepository.update).toHaveBeenCalledWith('user-2', {
            telefone: '31988887777',
        })
        expect(usuarioRepository.substituirFazendasDoUsuario).toHaveBeenCalledWith('user-2', ['faz-1'])
        expect(resultado).toEqual(
            expect.objectContaining({
                id: 'user-2',
            }),
        )
    })

    it('bloqueia update de funcionario sem fazendas quando fazendaIds vazio e informado', async () => {
        usuarioRepository.buscarPorIdComFazendas.mockResolvedValue({
            id: 'user-3',
            email: 'user3@agrofarm.com',
            role: 'FUNCIONARIO',
        })

        await expect(
            usuarioService.atualizar('user-3', {
                fazendaIds: [],
            }),
        ).rejects.toMatchObject({
            message: 'Funcionario deve possuir ao menos uma fazenda vinculada',
            statusCode: 400,
        })

        expect(usuarioRepository.update).not.toHaveBeenCalled()
    })

    it('redefine senha apenas com resetPasswordToDefault sem alterar cadastro', async () => {
        usuarioRepository.buscarPorIdComFazendas.mockResolvedValue({
            id: 'user-5',
            email: 'func@agrofarm.com',
            role: 'FUNCIONARIO',
            usuarios_fazendas: [{ fazendas: { id: 'faz-1', nome: 'Fazenda 1' } }],
        })
        hash.mockResolvedValue('senha-padrao-hash')
        usuarioRepository.update.mockResolvedValue({ id: 'user-5' })

        await usuarioService.atualizar('user-5', {
            resetPasswordToDefault: true,
        })

        expect(hash).toHaveBeenCalledWith('Senha123456')
        expect(usuarioRepository.update).toHaveBeenCalledWith('user-5', {
            senha: 'senha-padrao-hash',
            must_change_password: true,
            token_reset: null,
            token_reset_expira: null,
            token_version: { increment: 1 },
        })
        expect(usuarioRepository.substituirFazendasDoUsuario).not.toHaveBeenCalled()
    })

    it('redefine senha para padrao e exige troca no primeiro login', async () => {
        usuarioRepository.buscarPorIdComFazendas.mockResolvedValue({
            id: 'user-4',
            email: 'user4@agrofarm.com',
            role: 'ADMIN',
        })
        hash.mockResolvedValue('senha-padrao-hash')
        usuarioRepository.update.mockResolvedValue({ id: 'user-4' })

        await usuarioService.atualizar('user-4', {
            resetPasswordToDefault: true,
        })

        expect(hash).toHaveBeenCalledWith('Senha123456')
        expect(usuarioRepository.update).toHaveBeenCalledWith('user-4', {
            senha: 'senha-padrao-hash',
            must_change_password: true,
            token_reset: null,
            token_reset_expira: null,
            token_version: { increment: 1 },
        })
    })
})