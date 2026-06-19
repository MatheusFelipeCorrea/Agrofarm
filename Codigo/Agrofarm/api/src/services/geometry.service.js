import * as turf from '@turf/turf'
import { prisma } from '../database/client.js'

export const geometryService = {
    calcularAreaHectares(geojson) {
        const areaM2 = turf.area(geojson)
        const areaHectares = areaM2 / 10000
        return Number(areaHectares.toFixed(2))
    },

    async validarGeometria(geojson) {
        try {
            const geojsonString = JSON.stringify(
                geojson.geometry ?? geojson,
            )

            const resultado = await prisma.$queryRaw`
        SELECT
          ST_IsValid(ST_GeomFromGeoJSON(${geojsonString})) as valido,
          ST_IsValidReason(ST_GeomFromGeoJSON(${geojsonString})) as motivo
      `

            return {
                valido: resultado[0].valido,
                motivo: resultado[0].valido ? null : resultado[0].motivo,
            }
        } catch (error) {
            return { valido: false, motivo: error.message }
        }
    },

    calcularCentroide(geojson) {
        const centroid = turf.centroid(geojson)
        return centroid.geometry.coordinates
    },
}
