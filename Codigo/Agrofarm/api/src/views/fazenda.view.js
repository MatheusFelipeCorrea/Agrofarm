import { isFazendaSomenteLeitura, podeOperarFazenda } from '../shared/fazenda/fazendaOperacao.js'



const sumDecimal = (values) =>

    values.reduce((acc, value) => acc + Number(value ?? 0), 0)



function calcPercentualAreaUtilizada(hectaresCulturas, hectaresMapeados) {

    const mapeados = Number(hectaresMapeados ?? 0)

    const culturas = Number(hectaresCulturas ?? 0)

    if (mapeados <= 0) return 0

    return Math.min(100, Number(((culturas / mapeados) * 100).toFixed(1)))

}



function renderMetricas(fazenda, hectaresMapeados) {

    const vinculos = fazenda.fazenda_culturas ?? []

    const hectaresCulturas = sumDecimal(vinculos.map((v) => v.hectares))



    return {

        hectaresMapeados: Number(hectaresMapeados ?? 0),

        hectaresCulturas,

        percentualAreaUtilizada: calcPercentualAreaUtilizada(hectaresCulturas, hectaresMapeados),

    }

}



export const fazendaView = {

    render: (fazenda, { hectaresMapeados } = {}) => {

        const vinculos = fazenda.fazenda_culturas ?? []

        const hectaresTotal = sumDecimal(vinculos.map((v) => v.hectares))

        const somenteLeitura = isFazendaSomenteLeitura(fazenda.tipo)

        const metricas = renderMetricas(fazenda, hectaresMapeados)



        return {

            id: fazenda.id,

            nome: fazenda.nome,

            tipo: fazenda.tipo,

            ativa: fazenda.ativa !== false,

            localizacao: fazenda.localizacao,

            latitude: fazenda.latitude != null ? Number(fazenda.latitude) : null,

            longitude: fazenda.longitude != null ? Number(fazenda.longitude) : null,

            podeOperar: podeOperarFazenda(fazenda.tipo),

            somenteLeitura,

            arrendamento:

                fazenda.tipo === 'ARRENDADA_PARA_TERCEIROS' &&

                fazenda.arrendamento_valor != null &&

                fazenda.arrendamento_periodicidade &&

                fazenda.arrendamento_data_inicio

                    ? {

                          valor: Number(fazenda.arrendamento_valor),

                          periodicidade: fazenda.arrendamento_periodicidade,

                          dataInicio:

                              fazenda.arrendamento_data_inicio?.toISOString?.().slice(0, 10) ??

                              fazenda.arrendamento_data_inicio,

                      }

                    : null,

            hectares: hectaresTotal,

            ...metricas,

            criadoEm: fazenda.criado_em,

            atualizadoEm: fazenda.atualizado_em,

            culturas: vinculos.map((v) => ({

                id: v.id,

                hectares: v.hectares,

                status: v.status,

                cultura: v.culturas

                    ? {

                        id: v.culturas.id,

                        nome: v.culturas.nome,

                        cor: v.culturas.cor,

                    }

                    : null,

                criadoEm: v.criado_em,

            })),

        }

    },



    renderMany: (fazendas, hectaresPorFazenda = new Map()) =>

        fazendas.map((fazenda) =>

            fazendaView.render(fazenda, {

                hectaresMapeados: hectaresPorFazenda.get(fazenda.id) ?? 0,

            }),

        ),



    renderDetalhe: ({ fazenda, hectaresMapeados, kpis, lembretesProximos, funcionarios, resumoFinanceiro }) => {

        const base = fazendaView.render(fazenda, { hectaresMapeados })

        return {

            ...base,

            kpis,

            lembretesProximos: lembretesProximos.map((l) => {
                const cultura =
                    l.colheitas?.culturas ??
                    l.poligonos_fazenda?.culturas ??
                    null
                const culturaPoligono = l.poligonos_fazenda?.culturas
                const nomePoligono = l.poligonos_fazenda?.nome?.trim()
                const talhao = l.poligonos_fazenda
                    ? {
                          id: l.poligonos_fazenda.id,
                          nome: nomePoligono || culturaPoligono?.nome || null,
                      }
                    : null

                return {
                    id: l.id,
                    titulo: l.titulo,
                    data: l.data_lembrete?.toISOString?.() ?? l.data_lembrete,
                    status: l.status,
                    criadoEm: l.criado_em,
                    colheita: l.colheitas
                        ? { id: l.colheitas.id, ano: l.colheitas.ano }
                        : null,
                    cultura: cultura
                        ? { id: cultura.id, nome: cultura.nome, cor: cultura.cor }
                        : null,
                    talhao,
                }
            }),

            funcionarios: funcionarios.map((u) => ({

                id: u.id,

                nome: u.nome,

                role: u.role,

            })),

            resumoFinanceiro,

        }

    },

}

