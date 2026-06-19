import { prisma } from "../database/client.js";

export const chatbotRepository = {
  criarSessao: async ({ usuarioId, titulo }) => {
    return prisma.chat_sessoes.create({
      data: {
        usuario_id: usuarioId,
        titulo: titulo ?? null,
      },
    });
  },

  tocarSessao: async (id) => {
    return prisma.chat_sessoes.update({
      where: { id },
      data: { atualizado_em: new Date() },
    });
  },

  buscarSessaoDoUsuario: async (sessaoId, usuarioId) => {
    return prisma.chat_sessoes.findFirst({
      where: { id: sessaoId, usuario_id: usuarioId },
    });
  },

  listarSessoesDoUsuario: async (usuarioId, limite = 20) => {
    return prisma.chat_sessoes.findMany({
      where: { usuario_id: usuarioId },
      orderBy: { atualizado_em: "desc" },
      take: limite,
    });
  },

  criarMensagem: async ({ sessaoId, papel, conteudo, metadados = null }) => {
    return prisma.chat_mensagens.create({
      data: {
        sessao_id: sessaoId,
        papel,
        conteudo,
        metadados,
      },
    });
  },

  listarMensagensAsc: async (sessaoId) => {
    return prisma.chat_mensagens.findMany({
      where: { sessao_id: sessaoId },
      orderBy: { criado_em: "asc" },
    });
  },

  atualizarTituloSessao: async ({ sessaoId, usuarioId, titulo }) => {
    return prisma.chat_sessoes.updateMany({
      where: { id: sessaoId, usuario_id: usuarioId },
      data: { titulo, atualizado_em: new Date() },
    });
  },

  excluirSessao: async ({ sessaoId, usuarioId }) => {
    return prisma.chat_sessoes.deleteMany({
      where: { id: sessaoId, usuario_id: usuarioId },
    });
  },
};
