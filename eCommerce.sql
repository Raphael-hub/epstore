CREATE TYPE "currencies" AS ENUM (
  'gbp',
  'eur',
  'usd'
);

CREATE TYPE "order_status" AS ENUM (
  'pending',
  'out_for_delivery',
  'fulfilled',
  'cancelled'
);

CREATE TABLE "users" (
  "id" serial PRIMARY KEY,
  "username" varchar(20) UNIQUE NOT NULL,
  "password" varchar NOT NULL,
  "email" varchar(60) UNIQUE NOT NULL,
  "name" varchar NOT NULL,
  "address" varchar NOT NULL,
  "created_at" timestamp NOT NULL
);

CREATE TABLE "products" (
  "id" serial PRIMARY KEY,
  "user_id" int REFERENCES "users"("id"),
  "name" varchar NOT NULL,
  "description" varchar NOT NULL,
  "price" numeric(6, 2) NOT NULL,
  "currency" currencies DEFAULT 'gbp',
  "stock" int NOT NULL,
  "listed_at" timestamp NOT NULL,
  CHECK ("stock" >= 0 AND "price" >= 0)
);

CREATE TABLE "users_carts" (
  "user_id" int REFERENCES "users"("id"),
  "product_id" int REFERENCES "products"("id"),
  "quantity" int DEFAULT 1,
  CHECK("quantity" > 0)
);

CREATE TABLE "orders" (
  "id" serial PRIMARY KEY,
  "user_id" int REFERENCES "users"("id"),
  "status" order_status,
  "created_at" timestamp NOT NULL
);

CREATE TABLE "orders_products" (
  "order_id" int REFERENCES "orders"("id"),
  "product_id" int REFERENCES "products"("id"),
  "quantity" int DEFAULT 1,
  CHECK ("quantity" > 0)
);

COMMENT ON COLUMN "users"."password" IS 'password stored as hash';

COMMENT ON COLUMN "products"."price" IS 'maximum value: 9999.99';
