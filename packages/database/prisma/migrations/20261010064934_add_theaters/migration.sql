-- CreateEnum
CREATE TYPE "TheaterStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "RoomLayoutStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');

-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "theaters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "street_address" TEXT NOT NULL,
    "ward" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "phone_number" TEXT,
    "status" "TheaterStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theaters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "theater_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_layouts" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "grid_rows" INTEGER NOT NULL,
    "grid_cols" INTEGER NOT NULL,
    "status" "RoomLayoutStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_types" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "max_occupancy" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seat_types_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "seats" (
    "id" TEXT NOT NULL,
    "layout_id" TEXT NOT NULL,
    "seat_type_code" TEXT NOT NULL,
    "row_label" TEXT NOT NULL,
    "column_number" INTEGER NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "status" "SeatStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "theaters_slug_key" ON "theaters"("slug");

-- CreateIndex
CREATE INDEX "rooms_theater_id_idx" ON "rooms"("theater_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_layouts_room_id_version_key" ON "room_layouts"("room_id", "version");

-- CreateIndex
CREATE INDEX "seats_seat_type_code_idx" ON "seats"("seat_type_code");

-- CreateIndex
CREATE UNIQUE INDEX "seats_layout_id_row_label_column_number_key" ON "seats"("layout_id", "row_label", "column_number");

-- CreateIndex
CREATE UNIQUE INDEX "seats_layout_id_y_x_key" ON "seats"("layout_id", "y", "x");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_theater_id_fkey" FOREIGN KEY ("theater_id") REFERENCES "theaters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_layouts" ADD CONSTRAINT "room_layouts_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_layout_id_fkey" FOREIGN KEY ("layout_id") REFERENCES "room_layouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_seat_type_code_fkey" FOREIGN KEY ("seat_type_code") REFERENCES "seat_types"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Hand-written below: Prisma cannot express these.

-- A closed room frees its code for a new room.
CREATE UNIQUE INDEX "rooms_theater_id_code_key" ON "rooms"("theater_id", "code") WHERE "status" <> 'CLOSED';

-- At most one draft and one published layout per room.
CREATE UNIQUE INDEX "room_layouts_one_draft_per_room" ON "room_layouts"("room_id") WHERE "status" = 'DRAFT';
CREATE UNIQUE INDEX "room_layouts_one_published_per_room" ON "room_layouts"("room_id") WHERE "status" = 'PUBLISHED';

-- Reference data every environment needs.
INSERT INTO "seat_types" ("code", "name", "max_occupancy", "width") VALUES
  ('STANDARD', 'Standard', 1, 1),
  ('VIP', 'VIP', 1, 1),
  ('COUPLE', 'Couple', 2, 2);
