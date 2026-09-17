CREATE TABLE `policy_records` (
	`id` text PRIMARY KEY NOT NULL,
	`county_id` integer NOT NULL,
	`title` text NOT NULL,
	`adopted_date` text,
	`status` text NOT NULL,
	`outcome` text DEFAULT '' NOT NULL,
	`source_id` text NOT NULL,
	`excerpt` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `policy_records_county` ON `policy_records` (`county_id`);--> statement-breakpoint
ALTER TABLE `messages` ADD `context` text;