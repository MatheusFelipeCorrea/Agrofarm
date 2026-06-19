ALTER TABLE "lembretes"
  ADD COLUMN "colheita_id" UUID,
  ADD COLUMN "poligono_id" UUID;

ALTER TABLE "lembretes"
  ADD CONSTRAINT "lembretes_colheita_id_fkey"
  FOREIGN KEY ("colheita_id") REFERENCES "colheitas"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "lembretes"
  ADD CONSTRAINT "lembretes_poligono_id_fkey"
  FOREIGN KEY ("poligono_id") REFERENCES "poligonos_fazenda"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE INDEX "idx_lembretes_colheita_id" ON "lembretes"("colheita_id");
CREATE INDEX "idx_lembretes_poligono_id" ON "lembretes"("poligono_id");
