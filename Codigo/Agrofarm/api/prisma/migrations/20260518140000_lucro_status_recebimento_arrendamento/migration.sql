CREATE TYPE "status_recebimento_arrendamento" AS ENUM ('PENDENTE', 'RECEBIDO', 'NAO_RECEBIDO');

ALTER TABLE "lucros"
  ADD COLUMN "status_recebimento" "status_recebimento_arrendamento";

UPDATE "lucros"
SET "status_recebimento" = 'PENDENTE'
WHERE "origem" = 'ARRENDAMENTO' AND "status_recebimento" IS NULL;

ALTER TYPE "tipo_notificacao" ADD VALUE IF NOT EXISTS 'ARRENDAMENTO_RECEBER';
