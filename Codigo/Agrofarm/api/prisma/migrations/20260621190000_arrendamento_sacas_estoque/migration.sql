-- Arrendamento por sacas (cultura + quantidade) com saída de estoque

CREATE TYPE "status_entrega_arrendamento" AS ENUM ('PENDENTE', 'ENTREGUE', 'NAO_ENTREGUE');

ALTER TABLE "fazendas"
  ADD COLUMN "arrendamento_cultura_id" UUID,
  ADD COLUMN "arrendamento_quantidade_sacas" DECIMAL(10, 2);

ALTER TABLE "fazendas"
  ADD CONSTRAINT "fazendas_arrendamento_cultura_id_fkey"
  FOREIGN KEY ("arrendamento_cultura_id") REFERENCES "culturas"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE TABLE "entregas_arrendamento" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "fazenda_id" UUID NOT NULL,
  "cultura_id" UUID NOT NULL,
  "quantidade_sacas" DECIMAL(10, 2) NOT NULL,
  "data" DATE NOT NULL,
  "status" "status_entrega_arrendamento" NOT NULL DEFAULT 'PENDENTE',
  "colheita_id" UUID,
  "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "entregas_arrendamento_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "entregas_arrendamento"
  ADD CONSTRAINT "entregas_arrendamento_fazenda_id_fkey"
  FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "entregas_arrendamento"
  ADD CONSTRAINT "entregas_arrendamento_cultura_id_fkey"
  FOREIGN KEY ("cultura_id") REFERENCES "culturas"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "entregas_arrendamento"
  ADD CONSTRAINT "entregas_arrendamento_colheita_id_fkey"
  FOREIGN KEY ("colheita_id") REFERENCES "colheitas"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE INDEX "idx_entregas_arrendamento_fazenda_data" ON "entregas_arrendamento"("fazenda_id", "data");
CREATE INDEX "idx_entregas_arrendamento_colheita" ON "entregas_arrendamento"("colheita_id");
CREATE INDEX "idx_entregas_arrendamento_status" ON "entregas_arrendamento"("status");

-- Remove lucros de arrendamento monetário (substituídos por entregas de sacas)
DELETE FROM "lucros" WHERE "origem" = 'ARRENDAMENTO';

ALTER TABLE "fazendas" DROP COLUMN "arrendamento_valor";
