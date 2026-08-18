CREATE TABLE `courseCertificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseCode` varchar(64) NOT NULL,
	`certificateCode` varchar(48) NOT NULL,
	`completedModules` int NOT NULL,
	`passedAssessments` int NOT NULL,
	`defenseReviewCount` int NOT NULL,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `courseCertificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `courseCertificates_certificateCode_unique` UNIQUE(`certificateCode`),
	CONSTRAINT `courseCertificates_user_course_unique` UNIQUE(`userId`,`courseCode`)
);
--> statement-breakpoint
CREATE TABLE `learningProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`problemId` int NOT NULL,
	`level` int NOT NULL,
	`hintCount` int NOT NULL DEFAULT 0,
	`defenseReviewed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learningProgress_id` PRIMARY KEY(`id`),
	CONSTRAINT `learningProgress_user_problem_unique` UNIQUE(`userId`,`problemId`)
);
--> statement-breakpoint
CREATE TABLE `levelAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`level` int NOT NULL,
	`score` int NOT NULL DEFAULT 100,
	`passedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `levelAssessments_id` PRIMARY KEY(`id`),
	CONSTRAINT `levelAssessments_user_level_unique` UNIQUE(`userId`,`level`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `courseCertificates` ADD CONSTRAINT `courseCertificates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learningProgress` ADD CONSTRAINT `learningProgress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `levelAssessments` ADD CONSTRAINT `levelAssessments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;