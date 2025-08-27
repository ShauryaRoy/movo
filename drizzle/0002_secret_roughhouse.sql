CREATE TABLE "expense_settlements" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"from_user_id" varchar NOT NULL,
	"to_user_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text,
	"proof_image_url" text,
	"settled_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "event_expenses" ADD COLUMN "split_type" varchar DEFAULT 'equal' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_expenses" ADD COLUMN "split_details" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "theme_id" varchar(50) DEFAULT 'quantum-dark';--> statement-breakpoint
ALTER TABLE "expense_settlements" ADD CONSTRAINT "expense_settlements_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_settlements" ADD CONSTRAINT "expense_settlements_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_settlements" ADD CONSTRAINT "expense_settlements_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_expenses" DROP COLUMN "split_among";