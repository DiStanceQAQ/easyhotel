-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "banners" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(100),
    "image_url" TEXT NOT NULL,
    "hotel_id" UUID NOT NULL,
    "start_at" TIMESTAMPTZ(6),
    "end_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "hotel_id" UUID NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "operator_id" UUID NOT NULL,
    "reason" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_images" (
    "id" BIGSERIAL NOT NULL,
    "hotel_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_tags" (
    "hotel_id" UUID NOT NULL,
    "tag_id" BIGINT NOT NULL,

    CONSTRAINT "hotel_tags_pkey" PRIMARY KEY ("hotel_id","tag_id")
);

-- CreateTable
CREATE TABLE "hotels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "merchant_id" UUID NOT NULL,
    "name_cn" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(150) NOT NULL,
    "city" VARCHAR(50) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "lat" DECIMAL(10,6),
    "lng" DECIMAL(10,6),
    "star" SMALLINT NOT NULL,
    "opened_at" DATE NOT NULL,
    "facilities" JSONB NOT NULL DEFAULT '{}',
    "description" TEXT,
    "cover_image" TEXT,
    "min_price" INTEGER,
    "audit_status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "reject_reason" VARCHAR(255),
    "publish_status" VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_profile" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "merchant_name" VARCHAR(100) NOT NULL,
    "contact_name" VARCHAR(50),
    "contact_phone" VARCHAR(30),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchant_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_price_calendar" (
    "id" BIGSERIAL NOT NULL,
    "room_type_id" BIGINT NOT NULL,
    "date" DATE NOT NULL,
    "price" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_price_calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_types" (
    "id" BIGSERIAL NOT NULL,
    "hotel_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "base_price" INTEGER NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'CNY',
    "max_guests" SMALLINT NOT NULL DEFAULT 2,
    "breakfast" BOOLEAN NOT NULL DEFAULT false,
    "refundable" BOOLEAN NOT NULL DEFAULT true,
    "area_m2" INTEGER,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cover_image" TEXT,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_banners_hotel_id" ON "banners"("hotel_id");

-- CreateIndex
CREATE INDEX "idx_banners_is_active_sort" ON "banners"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "idx_hotel_audit_logs_hotel_id" ON "hotel_audit_logs"("hotel_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_hotel_audit_logs_operator_id" ON "hotel_audit_logs"("operator_id");

-- CreateIndex
CREATE INDEX "idx_hotel_images_hotel_id" ON "hotel_images"("hotel_id");

-- CreateIndex
CREATE INDEX "idx_hotels_audit_publish" ON "hotels"("audit_status", "publish_status");

-- CreateIndex
CREATE INDEX "idx_hotels_city" ON "hotels"("city");

-- CreateIndex
CREATE INDEX "idx_hotels_merchant_id" ON "hotels"("merchant_id");

-- CreateIndex
CREATE INDEX "idx_hotels_min_price" ON "hotels"("min_price");

-- CreateIndex
CREATE INDEX "idx_hotels_star" ON "hotels"("city", "star");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_profile_user_id_key" ON "merchant_profile"("user_id");

-- CreateIndex
CREATE INDEX "idx_room_price_calendar_room_type_id" ON "room_price_calendar"("room_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_price_calendar_room_type_id_date_key" ON "room_price_calendar"("room_type_id", "date");

-- CreateIndex
CREATE INDEX "idx_room_types_hotel_id" ON "room_types"("hotel_id");

-- CreateIndex
CREATE INDEX "idx_room_types_hotel_price" ON "room_types"("hotel_id", "base_price");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "idx_users_username" ON "users"("username");

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hotel_audit_logs" ADD CONSTRAINT "hotel_audit_logs_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hotel_audit_logs" ADD CONSTRAINT "hotel_audit_logs_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hotel_images" ADD CONSTRAINT "hotel_images_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hotel_tags" ADD CONSTRAINT "hotel_tags_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hotel_tags" ADD CONSTRAINT "hotel_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "merchant_profile" ADD CONSTRAINT "merchant_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "room_price_calendar" ADD CONSTRAINT "room_price_calendar_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
