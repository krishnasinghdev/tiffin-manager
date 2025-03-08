CREATE TYPE "public"."contact_method" AS ENUM('sms', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."customer_status" AS ENUM('active', 'inactive', 'left');--> statement-breakpoint
CREATE TYPE "public"."error_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."notice_status" AS ENUM('delivered', 'pending', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('cash', 'online');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'partial_paid', 'paid', 'advance');--> statement-breakpoint
CREATE TYPE "public"."plan_type" AS ENUM('random', 'regular');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'staff');--> statement-breakpoint
CREATE TABLE "bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"vendor_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"due_date" date NOT NULL,
	"bill_date" date NOT NULL,
	"bill_no" integer NOT NULL,
	"bill_type" "plan_type" DEFAULT 'regular' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"bill_detail" jsonb NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"remaining_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"note" varchar(256),
	"is_closed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"vendor_id" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"address" varchar(256) NOT NULL,
	"status" "customer_status" DEFAULT 'active' NOT NULL,
	"phone" varchar(12) NOT NULL,
	"plan_type" "plan_type" DEFAULT 'regular' NOT NULL,
	"_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"last_bill_date" date,
	"contact_method" "contact_method" DEFAULT 'whatsapp' NOT NULL,
	"plan_id" integer,
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "customers_phone_unique" UNIQUE("phone"),
	CONSTRAINT "customers__id_unique" UNIQUE("_id")
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"customer_id" integer NOT NULL,
	"month_year" char(7) NOT NULL,
	"day1" char(3) DEFAULT 'AAA' NOT NULL,
	"day2" char(3) DEFAULT 'AAA' NOT NULL,
	"day3" char(3) DEFAULT 'AAA' NOT NULL,
	"day4" char(3) DEFAULT 'AAA' NOT NULL,
	"day5" char(3) DEFAULT 'AAA' NOT NULL,
	"day6" char(3) DEFAULT 'AAA' NOT NULL,
	"day7" char(3) DEFAULT 'AAA' NOT NULL,
	"day8" char(3) DEFAULT 'AAA' NOT NULL,
	"day9" char(3) DEFAULT 'AAA' NOT NULL,
	"day10" char(3) DEFAULT 'AAA' NOT NULL,
	"day11" char(3) DEFAULT 'AAA' NOT NULL,
	"day12" char(3) DEFAULT 'AAA' NOT NULL,
	"day13" char(3) DEFAULT 'AAA' NOT NULL,
	"day14" char(3) DEFAULT 'AAA' NOT NULL,
	"day15" char(3) DEFAULT 'AAA' NOT NULL,
	"day16" char(3) DEFAULT 'AAA' NOT NULL,
	"day17" char(3) DEFAULT 'AAA' NOT NULL,
	"day18" char(3) DEFAULT 'AAA' NOT NULL,
	"day19" char(3) DEFAULT 'AAA' NOT NULL,
	"day20" char(3) DEFAULT 'AAA' NOT NULL,
	"day21" char(3) DEFAULT 'AAA' NOT NULL,
	"day22" char(3) DEFAULT 'AAA' NOT NULL,
	"day23" char(3) DEFAULT 'AAA' NOT NULL,
	"day24" char(3) DEFAULT 'AAA' NOT NULL,
	"day25" char(3) DEFAULT 'AAA' NOT NULL,
	"day26" char(3) DEFAULT 'AAA' NOT NULL,
	"day27" char(3) DEFAULT 'AAA' NOT NULL,
	"day28" char(3) DEFAULT 'AAA' NOT NULL,
	"day29" char(3) DEFAULT 'AAA' NOT NULL,
	"day30" char(3) DEFAULT 'AAA' NOT NULL,
	"day31" char(3) DEFAULT 'AAA' NOT NULL,
	"add_ons" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "error_logs" (
	"staff_id" integer,
	"error_message" varchar(256) NOT NULL,
	"error_stack" text,
	"error_code" varchar(50),
	"path" varchar(256),
	"method" varchar(10),
	"severity" "error_severity" DEFAULT 'medium' NOT NULL,
	"request_data" jsonb,
	"resolved" boolean DEFAULT false NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"date" date NOT NULL,
	"month_year" varchar(7) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"type" varchar(28) NOT NULL,
	"note" varchar(256),
	"staff_id" integer,
	"vendor_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notices" (
	"vendor_id" integer NOT NULL,
	"date" varchar(16) NOT NULL,
	"time" varchar(16) NOT NULL,
	"status" "notice_status" DEFAULT 'pending' NOT NULL,
	"detail" varchar(256) NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"vendor_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"bill_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"payment_mode" "payment_mode" NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"vendor_id" integer NOT NULL,
	"plan_name" varchar(256) NOT NULL,
	"plan_description" varchar(256) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"lunch" boolean DEFAULT true NOT NULL,
	"dinner" boolean DEFAULT true NOT NULL,
	"breakfast" boolean DEFAULT false NOT NULL,
	"total_tiffins" integer NOT NULL,
	"price_per_tiffin" numeric(10, 2) NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"endpoint" varchar(256) NOT NULL,
	"auth" varchar(256) NOT NULL,
	"p256dh" varchar(256) NOT NULL,
	"staff_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "staffs" (
	"vendor_id" integer NOT NULL,
	"role" "role" DEFAULT 'staff' NOT NULL,
	"name" varchar(256) NOT NULL,
	"password" varchar(256) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"phone" varchar(12) NOT NULL,
	"staff_role" varchar(28) NOT NULL,
	"staff_id" varchar(8) NOT NULL,
	"_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"access_token" varchar(512),
	"access_token_expires" timestamp with time zone,
	"verification_token" varchar(512),
	"verification_token_expires" timestamp with time zone,
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "staffs_phone_unique" UNIQUE("phone"),
	CONSTRAINT "staffs_staff_id_unique" UNIQUE("staff_id"),
	CONSTRAINT "staffs__id_unique" UNIQUE("_id")
);
--> statement-breakpoint
CREATE TABLE "staff_attendances" (
	"vendor_id" integer NOT NULL,
	"staff_id" integer NOT NULL,
	"month_year" char(7) NOT NULL,
	"day1" char(2) DEFAULT 'AA' NOT NULL,
	"day2" char(2) DEFAULT 'AA' NOT NULL,
	"day3" char(2) DEFAULT 'AA' NOT NULL,
	"day4" char(2) DEFAULT 'AA' NOT NULL,
	"day5" char(2) DEFAULT 'AA' NOT NULL,
	"day6" char(2) DEFAULT 'AA' NOT NULL,
	"day7" char(2) DEFAULT 'AA' NOT NULL,
	"day8" char(2) DEFAULT 'AA' NOT NULL,
	"day9" char(2) DEFAULT 'AA' NOT NULL,
	"day10" char(2) DEFAULT 'AA' NOT NULL,
	"day11" char(2) DEFAULT 'AA' NOT NULL,
	"day12" char(2) DEFAULT 'AA' NOT NULL,
	"day13" char(2) DEFAULT 'AA' NOT NULL,
	"day14" char(2) DEFAULT 'AA' NOT NULL,
	"day15" char(2) DEFAULT 'AA' NOT NULL,
	"day16" char(2) DEFAULT 'AA' NOT NULL,
	"day17" char(2) DEFAULT 'AA' NOT NULL,
	"day18" char(2) DEFAULT 'AA' NOT NULL,
	"day19" char(2) DEFAULT 'AA' NOT NULL,
	"day20" char(2) DEFAULT 'AA' NOT NULL,
	"day21" char(2) DEFAULT 'AA' NOT NULL,
	"day22" char(2) DEFAULT 'AA' NOT NULL,
	"day23" char(2) DEFAULT 'AA' NOT NULL,
	"day24" char(2) DEFAULT 'AA' NOT NULL,
	"day25" char(2) DEFAULT 'AA' NOT NULL,
	"day26" char(2) DEFAULT 'AA' NOT NULL,
	"day27" char(2) DEFAULT 'AA' NOT NULL,
	"day28" char(2) DEFAULT 'AA' NOT NULL,
	"day29" char(2) DEFAULT 'AA' NOT NULL,
	"day30" char(2) DEFAULT 'AA' NOT NULL,
	"day31" char(2) DEFAULT 'AA' NOT NULL,
	"notes" varchar(256),
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"name" varchar(256) NOT NULL,
	"address" varchar(256) NOT NULL,
	"service_area" varchar(128)[],
	"is_active" boolean DEFAULT true NOT NULL,
	"phone" varchar(12) NOT NULL,
	"org_name" varchar(256) NOT NULL,
	"_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"qr_code" varchar(256),
	"upi_id" varchar(56),
	"logo_url" varchar(256),
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "vendors_phone_unique" UNIQUE("phone"),
	CONSTRAINT "vendors__id_unique" UNIQUE("_id")
);
--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_staff_id_staffs_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staffs"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_staff_id_staffs_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staffs"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_staff_id_staffs_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staffs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "staff_attendances" ADD CONSTRAINT "staff_attendances_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "staff_attendances" ADD CONSTRAINT "staff_attendances_staff_id_staffs_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staffs"("id") ON DELETE restrict ON UPDATE cascade;