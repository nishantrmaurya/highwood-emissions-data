-- CreateEnum
CREATE TYPE "operational_status" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "measurement_frequency" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL', 'AD_HOC');

-- CreateEnum
CREATE TYPE "compliance_status" AS ENUM ('COMPLIANT', 'NON_COMPLIANT', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "incident_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "site_type" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_equipment_type" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitoring_equipment_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_source_type" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emission_source_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "authority" TEXT,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "site_typeId" INTEGER NOT NULL,
    "operator_name" TEXT,
    "status" "operational_status" NOT NULL DEFAULT 'ACTIVE',
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "emission_limit" DECIMAL(16,6),
    "measurement_frequency" "measurement_frequency" NOT NULL DEFAULT 'AD_HOC',
    "installation_date" TIMESTAMP(3),
    "maintenance_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_equipment" (
    "id" SERIAL NOT NULL,
    "site_id" INTEGER NOT NULL,
    "typeId" INTEGER,
    "model" TEXT,
    "serial" TEXT,
    "installed_at" TIMESTAMP(3),
    "last_calibration" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitoring_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_source" (
    "id" SERIAL NOT NULL,
    "site_id" INTEGER NOT NULL,
    "typeId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "component_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emission_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurement" (
    "id" SERIAL NOT NULL,
    "site_id" INTEGER NOT NULL,
    "equipment_id" INTEGER,
    "measured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DECIMAL(16,6) NOT NULL,
    "unit" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_regulation" (
    "id" SERIAL NOT NULL,
    "site_id" INTEGER NOT NULL,
    "regulation_id" INTEGER NOT NULL,
    "compliance_status" "compliance_status" NOT NULL,
    "last_inspection_date" TIMESTAMP(3),
    "next_inspection_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_regulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_report" (
    "id" SERIAL NOT NULL,
    "site_id" INTEGER NOT NULL,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" "incident_severity" NOT NULL DEFAULT 'LOW',
    "description" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_log" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "site_type_name_key" ON "site_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "site_type_code_key" ON "site_type"("code");

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_equipment_type_name_key" ON "monitoring_equipment_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "emission_source_type_name_key" ON "emission_source_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "site_name_key" ON "site"("name");

-- CreateIndex
CREATE UNIQUE INDEX "site_regulation_site_id_regulation_id_key" ON "site_regulation"("site_id", "regulation_id");

-- AddForeignKey
ALTER TABLE "site" ADD CONSTRAINT "site_site_typeId_fkey" FOREIGN KEY ("site_typeId") REFERENCES "site_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_equipment" ADD CONSTRAINT "monitoring_equipment_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_equipment" ADD CONSTRAINT "monitoring_equipment_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "monitoring_equipment_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emission_source" ADD CONSTRAINT "emission_source_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emission_source" ADD CONSTRAINT "emission_source_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "emission_source_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement" ADD CONSTRAINT "measurement_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement" ADD CONSTRAINT "measurement_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "monitoring_equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_regulation" ADD CONSTRAINT "site_regulation_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_regulation" ADD CONSTRAINT "site_regulation_regulation_id_fkey" FOREIGN KEY ("regulation_id") REFERENCES "regulation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_report" ADD CONSTRAINT "incident_report_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
