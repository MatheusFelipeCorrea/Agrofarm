-- CreateEnum
CREATE TYPE "role" AS ENUM ('ADMIN', 'FUNCIONARIO');

-- CreateEnum
CREATE TYPE "status_gasto" AS ENUM ('PAGO', 'PENDENTE');

-- CreateEnum
CREATE TYPE "status_lembrete" AS ENUM ('PENDENTE', 'ENVIADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "tipo_fazenda" AS ENUM ('PROPRIA', 'ARRENDADA_DE_TERCEIROS', 'ARRENDADA_PARA_TERCEIROS');

-- CreateEnum
CREATE TYPE "status_cultura" AS ENUM ('SECAGEM', 'COLHEITA', 'PLANTIO', 'ADUBACAO', 'PULVERIZACAO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "role" "role" NOT NULL DEFAULT 'FUNCIONARIO',
    "telefone" VARCHAR(20),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fazendas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(150) NOT NULL,
    "tipo" "tipo_fazenda" NOT NULL,
    "localizacao" VARCHAR(255),
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fazendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "culturas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(100) NOT NULL,
    "cor" VARCHAR(7) NOT NULL,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hectares" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "culturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colheitas" (
    "id" TEXT NOT NULL,
    "fazenda_id" TEXT NOT NULL,
    "area" DECIMAL(10,2) NOT NULL,
    "sacas_produzidas" DECIMAL(10,2) NOT NULL,
    "ano" INTEGER NOT NULL,
    "data_colheita" DATE NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cultura_id" UUID,

    CONSTRAINT "colheitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fazenda_culturas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fazenda_id" UUID NOT NULL,
    "cultura_id" UUID NOT NULL,
    "hectares" DECIMAL(10,2) NOT NULL,
    "status" "status_cultura" NOT NULL,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fazenda_culturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL,
    "colheita_id" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data_vencimento" DATE,
    "status" "status_gasto" NOT NULL,
    "descricao" TEXT,
    "data" DATE NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" VARCHAR(50) NOT NULL,
    "tipo_personalizado" VARCHAR(100),

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lucros" (
    "id" TEXT NOT NULL,
    "colheita_id" TEXT NOT NULL,
    "quantidade_sacas" DECIMAL(10,2) NOT NULL,
    "valor_unitario" DECIMAL(10,2) NOT NULL,
    "comprador" VARCHAR(150) NOT NULL,
    "data" DATE NOT NULL,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lucros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lembretes" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "fazenda_id" TEXT,
    "titulo" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "data_lembrete" TIMESTAMP(3) NOT NULL,
    "telefone_whatsapp" VARCHAR(20),
    "status" "status_lembrete" NOT NULL DEFAULT 'PENDENTE',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lembretes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insumos_atividades" (
    "id" TEXT NOT NULL,
    "funcionario_id" TEXT NOT NULL,
    "fazenda_id" TEXT NOT NULL,
    "item" VARCHAR(150) NOT NULL,
    "quantidade" DECIMAL(10,2) NOT NULL,
    "observacoes" TEXT,
    "data" DATE NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insumos_atividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotacoes" (
    "id" TEXT NOT NULL,
    "valor" DECIMAL(10,4) NOT NULL,
    "fonte" VARCHAR(100) NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cotacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "culturas_nome_key" ON "culturas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "fazenda_culturas_fazenda_id_cultura_id_key" ON "fazenda_culturas"("fazenda_id", "cultura_id");

-- AddForeignKey
ALTER TABLE "colheitas" ADD CONSTRAINT "colheitas_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colheitas" ADD CONSTRAINT "colheitas_cultura_id_fkey" FOREIGN KEY ("cultura_id") REFERENCES "culturas"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fazenda_culturas" ADD CONSTRAINT "fazenda_culturas_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fazenda_culturas" ADD CONSTRAINT "fazenda_culturas_cultura_id_fkey" FOREIGN KEY ("cultura_id") REFERENCES "culturas"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_colheita_id_fkey" FOREIGN KEY ("colheita_id") REFERENCES "colheitas"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lucros" ADD CONSTRAINT "lucros_colheita_id_fkey" FOREIGN KEY ("colheita_id") REFERENCES "colheitas"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lembretes" ADD CONSTRAINT "lembretes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lembretes" ADD CONSTRAINT "lembretes_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumos_atividades" ADD CONSTRAINT "insumos_atividades_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumos_atividades" ADD CONSTRAINT "insumos_atividades_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
