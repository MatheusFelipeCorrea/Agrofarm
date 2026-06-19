-- AlterTable
ALTER TABLE "insumos_atividades" ADD COLUMN "categoria" VARCHAR(50) NOT NULL DEFAULT 'OUTRO';
ALTER TABLE "insumos_atividades" ADD COLUMN "unidade" VARCHAR(20) NOT NULL DEFAULT 'kg';
ALTER TABLE "insumos_atividades" ADD COLUMN "valor_unitario" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "insumos_atividades" ADD COLUMN "fornecedor" VARCHAR(200);

CREATE INDEX "idx_insumos_fazenda_data" ON "insumos_atividades"("fazenda_id", "data");
