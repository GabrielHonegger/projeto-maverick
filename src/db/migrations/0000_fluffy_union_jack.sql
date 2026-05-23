CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"nickname" text,
	"cpf" text NOT NULL,
	"birth_date" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"gender" text NOT NULL,
	"address" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "motorbikes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"model" text NOT NULL,
	"year" text NOT NULL,
	"color" text NOT NULL,
	"brand" text NOT NULL,
	"plate" text NOT NULL,
	"vin" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"os_number" serial NOT NULL,
	"client_id" uuid NOT NULL,
	"motorbike_id" uuid NOT NULL,
	"status" text NOT NULL,
	"odometer" text NOT NULL,
	"fuel_level" text NOT NULL,
	"tires_condition" jsonb NOT NULL,
	"accessories" jsonb NOT NULL,
	"custom_accessories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"damage_points" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"inspection_photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"electrical_problems" text,
	"maintenance_problems" text,
	"customer_complaints" text NOT NULL,
	"technical_report" text,
	"internal_notes" text,
	"labor" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"parts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"discounts" numeric DEFAULT '0' NOT NULL,
	"other_charges" numeric DEFAULT '0' NOT NULL,
	"towing_fee" numeric DEFAULT '0' NOT NULL,
	"total_value" numeric DEFAULT '0' NOT NULL,
	"payments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"entry_date" timestamp DEFAULT now() NOT NULL,
	"ready_date" timestamp,
	"exit_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_orders_os_number_unique" UNIQUE("os_number")
);
--> statement-breakpoint
ALTER TABLE "motorbikes" ADD CONSTRAINT "motorbikes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_motorbike_id_motorbikes_id_fk" FOREIGN KEY ("motorbike_id") REFERENCES "public"."motorbikes"("id") ON DELETE restrict ON UPDATE no action;