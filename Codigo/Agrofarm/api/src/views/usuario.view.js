export const usuarioView = {
    render: (usuario) => ({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        telefone: usuario.telefone,
        criadoEm: usuario.criado_em,
        fazendasVinculadas: (usuario.usuarios_fazendas ?? []).map((vinculo) => ({
            id: vinculo.fazendas.id,
            nome: vinculo.fazendas.nome,
        })),
    }),

    renderMany: (usuarios) =>
        usuarios.map((usuario) => ({
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            role: usuario.role,
            telefone: usuario.telefone,
            criadoEm: usuario.criado_em,
            fazendasVinculadas: (usuario.usuarios_fazendas ?? []).map((vinculo) => ({
                id: vinculo.fazendas.id,
                nome: vinculo.fazendas.nome,
            })),
        })),
}