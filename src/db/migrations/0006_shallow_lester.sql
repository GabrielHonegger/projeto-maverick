CREATE TABLE "parts_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"brand" text NOT NULL,
	"code" text NOT NULL,
	"model" text NOT NULL,
	"technical_specifications" text,
	"measurements" text,
	"price" numeric DEFAULT '0' NOT NULL,
	"cost" numeric DEFAULT '0' NOT NULL,
	"specific_bikes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"price" numeric DEFAULT '0' NOT NULL,
	"estimated_time" text DEFAULT '' NOT NULL,
	"cc_ranges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"specific_bikes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
