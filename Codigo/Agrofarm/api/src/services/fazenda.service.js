import { fazendaRepository } from '../repositories/fazenda.repository.js'
import { dashboardRepository } from '../repositories/dashboard.repository.js'
import { AppError } from '../shared/errors/AppError.js'
import { TIPO_FAZENDA_SOMENTE_LEITURA } from '../shared/fazenda/fazendaOperacao.js'
import {
    normalizarCamposArrendamento,
    sincronizarEntregasArrendamento,
} from '../shared/fazenda/arrendamentoEntrega.js'
import { prisma } from '../database/client.js'
import { poligonoHistoricoService } from './poligonoHistorico.service.js'

function normalizarCoordenadas(dados) {
    const out = {}
    if (dados.latitude !== undefined) {
        out.latitude = dados.latitude == null ? null : dados.latitude
    }
    if (dados.longitude !== undefined) {
        out.longitude = dados.longitude == null ? null : dados.longitude
    }
    return out
}

const ADMIN = 'ADMIN'

async function garantirAcessoFazenda(usuario, fazendaId) {
    const fazenda = await fazendaRepository.buscarPorId(fazendaId)
    if (!fazenda) {
        throw new AppError('Fazenda não encontrada', 404)
    }
    if (usuario.role === ADMIN) {
        return fazenda
    }
    const permitido = await fazendaRepository.usuarioTemVinculo(usuario.id, fazendaId)
    if (!permitido) {
        throw new AppError('Acesso negado a esta fazenda', 403)
    }
    return fazenda
}

export const fazendaService = {
    listarTodas: async (usuario) => {
        const fazendas =
            usuario.role === ADMIN
                ? await fazendaRepository.buscarTodos()
                : await fazendaRepository.buscarTodosPorUsuario(usuario.id)
        const hectaresPorFazenda = await fazendaRepository.sumAreaHectaresByFazendaIds(
            fazendas.map((f) => f.id),
        )
        return { fazendas, hectaresPorFazenda }
    },

    buscarPorId: async (id, usuario) => {
        const fazenda = await garantirAcessoFazenda(usuario, id)
        const hectaresMapeados = await fazendaRepository.sumAreaHectaresByFazenda(id)
        return { fazenda, hectaresMapeados }
    },

    buscarDetalhe: async (id, usuario) => {
        const fazenda = await garantirAcessoFazenda(usuario, id)
        const fazendaIds = [id]

        const [
            hectaresMapeados,
            culturasAtivas,
            talhoesMapeados,
            funcionariosVinculados,
            lembretesProximos,
            funcionarios,
            producaoPorCultura,
            totalLucros,
            totalGastos,
            areasNoHistorico,
        ] = await Promise.all([
            fazendaRepository.sumAreaHectaresByFazenda(id),
            fazendaRepository.contarCulturasAtivas(id),
            fazendaRepository.contarPoligonos(id),
            fazendaRepository.contarFuncionariosVinculados(id),
            fazendaRepository.listarLembretesPorFazenda(id),
            fazendaRepository.listarFuncionariosVinculados(id),
            dashboardRepository.producaoPorCultura({ fazendaIds }),
            dashboardRepository.totalLucros({ fazendaIds }),
            dashboardRepository.totalGastos({ fazendaIds }),
            poligonoHistoricoService.contarAreasNoHistorico(id),
        ])

        const totalSacas = producaoPorCultura.reduce((acc, item) => acc + Number(item.sacas ?? 0), 0)
        const totalArea = producaoPorCultura.reduce((acc, item) => acc + Number(item.area ?? 0), 0)
        const produtividadeMedia = totalArea > 0 ? Number((totalSacas / totalArea).toFixed(2)) : 0

        return {
            fazenda,
            hectaresMapeados,
            kpis: {
                culturasAtivas,
                talhoesMapeados,
                areasNoHistorico,
                produtividadeMedia,
                funcionariosVinculados,
            },
            lembretesProximos,
            funcionarios,
            resumoFinanceiro: {
                totalLucros: Number(totalLucros),
                totalGastos: Number(totalGastos),
                saldo: Number(totalLucros) - Number(totalGastos),
            },
        }
    },

    criar: async (dados) => {
        const nomeTrim = dados.nome.trim()
        const nomeEmUso = await fazendaRepository.buscarPorNome(nomeTrim)
        if (nomeEmUso) {
            throw new AppError('Já existe uma fazenda com esse nome', 409)
        }

        const arrendamento = normalizarCamposArrendamento(dados)
        const fazenda = await fazendaRepository.create({
            nome: nomeTrim,
            tipo: dados.tipo,
            localizacao: dados.localizacao?.trim() || null,
            ativa: dados.ativa !== undefined ? Boolean(dados.ativa) : true,
            ...normalizarCoordenadas(dados),
            ...arrendamento,
        })

        if (dados.tipo === TIPO_FAZENDA_SOMENTE_LEITURA) {
            await sincronizarEntregasArrendamento(fazenda.id)
        }

        return fazendaRepository.buscarPorId(fazenda.id)
    },

    atualizar: async (id, dados) => {
        const fazenda = await fazendaRepository.buscarPorId(id)
        if (!fazenda) {
            throw new AppError('Fazenda não encontrada', 404)
        }

        if (dados.nome) {
            const nomeEmUso = await fazendaRepository.buscarPorNome(dados.nome.trim(), { ignorarId: id })
            if (nomeEmUso) {
                throw new AppError('Já existe uma fazenda com esse nome', 409)
            }
        }

        const tipoFinal = dados.tipo ?? fazenda.tipo
        const arrendamento = normalizarCamposArrendamento({
            tipo: tipoFinal,
            arrendamentoCulturaId:
                dados.arrendamentoCulturaId ?? fazenda.arrendamento_cultura_id ?? undefined,
            arrendamentoQuantidadeSacas:
                dados.arrendamentoQuantidadeSacas ??
                (fazenda.arrendamento_quantidade_sacas != null
                    ? Number(fazenda.arrendamento_quantidade_sacas)
                    : undefined),
            arrendamentoPeriodicidade:
                dados.arrendamentoPeriodicidade ?? fazenda.arrendamento_periodicidade ?? undefined,
            arrendamentoDataInicio:
                dados.arrendamentoDataInicio ??
                (fazenda.arrendamento_data_inicio
                    ? fazenda.arrendamento_data_inicio.toISOString().slice(0, 10)
                    : undefined),
        })

        const payload = {
            ...(dados.nome ? { nome: dados.nome.trim() } : {}),
            ...(dados.tipo ? { tipo: dados.tipo } : {}),
            ...(dados.localizacao !== undefined
                ? { localizacao: dados.localizacao?.trim() || null }
                : {}),
            ...(dados.ativa !== undefined ? { ativa: Boolean(dados.ativa) } : {}),
            ...normalizarCoordenadas(dados),
            ...arrendamento,
        }

        const atualizada = await fazendaRepository.update(id, payload)

        if (tipoFinal !== TIPO_FAZENDA_SOMENTE_LEITURA) {
            await prisma.entregas_arrendamento.deleteMany({
                where: { fazenda_id: id, status: 'PENDENTE' },
            })
        } else if (
            dados.arrendamentoCulturaId !== undefined ||
            dados.arrendamentoQuantidadeSacas !== undefined ||
            dados.arrendamentoPeriodicidade !== undefined ||
            dados.arrendamentoDataInicio !== undefined ||
            dados.tipo === TIPO_FAZENDA_SOMENTE_LEITURA
        ) {
            await sincronizarEntregasArrendamento(id)
        }

        return atualizada
    },

    deletar: async (id) => {
        const fazenda = await fazendaRepository.buscarPorId(id)
        if (!fazenda) {
            throw new AppError('Fazenda não encontrada', 404)
        }

        const vinculos = await fazendaRepository.contarVinculos(id)
        if (vinculos.fazendaCulturas > 0) {
            throw new AppError('Não é possível excluir: fazenda possui culturas vinculadas', 400)
        }
        if (vinculos.colheitas > 0) {
            throw new AppError('Não é possível excluir: fazenda possui colheitas registradas', 400)
        }
        if (vinculos.insumosAtividades > 0) {
            throw new AppError('Não é possível excluir: fazenda possui atividades de insumos vinculadas', 400)
        }
        if (vinculos.lembretes > 0) {
            throw new AppError('Não é possível excluir: fazenda possui lembretes vinculados', 400)
        }

        await prisma.entregas_arrendamento.deleteMany({ where: { fazenda_id: id } })

        await fazendaRepository.delete(id)
    },
}
