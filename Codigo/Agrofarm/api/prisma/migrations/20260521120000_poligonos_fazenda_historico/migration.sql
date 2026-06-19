-- CreateEnum
CREATE TYPE "status_historico_mapa" AS ENUM ('COLHIDA', 'ENCERRADA', 'ARQUIVADA');

-- CreateTable
CREATE TABLE "poligonos_fazenda_historico" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fazenda_id" UUID NOT NULL,
    "poligono_id_origem" UUID,
    "nome" VARCHAR(100) NOT NULL,
    "cultura_id" UUID,
    "colheita_id" UUID,
    "data_plantio" DATE,
    "data_colheita" DATE,
    "area_hectares" DECIMAL(10,2) NOT NULL,
    "geometria" geometry(Polygon, 4326) NOT NULL,
    "status" "status_historico_mapa" NOT NULL DEFAULT 'ARQUIVADA',
    "arquivado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restaurado_em" TIMESTAMP(6),

    CONSTRAINT "poligonos_fazenda_historico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_pol_hist_fazenda_arquivado" ON "poligonos_fazenda_historico"("fazenda_id", "arquivado_em" DESC);

CREATE INDEX "idx_pol_hist_fazenda_status" ON "poligonos_fazenda_historico"("fazenda_id", "status");

CREATE INDEX "idx_pol_hist_restaurado" ON "poligonos_fazenda_historico"("fazenda_id", "restaurado_em");

-- AddForeignKey
ALTER TABLE "poligonos_fazenda_historico" ADD CONSTRAINT "poligonos_fazenda_historico_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "poligonos_fazenda_historico" ADD CONSTRAINT "poligonos_fazenda_historico_cultura_id_fkey" FOREIGN KEY ("cultura_id") REFERENCES "culturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "poligonos_fazenda_historico" ADD CONSTRAINT "poligonos_fazenda_historico_colheita_id_fkey" FOREIGN KEY ("colheita_id") REFERENCES "colheitas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
