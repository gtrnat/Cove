CREATE TYPE "public"."run_surface" AS ENUM('road', 'treadmill', 'trail', 'track');--> statement-breakpoint
CREATE TYPE "public"."run_type" AS ENUM('easy', 'tempo', 'interval', 'long', 'race', 'recovery');--> statement-breakpoint
CREATE TABLE "run_details" (
	"session_id" uuid PRIMARY KEY NOT NULL,
	"distance_m" integer NOT NULL,
	"run_type" "run_type" DEFAULT 'easy' NOT NULL,
	"surface" "run_surface" DEFAULT 'road' NOT NULL,
	"avg_hr" integer,
	"max_hr" integer,
	"elevation_gain_m" integer,
	"cadence" integer,
	CONSTRAINT "run_details_distance_range" CHECK ("run_details"."distance_m" > 0 and "run_details"."distance_m" <= 500000),
	CONSTRAINT "run_details_hr_range" CHECK (("run_details"."avg_hr" is null or "run_details"."avg_hr" between 30 and 240) and ("run_details"."max_hr" is null or "run_details"."max_hr" between 30 and 240))
);
--> statement-breakpoint
ALTER TABLE "run_details" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "run_details" ADD CONSTRAINT "run_details_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;