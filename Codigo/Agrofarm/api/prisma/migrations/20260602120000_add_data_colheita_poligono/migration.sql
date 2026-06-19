-- AlterTable
ALTER TABLE "poligonos_fazenda" ADD COLUMN "data_colheita" DATE;

-- CreateIndex
CREATE INDEX "poligonos_fazenda_data_colheita_idx" ON "poligonos_fazenda"("data_colheita");
