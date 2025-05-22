import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const Users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});
