ALTER TABLE "parts_catalog" ADD COLUMN "is_kit" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "parts_catalog" ADD COLUMN "kit_parts" jsonb DEFAULT '[]'::jsonb NOT NULL;