import { prisma } from '../database/client.js'

export const poligonoHistoricoRepository = {
    async arquivar(poligono, { status, colheita_id, data_colheita }) {
        const geojsonString = JSON.stringify(poligono.geometria)
        const colheitaIdParam = colheita_id || null
        const dataColheitaParam = data_colheita ? new Date(data_colheita) : null
        const dataPlantioParam = poligono.data_plantio ? new Date(poligono.data_plantio) : null
        const culturaIdParam = poligono.cultura_id || null

        const resultado = await prisma.$queryRaw`
      INSERT INTO poligonos_fazenda_historico (
        fazenda_id,
        poligono_id_origem,
        nome,
        cultura_id,
        colheita_id,
        data_plantio,
        data_colheita,
        area_hectares,
        geometria,
        status
      )
      VALUES (
        ${poligono.fazenda_id}::uuid,
        ${poligono.id}::uuid,
        ${poligono.nome},
        ${culturaIdParam}::uuid,
        ${colheitaIdParam}::uuid,
        ${dataPlantioParam}::date,
        ${dataColheitaParam}::date,
        ${poligono.area_hectares},
        ST_GeomFromGeoJSON(${geojsonString}),
        ${status}::status_historico_mapa
      )
      RETURNING id
    `
        return resultado[0]
    },

    async listarColheitasVencidas(fazendaId = null) {
        const rows = await prisma.$queryRaw`
      SELECT
        p.id,
        p.fazenda_id,
        p.cultura_id,
        p.nome,
        p.data_plantio,
        p.data_colheita,
        ST_AsGeoJSON(p.geometria)::json as geometria,
        p.area_hectares,
        c.nome as cultura_nome
      FROM poligonos_fazenda p
      LEFT JOIN culturas c ON p.cultura_id = c.id
      WHERE p.data_colheita IS NOT NULL
        AND p.data_colheita < CURRENT_DATE
        AND (${fazendaId ?? null}::uuid IS NULL OR p.fazenda_id = ${fazendaId ?? null}::uuid)
      ORDER BY p.data_colheita ASC
    `
        return rows
    },

    async limparDataColheita(id) {
        await prisma.$executeRaw`
      UPDATE poligonos_fazenda
      SET data_colheita = NULL, atualizado_em = NOW()
      WHERE id = ${id}::uuid
    `
    },

    async buscarUltimaColheita(fazendaId, culturaId) {
        if (!culturaId) return null
        const rows = await prisma.$queryRaw`
      SELECT id, ano, data_colheita, area, sacas_produzidas
      FROM colheitas
      WHERE fazenda_id = ${fazendaId}::uuid
        AND cultura_id = ${culturaId}::uuid
      ORDER BY data_colheita DESC
      LIMIT 1
    `
        return rows[0] || null
    },

    async buscarColheitaPorFazendaCulturaData(fazendaId, culturaId, dataColheita) {
        if (!culturaId || !dataColheita) return null
        const dataParam = new Date(dataColheita)
        const rows = await prisma.$queryRaw`
      SELECT id, ano, data_colheita, area, sacas_produzidas
      FROM colheitas
      WHERE fazenda_id = ${fazendaId}::uuid
        AND cultura_id = ${culturaId}::uuid
        AND data_colheita = ${dataParam}::date
      LIMIT 1
    `
        return rows[0] || null
    },

    async criarColheitaDoMapa({ fazenda_id, cultura_id, data_colheita, ano, area }) {
        return prisma.colheitas.create({
            data: {
                fazenda_id,
                cultura_id,
                data_colheita,
                ano,
                area,
                sacas_produzidas: 0,
            },
        })
    },

    async atualizarAreaColheita(id, area) {
        return prisma.colheitas.update({
            where: { id },
            data: { area },
        })
    },

    async listarPorFazenda(fazendaId, filtros = {}) {
        const { culturaId, status, q } = filtros
        const rows = await prisma.$queryRaw`
      SELECT
        h.id,
        h.fazenda_id,
        h.poligono_id_origem,
        h.nome,
        h.cultura_id,
        h.colheita_id,
        h.data_plantio,
        h.data_colheita,
        h.area_hectares,
        ST_AsGeoJSON(h.geometria)::json as geometria,
        h.status::text as status,
        h.arquivado_em,
        h.restaurado_em,
        c.nome as cultura_nome,
        c.cor as cultura_cor,
        col.ano as safra_ano,
        col.sacas_produzidas,
        col.area as colheita_area
      FROM poligonos_fazenda_historico h
      LEFT JOIN culturas c ON h.cultura_id = c.id
      LEFT JOIN colheitas col ON h.colheita_id = col.id
      WHERE h.fazenda_id = ${fazendaId}::uuid
        AND h.restaurado_em IS NULL
        AND (${culturaId ?? null}::uuid IS NULL OR h.cultura_id = ${culturaId ?? null}::uuid)
        AND (${status ?? null}::text IS NULL OR h.status::text = ${status ?? null})
        AND (
          ${q ?? null}::text IS NULL
          OR h.nome ILIKE '%' || ${q ?? ''} || '%'
          OR c.nome ILIKE '%' || ${q ?? ''} || '%'
        )
      ORDER BY h.arquivado_em DESC
    `
        return rows
    },

    async buscarPorId(id) {
        const rows = await prisma.$queryRaw`
      SELECT
        h.id,
        h.fazenda_id,
        h.poligono_id_origem,
        h.nome,
        h.cultura_id,
        h.colheita_id,
        h.data_plantio,
        h.data_colheita,
        h.area_hectares,
        ST_AsGeoJSON(h.geometria)::json as geometria,
        h.status::text as status,
        h.arquivado_em,
        h.restaurado_em,
        c.nome as cultura_nome,
        c.cor as cultura_cor,
        col.ano as safra_ano,
        col.sacas_produzidas,
        col.area as colheita_area
      FROM poligonos_fazenda_historico h
      LEFT JOIN culturas c ON h.cultura_id = c.id
      LEFT JOIN colheitas col ON h.colheita_id = col.id
      WHERE h.id = ${id}::uuid
    `
        return rows[0] || null
    },

    async marcarRestaurado(id) {
        await prisma.$executeRaw`
      UPDATE poligonos_fazenda_historico
      SET restaurado_em = NOW()
      WHERE id = ${id}::uuid
    `
    },

    async calcularKpis(fazendaId) {
        const rows = await prisma.$queryRaw`
      SELECT
        COUNT(*)::int as mapas_historicos,
        COALESCE(SUM(CASE WHEN status = 'COLHIDA' THEN area_hectares ELSE 0 END), 0) as areas_colhidas,
        COALESCE(SUM(area_hectares), 0) as hectares_no_historico,
        COUNT(DISTINCT cultura_id)::int as rotacoes_registradas
      FROM poligonos_fazenda_historico
      WHERE fazenda_id = ${fazendaId}::uuid
        AND restaurado_em IS NULL
    `
        return rows[0]
    },

    async contarAtivos(fazendaId) {
        const rows = await prisma.$queryRaw`
      SELECT COUNT(*)::int as total
      FROM poligonos_fazenda_historico
      WHERE fazenda_id = ${fazendaId}::uuid
        AND restaurado_em IS NULL
    `
        return Number(rows[0]?.total ?? 0)
    },
}
