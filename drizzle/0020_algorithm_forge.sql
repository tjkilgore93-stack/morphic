CREATE TABLE "algorithm_projects" (
  "id" varchar(191) PRIMARY KEY NOT NULL,
  "user_id" varchar(255) NOT NULL,
  "title" varchar(160) NOT NULL,
  "description" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "algorithm_versions" (
  "id" varchar(191) PRIMARY KEY NOT NULL,
  "project_id" varchar(191) NOT NULL,
  "user_id" varchar(255) NOT NULL,
  "version_number" integer NOT NULL,
  "blueprint" jsonb NOT NULL,
  "model_id" varchar(256) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "algorithm_versions_project_id_algorithm_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."algorithm_projects"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX "algorithm_versions_project_version_idx" ON "algorithm_versions" USING btree ("project_id","version_number");
--> statement-breakpoint
CREATE INDEX "algorithm_projects_user_updated_idx" ON "algorithm_projects" USING btree ("user_id","updated_at" DESC);
--> statement-breakpoint
CREATE INDEX "algorithm_versions_user_created_idx" ON "algorithm_versions" USING btree ("user_id","created_at" DESC);
--> statement-breakpoint
ALTER TABLE "algorithm_projects" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "algorithm_versions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "users_manage_own_algorithm_projects" ON "algorithm_projects" AS PERMISSIVE FOR ALL TO public USING ("user_id" = (select current_setting('app.current_user_id', true))) WITH CHECK ("user_id" = (select current_setting('app.current_user_id', true)));
--> statement-breakpoint
CREATE POLICY "users_manage_own_algorithm_versions" ON "algorithm_versions" AS PERMISSIVE FOR ALL TO public USING ("user_id" = (select current_setting('app.current_user_id', true))) WITH CHECK ("user_id" = (select current_setting('app.current_user_id', true)));
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "algorithm_projects" TO app_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "algorithm_versions" TO app_user;
  END IF;
END $$;
