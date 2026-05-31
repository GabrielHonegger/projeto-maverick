ALTER TABLE "service_orders" ADD COLUMN "brake_pads_condition" jsonb;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN "labor_general_technician" text;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN "parts_general_technician" text;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN "fuel_refueling_value" numeric DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN "fuel_refueling_liters" numeric DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN "fuel_refueling_receipt_photo" text;