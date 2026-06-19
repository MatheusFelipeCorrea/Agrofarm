const MENU_CONFIG = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/',
        icon: 'dashboard',
        allowedRoles: ['ADMIN'],
        ordem: 1,
        children: [],
    },
    {
        id: 'noticias',
        label: 'Notícias',
        path: '/noticias',
        icon: 'noticias',
        allowedRoles: ['ADMIN'],
        ordem: 2,
        children: [],
    },
    {
        id: 'fazendas',
        label: 'Fazendas',
        path: null,
        icon: 'fazendas',
        allowedRoles: ['ADMIN'],
        ordem: 3,
        children: [
            {
                id: 'gerenciar-fazendas',
                label: 'Gerenciar Fazendas',
                path: '/fazendas',
                icon: 'fazendas',
                allowedRoles: ['ADMIN'],
                ordem: 1,
            },
            {
                id: 'gerenciar-colheitas',
                label: 'Gerenciar Colheitas',
                path: '/colheitas',
                icon: 'colheitas',
                allowedRoles: ['ADMIN'],
                ordem: 2,
            },
            {
                id: 'gerenciar-estoque',
                label: 'Gerenciar Estoque',
                path: '/estoque',
                icon: 'estoque',
                allowedRoles: ['ADMIN'],
                ordem: 3,
            },
            {
                id: 'gerenciar-lucros',
                label: 'Gerenciar Lucros',
                path: '/lucros',
                icon: 'lucros',
                allowedRoles: ['ADMIN'],
                ordem: 4,
            },
            {
                id: 'gerenciar-gastos',
                label: 'Gerenciar Gastos',
                path: '/gastos',
                icon: 'gastos',
                allowedRoles: ['ADMIN'],
                ordem: 5,
            },
            {
                id: 'gerenciar-insumos',
                label: 'Gerenciar Insumos',
                path: '/insumos',
                icon: 'insumos',
                allowedRoles: ['ADMIN'],
                ordem: 6,
            },
        ],
    },
    {
        id: 'gerenciar-insumos-funcionario',
        label: 'Insumos',
        path: '/insumos',
        icon: 'insumos',
        allowedRoles: ['FUNCIONARIO'],
        ordem: 1,
        children: [],
    },
    {
        id: 'simulacao',
        label: 'Simulação',
        path: '/simulacao',
        icon: 'simulacao',
        allowedRoles: ['ADMIN'],
        ordem: 5,
        children: [],
    },
    {
        id: 'gerenciar-lembretes',
        label: 'Gerenciar Lembretes',
        path: '/lembretes',
        icon: 'lembretes',
        allowedRoles: ['ADMIN'],
        ordem: 6,
        children: [],
    },
    {
        id: 'chat-ia',
        label: 'Chat IA',
        path: '/chatbot',
        icon: 'chat',
        allowedRoles: ['ADMIN'],
        ordem: 7,
        children: [],
    },
    {
        id: 'insights-inteligentes',
        label: 'Insights Inteligentes',
        path: '/insights',
        icon: 'insights',
        allowedRoles: ['ADMIN'],
        ordem: 8,
        children: [],
    },
    {
        id: 'gerenciar-usuarios',
        label: 'Gerenciar Usuarios',
        path: '/usuarios',
        icon: 'usuarios',
        allowedRoles: ['ADMIN'],
        ordem: 9,
        children: [],
    },
]

function ordenarItens(itens) {
    return [...itens].sort((a, b) => a.ordem - b.ordem)
}

function filtrarItemPorRole(item, role) {
    if (!item.allowedRoles.includes(role)) {
        return null
    }

    const children = ordenarItens(item.children ?? [])
        .map((child) => filtrarItemPorRole(child, role))
        .filter(Boolean)

    return {
        id: item.id,
        label: item.label,
        path: item.path,
        icon: item.icon,
        children,
    }
}

export function buildMenuForRole(role) {
    return ordenarItens(MENU_CONFIG)
        .map((item) => filtrarItemPorRole(item, role))
        .filter(Boolean)
}
