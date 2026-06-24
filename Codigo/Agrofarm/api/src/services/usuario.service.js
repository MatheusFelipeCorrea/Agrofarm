import { usuarioRepository } from '../repositories/usuario.repository.js'
import { hash } from '../shared/utils/bcrypt.js'
import { AppError } from '../shared/errors/AppError.js'
import { DEFAULT_ADMIN_RESET_PASSWORD } from '../shared/constants/passwordDefaults.js'

function normalizarFazendaIds(fazendaIds) {
    if (!fazendaIds) {
        return undefined
    }

    return [...new Set(fazendaIds)]
}

export const usuarioService = {
    listarTodos: async () => {
        return usuarioRepository.buscarTodosComFazendas()
    },

    buscarPorId: async (id) => {
        const usuario = await usuarioRepository.buscarPorIdComFazendas(id)

        if (!usuario) {
            throw new AppError('Usuário não encontrado', 404)
        }

        return usuario
    },

    atualizar: async (id, dados) => {
        const usuario = await usuarioRepository.buscarPorIdComFazendas(id)

        if (!usuario) {
            throw new AppError('Usuário não encontrado', 404)
        }

        if (dados.email && dados.email !== usuario.email) {
            const emailExiste = await usuarioRepository.buscarPorEmail(dados.email)

            if (emailExiste) {
                throw new AppError('Email já está em uso', 409)
            }
        }

        const fazendaIds =
            dados.fazendaIds !== undefined ? normalizarFazendaIds(dados.fazendaIds) : undefined

        const roleEfetivo = dados.role ?? usuario.role

        if (roleEfetivo === 'FUNCIONARIO' && fazendaIds !== undefined && fazendaIds.length < 1) {
            throw new AppError('Funcionario deve possuir ao menos uma fazenda vinculada', 400)
        }

        const { resetPasswordToDefault, nome, email, telefone, role } = dados

        /** @type {Record<string, unknown>} */
        const payload = {}

        if (nome !== undefined) payload.nome = nome
        if (email !== undefined) payload.email = email
        if (role !== undefined) payload.role = role
        if (telefone !== undefined) payload.telefone = telefone === null ? null : telefone?.trim() || null

        if (resetPasswordToDefault === true) {
            payload.senha = await hash(DEFAULT_ADMIN_RESET_PASSWORD)
            payload.must_change_password = true
            payload.token_reset = null
            payload.token_reset_expira = null
            payload.token_version = { increment: 1 }
        }

        if (Object.keys(payload).length === 0 && fazendaIds === undefined) {
            throw new AppError('Nenhuma alteracao informada para o usuario', 400)
        }

        let usuarioAtualizado = usuario

        if (Object.keys(payload).length > 0) {
            usuarioAtualizado = await usuarioRepository.update(id, payload)
        }

        if (fazendaIds !== undefined) {
            return usuarioRepository.substituirFazendasDoUsuario(id, fazendaIds)
        }

        return usuarioAtualizado
    },

    deletar: async (id, usuarioLogadoId) => {
        const usuario = await usuarioRepository.buscarPorId(id)

        if (!usuario) {
            throw new AppError('Usuário não encontrado', 404)
        }

        if (id === usuarioLogadoId) {
            throw new AppError('Você não pode deletar sua própria conta', 400)
        }

        await usuarioRepository.delete(id)
    },
}
