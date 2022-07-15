CREATE TYPE "account_role" AS ENUM (
  'general',
  'moderator',
  'admin'
);

CREATE TYPE "currencies" AS ENUM (
  'gbp',
  'eur',
  'usd'
);

CREATE TYPE "status" AS ENUM (
  'pending',
  'shipped',
  'cancelled',
  'disputed'
);

CREATE TABLE "users" (
  "id" serial PRIMARY KEY,
  "username" varchar(20) UNIQUE NOT NULL,
  "password" varchar NOT NULL,
  "email" varchar(60) UNIQUE NOT NULL,
  "name" varchar NOT NULL,
  "address" varchar,
  "role" account_role DEFAULT 'general',
  "created_at" timestamp NOT NULL
);

CREATE TABLE "products" (
  "id" serial PRIMARY KEY,
  "user_id" int REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar NOT NULL,
  "description" varchar NOT NULL,
  "price" numeric(6, 2) NOT NULL,
  "currency" currencies DEFAULT 'gbp',
  "stock" int NOT NULL,
  "listed_at" timestamp NOT NULL,
  CHECK ("stock" >= 0 AND "price" >= 0)
);

CREATE TABLE "users_carts" (
  "user_id" int REFERENCES "users"("id") ON DELETE CASCADE,
  "product_id" int REFERENCES "products"("id") ON DELETE CASCADE,
  "quantity" int DEFAULT 1,
  CHECK("quantity" > 0),
  PRIMARY KEY ("user_id", "product_id")
);

CREATE TABLE "orders" (
  "id" serial PRIMARY KEY,
  "user_id" int REFERENCES "users"("id") ON DELETE CASCADE,
  "status" status DEFAULT 'pending',
  "created_at" timestamp NOT NULL
);

CREATE TABLE "orders_products" (
  "order_id" int REFERENCES "orders"("id") ON DELETE CASCADE,
  "product_id" int REFERENCES "products"("id") ON DELETE CASCADE,
  "quantity" int DEFAULT 1,
  "status" status DEFAULT 'pending',
  CHECK ("quantity" > 0),
  PRIMARY KEY("order_id", "product_id")
);

CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
)
WITH (OIDS=FALSE);

CREATE INDEX "IDX_session_expire" ON "session" ("expire");

COMMENT ON COLUMN "users"."password" IS 'password stored as hash';

COMMENT ON COLUMN "products"."price" IS 'maximum value: 9999.99';
