import { prisma } from '../database/client.js'
import { AppError } from '../shared/errors/AppError.js'
import { resolverNomeTalhao } from '../shared/poligono/poligonoNome.js'
import { validarDatasPoligono } from '../shared/poligono/poligonoDatas.js'
import { geometryService } from './geometry.service.js'

export const poligonoService = {
    async buscarPorFazenda(fazendaId) {
        const poligonos = await prisma.$queryRaw`
      SELECT
        p.id,
        p.fazenda_id,
        p.cultura_id,
        p.nome,
        p.data_plantio,
        p.data_colheita,
        ST_AsGeoJSON(p.geometria)::json as geometria,
        p.area_hectares,
        p.criado_em,
        p.atualizado_em,
        c.nome as cultura_nome,
        c.cor  as cultura_cor
      FROM poligonos_fazenda p
      LEFT JOIN culturas c ON p.cultura_id = c.id
      WHERE p.fazenda_id = ${fazendaId}::uuid
      ORDER BY p.criado_em DESC
    `
        return poligonos
    },

    /**
     * Verifica se o polígono informado se sobrepõe a algum talhão já existente na
     * mesma fazenda. Ignora toques de borda (interseção desprezível < 1 m²).
     * @returns {Promise<{id: string, nome: string} | null>} talhão sobreposto, se houver.
     */
    async verificarSobreposicao({ fazenda_id, geojson, ignorarId = null }) {
        const geojsonString = JSON.stringify(geojson.geometry ?? geojson)
        const params = [fazenda_id, geojsonString]

        let sql = `
      SELECT p.id, p.nome
      FROM poligonos_fazenda p
      WHERE p.fazenda_id = $1::uuid
        AND ST_IsValid(p.geometria)
        AND ST_Intersects(p.geometria, ST_GeomFromGeoJSON($2))
        AND ST_Area(
              ST_Intersection(p.geometria, ST_GeomFromGeoJSON($2))::geography
            ) > 1
    `

        if (ignorarId) {
            params.push(ignorarId)
            sql += ` AND p.id <> $3::uuid`
        }

        sql += ` LIMIT 1`

        const rows = await prisma.$queryRawUnsafe(sql, ...params)
        return rows[0] ?? null
    },

    async buscarPorId(id) {
        const resultado = await prisma.$queryRaw`
      SELECT
        p.id,
        p.fazenda_id,
        p.cultura_id,
        p.nome,
        p.data_plantio,
        p.data_colheita,
        ST_AsGeoJSON(p.geometria)::json as geometria,
        p.area_hectares,
        p.criado_em,
        p.atualizado_em,
        p.criado_por,
        c.nome as cultura_nome,
        c.cor  as cultura_cor
      FROM poligonos_fazenda p
      LEFT JOIN culturas c ON p.cultura_id = c.id
      WHERE p.id = ${id}::uuid
    `
        return resultado[0] || null
    },

    async criar({ fazenda_id, nome, geojson, area_hectares, cultura_id, data_plantio, data_colheita, criado_por }) {
        const nomeTalhao = await resolverNomeTalhao({ nome, cultura_id })
        if (!nomeTalhao) {
            throw new AppError('Informe o nome do talhão ou selecione a cultura plantada', 400)
        }

        const geojsonString = JSON.stringify(geojson.geometry ?? geojson)
        const culturaIdParam = cultura_id || null
        const dataPlantioParam = data_plantio ? new Date(data_plantio) : null
        const dataColheitaParam = data_colheita ? new Date(data_colheita) : null
        const criadoPorParam = criado_por || null

        const resultado = await prisma.$queryRaw`
      INSERT INTO poligonos_fazenda (
        fazenda_id, nome, geometria, area_hectares, cultura_id, data_plantio, data_colheita, criado_por
      )
      VALUES (
        ${fazenda_id}::uuid,
        ${nomeTalhao},
        ST_GeomFromGeoJSON(${geojsonString}),
        ${area_hectares},
        ${culturaIdParam}::uuid,
        ${dataPlantioParam}::date,
        ${dataColheitaParam}::date,
        ${criadoPorParam}::uuid
      )
      RETURNING
        id,
        fazenda_id,
        cultura_id,
        nome,
        data_plantio,
        data_colheita,
        ST_AsGeoJSON(geometria)::json as geometria,
        area_hectares,
        criado_em,
        atualizado_em
    `
        return resultado[0]
    },

    async atualizar(id, { nome, geojson, area_hectares, cultura_id, data_plantio, data_colheita }) {
        const updates = []
        const params = []

        if (nome !== undefined) {
            updates.push(`nome = $${params.length + 1}`)
            params.push(nome)
        }

        if (geojson !== undefined) {
            updates.push(`geometria = ST_GeomFromGeoJSON($${params.length + 1})`)
            params.push(JSON.stringify(geojson.geometry ?? geojson))
        }

        if (area_hectares !== undefined) {
            updates.push(`area_hectares = $${params.length + 1}`)
            params.push(area_hectares)
        }

        if (cultura_id !== undefined) {
            if (cultura_id === null) {
                updates.push(`cultura_id = NULL`)
            } else {
                updates.push(`cultura_id = $${params.length + 1}::uuid`)
                params.push(cultura_id)
            }
        }

        if (data_plantio !== undefined) {
            if (data_plantio === null) {
                updates.push(`data_plantio = NULL`)
            } else {
                updates.push(`data_plantio = $${params.length + 1}::date`)
                params.push(data_plantio)
            }
        }

        if (data_colheita !== undefined) {
            if (data_colheita === null) {
                updates.push(`data_colheita = NULL`)
            } else {
                updates.push(`data_colheita = $${params.length + 1}::date`)
                params.push(data_colheita)
            }
        }

        if (updates.length === 0) {
            return this.buscarPorId(id)
        }

        updates.push(`atualizado_em = NOW()`)

        const query = `
      UPDATE poligonos_fazenda
      SET ${updates.join(', ')}
      WHERE id = $${params.length + 1}::uuid
      RETURNING
        id,
        fazenda_id,
        cultura_id,
        nome,
        data_plantio,
        data_colheita,
        ST_AsGeoJSON(geometria)::json as geometria,
        area_hectares,
        criado_em,
        atualizado_em
    `
        params.push(id)

        const resultado = await prisma.$queryRawUnsafe(query, ...params)
        return resultado[0]
    },

    async deletar(id) {
        await prisma.$executeRaw`
      DELETE FROM poligonos_fazenda
      WHERE id = ${id}::uuid
    `
    },

    async exportarGeoJSON(fazendaId) {
        const poligonos = await this.buscarPorFazenda(fazendaId)
        return {
            type: 'FeatureCollection',
            features: poligonos.map((p) => ({
                type: 'Feature',
                geometry: p.geometria,
                properties: {
                    id: p.id,
                    nome: p.nome,
                    area_hectares: Number(p.area_hectares),
                    cultura_nome: p.cultura_nome,
                    cultura_cor: p.cultura_cor,
                    data_plantio: p.data_plantio,
                    data_colheita: p.data_colheita,
                    criado_em: p.criado_em,
                },
            })),
        }
    },

    async importarGeoJSON(fazendaId, geojson, usuarioId) {
        if (geojson.type !== 'FeatureCollection') {
            throw new Error('GeoJSON deve ser do tipo FeatureCollection')
        }

        const criados = []

        for (const feature of geojson.features) {
            if (feature.geometry?.type !== 'Polygon') continue

            const validacao = await geometryService.validarGeometria(feature)
            if (!validacao.valido) {
                console.warn(`Polígono inválido ignorado: ${validacao.motivo}`)
                continue
            }

            const data_plantio = feature.properties?.data_plantio || null
            const data_colheita = feature.properties?.data_colheita || null

            try {
                validarDatasPoligono({ data_plantio, data_colheita })
            } catch (erro) {
                console.warn(`Polígono com datas inválidas ignorado: ${erro.message}`)
                continue
            }

            const sobreposicao = await this.verificarSobreposicao({ fazenda_id: fazendaId, geojson: feature })
            if (sobreposicao) {
                console.warn(`Polígono sobreposto ignorado (sobre "${sobreposicao.nome}")`)
                continue
            }

            const area_hectares = geometryService.calcularAreaHectares(feature)
            const cultura_id = feature.properties?.cultura_id || null
            const nome = await resolverNomeTalhao({
                nome: feature.properties?.nome,
                cultura_id,
            }) || `Área Importada ${Date.now()}`

            const poligono = await this.criar({
                fazenda_id: fazendaId,
                nome,
                geojson: feature,
                area_hectares,
                cultura_id,
                data_plantio,
                data_colheita,
                criado_por: usuarioId,
            })

            criados.push(poligono)
        }

        return criados
    },
}
