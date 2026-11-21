import { createId } from '@paralleldrive/cuid2'
import { InferSelectModel, sql } from 'drizzle-orm'
import { index, integer, jsonb, pgPolicy, pgTable, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'

const ID_LENGTH = 191
const USER_ID_LENGTH = 255
const generateAlgorithmId = () => createId()

export const algorithmProjects = pgTable('algorithm_projects', {
  id: varchar('id', { length: ID_LENGTH }).primaryKey().$defaultFn(generateAlgorithmId),
  userId: varchar('user_id', { length: USER_ID_LENGTH }).notNull(),
  title: varchar('title', { length: 160 }).notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, table => [
  index('algorithm_projects_user_updated_idx').on(table.userId, table.updatedAt.desc()),
  pgPolicy('users_manage_own_algorithm_projects', {
    as: 'permissive',
    for: 'all',
    to: 'public',
    using: sql.raw("user_id = (select current_setting('app.current_user_id', true))"),
    withCheck: sql.raw("user_id = (select current_setting('app.current_user_id', true))")
  })
]).enableRLS()

export const algorithmVersions = pgTable('algorithm_versions', {
  id: varchar('id', { length: ID_LENGTH }).primaryKey().$defaultFn(generateAlgorithmId),
  projectId: varchar('project_id', { length: ID_LENGTH }).notNull().references(() => algorithmProjects.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: USER_ID_LENGTH }).notNull(),
  versionNumber: integer('version_number').notNull(),
  blueprint: jsonb('blueprint').notNull().$type<Record<string, unknown>>(),
  modelId: varchar('model_id', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, table => [
  uniqueIndex('algorithm_versions_project_version_idx').on(table.projectId, table.versionNumber),
  index('algorithm_versions_user_created_idx').on(table.userId, table.createdAt.desc()),
  pgPolicy('users_manage_own_algorithm_versions', {
    as: 'permissive',
    for: 'all',
    to: 'public',
    using: sql.raw("user_id = (select current_setting('app.current_user_id', true))"),
    withCheck: sql.raw("user_id = (select current_setting('app.current_user_id', true))")
  })
]).enableRLS()

export type AlgorithmProject = InferSelectModel<typeof algorithmProjects>
export type AlgorithmVersion = InferSelectModel<typeof algorithmVersions>
