import { randomUUID } from 'node:crypto'
import { prisma } from '../database/client.js'

const usuarioWithFazendasInclude = {
    usuarios_fazendas: {
        include: {
            fazendas: {
                select: {
                    id: true,
                    nome: true,
                },
            },
        },
        orderBy: {
            fazendas: {
                nome: 'asc',
            },
        },
    },
}

export const authRepository = {
    buscarPorEmail: async (email) => {
        return prisma.usuarios.findUnique({
            where: { email },
            include: usuarioWithFazendasInclude,
        })
    },

    create: async (dados) => {
        return prisma.usuarios.create({
            data: {
                ...dados,
                id: dados.id ?? randomUUID(),
            },
            include: usuarioWithFazendasInclude,
        })
    },

    createComVinculos: async ({
        nome,
        email,
        senha,
        role,
        telefone,
        fazendaIds = [],
        mustChangePassword = true,
    }) => {
        return prisma.usuarios.create({
            data: {
                id: randomUUID(),
                nome,
                email,
                senha,
                role,
                telefone: telefone ?? null,
                must_change_password: mustChangePassword,
                usuarios_fazendas:
                    fazendaIds.length > 0
                        ? {
                              create: fazendaIds.map((fazendaId) => ({ fazenda_id: fazendaId })),
                          }
                        : undefined,
            },
            include: usuarioWithFazendasInclude,
        })
    },

    salvarTokenReset: async (email, token, expira) => {
        return prisma.usuarios.update({
            where: { email },
            data: {
                token_reset: token,
                token_reset_expira: expira,
            },
        })
    },

    buscarPorTokenReset: async (token) => {
        return prisma.usuarios.findFirst({
            where: { token_reset: token },
            include: usuarioWithFazendasInclude,
        })
    },

    buscarPorId: async (id) => {
        return prisma.usuarios.findUnique({
            where: { id },
            include: usuarioWithFazendasInclude,
        })
    },

    atualizarSenha: async (id, senhaHash) => {
        return prisma.usuarios.update({
            where: { id },
            data: {
                senha: senhaHash,
                must_change_password: false,
                token_reset: null,
                token_reset_expira: null,
            },
        })
    },

    concluirTrocaSenhaInicial: async (id, senhaHash) => {
        return prisma.usuarios.update({
            where: { id },
            data: {
                senha: senhaHash,
                must_change_password: false,
                token_reset: null,
                token_reset_expira: null,
            },
            include: usuarioWithFazendasInclude,
        })
    },
}
