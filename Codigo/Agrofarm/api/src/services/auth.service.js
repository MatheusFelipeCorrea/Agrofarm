import crypto from 'crypto'
import { authRepository } from '../repositories/auth.repository.js'
import { hash, compare } from '../shared/utils/bcrypt.js'
import { generateToken } from '../shared/utils/jwt.js'
import { enviarEmailRedefinicao } from '../shared/utils/email.js'
import { AppError } from '../shared/errors/AppError.js'
import { buildMenuForRole } from '../shared/navigation/menu.config.js'
import {
    DEFAULT_ADMIN_RESET_PASSWORD,
    MIN_NEW_PASSWORD_LENGTH,
} from '../shared/constants/passwordDefaults.js'

function buildSessionPayload(usuario, token = null) {
    return {
        ...(token ? { token } : {}),
        usuario,
        menu: buildMenuForRole(usuario.role),
    }
}

function normalizarFazendaIds(fazendaIds = []) {
    return [...new Set(fazendaIds)]
}

export const authService = {
    login: async ({ email, senha }) => {
        const usuario = await authRepository.buscarPorEmail(email)

        if (!usuario) {
            throw new AppError('Email ou senha incorretos', 401)
        }

        const senhaCorreta = await compare(senha, usuario.senha)

        if (!senhaCorreta) {
            throw new AppError('Email ou senha incorretos', 401)
        }

        if (usuario.must_change_password) {
            return {
                requirePasswordChange: true,
                userId: usuario.id,
            }
        }

        const token = generateToken({
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            role: usuario.role,
        })

        return buildSessionPayload(usuario, token)
    },

    obterSessaoAtual: async (usuarioLogado) => {
        const usuario = await authRepository.buscarPorEmail(usuarioLogado.email)

        if (!usuario) {
            throw new AppError('Usuario nao encontrado', 404)
        }

        return buildSessionPayload(usuario)
    },

    cadastro: async ({ nome, email, role, telefone, fazendaIds = [] }) => {
        const emailExiste = await authRepository.buscarPorEmail(email)

        if (emailExiste) {
            throw new AppError('Email já cadastrado', 409)
        }

        const fazendasNormalizadas = normalizarFazendaIds(fazendaIds)

        if (role === 'FUNCIONARIO' && fazendasNormalizadas.length < 1) {
            throw new AppError('Funcionario deve possuir ao menos uma fazenda vinculada', 400)
        }

        const senhaHash = await hash(DEFAULT_ADMIN_RESET_PASSWORD)

        const usuario = await authRepository.createComVinculos({
            nome,
            email,
            senha: senhaHash,
            role,
            telefone: telefone?.trim() || null,
            fazendaIds: fazendasNormalizadas,
            mustChangePassword: true,
        })

        return usuario
    },

    esqueciSenha: async ({ email }) => {
        const usuario = await authRepository.buscarPorEmail(email)

        if (!usuario) return

        const token = crypto.randomBytes(32).toString('hex')
        const expira = new Date(Date.now() + 60 * 60 * 1000)

        await authRepository.salvarTokenReset(email, token, expira)
        await enviarEmailRedefinicao(email, token)
    },

    redefinirSenha: async ({ token, novaSenha }) => {
        const usuario = await authRepository.buscarPorTokenReset(token)

        if (!usuario) {
            throw new AppError('Token inválido ou expirado', 400)
        }

        const tokenExpirado = new Date() > new Date(usuario.token_reset_expira)

        if (tokenExpirado) {
            throw new AppError('Token inválido ou expirado', 400)
        }

        const senhaHash = await hash(novaSenha)
        await authRepository.atualizarSenha(usuario.id, senhaHash)
    },

    changeInitialPassword: async ({ userId, oldPassword, newPassword, confirmNewPassword }) => {
        if (newPassword !== confirmNewPassword) {
            throw new AppError('Nova senha e confirmacao devem ser iguais', 400)
        }

        if (newPassword.length < MIN_NEW_PASSWORD_LENGTH) {
            throw new AppError(`Nova senha deve ter no minimo ${MIN_NEW_PASSWORD_LENGTH} caracteres`, 400)
        }

        if (newPassword === DEFAULT_ADMIN_RESET_PASSWORD) {
            throw new AppError('A nova senha nao pode ser igual a senha padrao temporaria', 400)
        }

        const usuario = await authRepository.buscarPorId(userId)

        if (!usuario) {
            throw new AppError('Usuario nao encontrado', 404)
        }

        if (!usuario.must_change_password) {
            throw new AppError('Troca de senha obrigatoria nao esta pendente para este usuario', 403)
        }

        const senhaAtualCorreta = await compare(oldPassword, usuario.senha)

        if (!senhaAtualCorreta) {
            throw new AppError('Senha atual incorreta', 401)
        }

        const senhaHash = await hash(newPassword)
        const usuarioAtualizado = await authRepository.concluirTrocaSenhaInicial(userId, senhaHash)

        const token = generateToken({
            id: usuarioAtualizado.id,
            nome: usuarioAtualizado.nome,
            email: usuarioAtualizado.email,
            role: usuarioAtualizado.role,
        })

        return buildSessionPayload(usuarioAtualizado, token)
    },
}