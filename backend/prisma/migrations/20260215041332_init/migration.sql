-- CreateEnum
CREATE TYPE "site_status" AS ENUM ('active', 'inactive', 'maintenance', 'decommissioned');

-- CreateEnum
CREATE TYPE "compliance_status" AS ENUM ('within_limit', 'limit_exceeded', 'unknown');

-- CreateEnum
CREATE TYPE "emission_unit" AS ENUM ('kg', 'tonne', 'scf', 'ppm');

-- CreateEnum
CREATE TYPE "error_severity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateTable
CREATE TABLE "site" (
    "id" SERIAL NOT NULL,
    "site_name" TEXT NOT NULL,
    "site_type" TEXT NOT NULL,
    "status" "site_status" NOT NULL DEFAULT 'active',
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "emission_limit" DECIMAL(18,6) NOT NULL,
    "total_emissions_to_date" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "last_measurement_at" TIMESTAMP(3),
    "rolling_24h_emissions" DECIMAL(18,6),
    "rolling_30d_emissions" DECIMAL(18,6),
    "current_compliance_status" "compliance_status" NOT NULL DEFAULT 'unknown',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurement" (
    "id" SERIAL NOT NULL,
    "site_id" INTEGER NOT NULL,
    "batch_id" INTEGER,
    "measured_at" TIMESTAMP(3) NOT NULL,
    "emission_value" DECIMAL(18,6) NOT NULL,
    "unit" "emission_unit" NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_batch" (
    "id" SERIAL NOT NULL,
    "site_id" INTEGER NOT NULL,
    "client_batch_id" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingestion_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_log" (
    "id" SERIAL NOT NULL,
    "service" TEXT,
    "endpoint" TEXT,
    "request_id" TEXT,
    "error_code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "error_severity" NOT NULL DEFAULT 'medium',
    "context" JSONB,
    "site_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "measurement_site_id_idx" ON "measurement"("site_id");

-- CreateIndex
CREATE INDEX "measurement_measured_at_idx" ON "measurement"("measured_at");

-- CreateIndex
CREATE UNIQUE INDEX "ingestion_batch_client_batch_id_key" ON "ingestion_batch"("client_batch_id");

-- CreateIndex
CREATE INDEX "ingestion_batch_site_id_idx" ON "ingestion_batch"("site_id");

-- CreateIndex
CREATE INDEX "error_log_request_id_idx" ON "error_log"("request_id");

-- CreateIndex
CREATE INDEX "error_log_site_id_idx" ON "error_log"("site_id");

-- AddForeignKey
ALTER TABLE "measurement" ADD CONSTRAINT "measurement_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement" ADD CONSTRAINT "measurement_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "ingestion_batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_batch" ADD CONSTRAINT "ingestion_batch_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_log" ADD CONSTRAINT "error_log_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
