CREATE TABLE "file" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"url" varchar(1024) NOT NULL,
	"path" varchar(1024) NOT NULL,
	"userId" text NOT NULL,
	"contentType" varchar(255) NOT NULL,
	"deleteAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;