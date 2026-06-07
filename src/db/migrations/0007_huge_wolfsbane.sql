CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'pendente' NOT NULL,
	"cost" numeric DEFAULT '0' NOT NULL,
	"supplier_name" text,
	"supplier_phone" text,
	"reported_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"type" text NOT NULL,
	"link" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "parts_catalog" ADD COLUMN "avg_market_value" numeric DEFAULT '0' NOT NULL;