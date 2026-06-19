ALTER TABLE "fazendas"
  ADD COLUMN "ativa" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "latitude" DECIMAL(10, 7),
  ADD COLUMN "longitude" DECIMAL(10, 7);
