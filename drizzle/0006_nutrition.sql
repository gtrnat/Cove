CREATE TYPE "public"."food_status" AS ENUM('verified', 'community');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');--> statement-breakpoint
CREATE TABLE "body_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"measured_on" date NOT NULL,
	"weight_kg" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "body_metrics_user_day_key" UNIQUE("user_id","measured_on"),
	CONSTRAINT "body_metrics_weight_range" CHECK ("body_metrics"."weight_kg" >= 20 and "body_metrics"."weight_kg" <= 400)
);
--> statement-breakpoint
ALTER TABLE "body_metrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "food_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"food_id" uuid,
	"unit_id" uuid,
	"name_snapshot" text NOT NULL,
	"unit_label_snapshot" text NOT NULL,
	"quantity" numeric(7, 2) NOT NULL,
	"grams" numeric(8, 2) NOT NULL,
	"protein_g" numeric(6, 1) NOT NULL,
	"calories" numeric(7, 1),
	"meal" "meal_type" NOT NULL,
	"logged_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "food_logs_quantity_positive" CHECK ("food_logs"."quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "food_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "food_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"label" text NOT NULL,
	"grams_per_unit" numeric(7, 2) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	CONSTRAINT "food_units_food_label_key" UNIQUE("food_id","label"),
	CONSTRAINT "food_units_grams_positive" CHECK ("food_units"."grams_per_unit" > 0)
);
--> statement-breakpoint
ALTER TABLE "food_units" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_normalized" text NOT NULL,
	"brand" text,
	"protein_per_100g" numeric(5, 2) NOT NULL,
	"calories_per_100g" numeric(6, 1),
	"carbs_per_100g" numeric(5, 2),
	"fat_per_100g" numeric(5, 2),
	"status" "food_status" DEFAULT 'community' NOT NULL,
	"created_by" text,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "foods_protein_range" CHECK ("foods"."protein_per_100g" >= 0 and "foods"."protein_per_100g" <= 100)
);
--> statement-breakpoint
ALTER TABLE "foods" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "body_metrics" ADD CONSTRAINT "body_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_unit_id_food_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."food_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_units" ADD CONSTRAINT "food_units_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "food_logs_user_day_idx" ON "food_logs" USING btree ("user_id","logged_on");--> statement-breakpoint
CREATE INDEX "food_logs_food_idx" ON "food_logs" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "foods_name_normalized_idx" ON "foods" USING btree ("name_normalized");--> statement-breakpoint
CREATE INDEX "foods_created_by_idx" ON "foods" USING btree ("created_by");