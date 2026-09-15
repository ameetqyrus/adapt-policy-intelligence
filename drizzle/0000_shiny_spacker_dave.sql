CREATE TABLE `chunks` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`body` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_chunks_source` ON `chunks` (`source_id`);--> statement-breakpoint
CREATE TABLE `investigations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`counties` text NOT NULL,
	`updated_at` text NOT NULL,
	`busy_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_investigations_owner` ON `investigations` (`owner_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`investigation_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`citations` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`investigation_id`) REFERENCES `investigations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_messages_investigation` ON `messages` (`investigation_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`url` text,
	`kind` text NOT NULL,
	`scope` text NOT NULL,
	`description` text NOT NULL,
	`status` text NOT NULL,
	`file_key` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
