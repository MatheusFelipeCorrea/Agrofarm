-- Arrendamento (fazenda para terceiros) + lucros sem colheita

CREATE TYPE "periodicidade_arrendamento" AS ENUM ('MENSAL', 'SEMESTRAL', 'ANUAL');
CREATE TYPE "origem_lucro" AS ENUM ('VENDA_COLHEITA', 'ARRENDAMENTO');

ALTER TABLE "fazendas"
  ADD COLUMN "arrendamento_valor" DECIMAL(12, 2),
  ADD COLUMN "arrendamento_periodicidade" "periodicidade_arrendamento",
  ADD COLUMN "arrendamento_data_inicio" DATE;

ALTER TABLE "lucros"
  ADD COLUMN "fazenda_id" UUID,
  ADD COLUMN "origem" "origem_lucro" NOT NULL DEFAULT 'VENDA_COLHEITA';

ALTER TABLE "lucros" ALTER COLUMN "colheita_id" DROP NOT NULL;

ALTER TABLE "lucros"
  ADD CONSTRAINT "lucros_fazenda_id_fkey"
  FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE INDEX "idx_lucros_fazenda_data" ON "lucros"("fazenda_id", "data");
CREATE INDEX "idx_lucros_origem" ON "lucros"("origem");
