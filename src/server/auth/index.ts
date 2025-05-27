import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Gitlab from 'next-auth/providers/gitlab';
import { db } from '@/server/db/schema';
import { getServerSession as getNextAuthServerSession } from 'next-auth';

import * as dotenv from 'dotenv';
dotenv.config({ path: './dev.env' });

export const AuthConfig = {
  adapter: DrizzleAdapter(db),
  providers: [
    Gitlab({
      clientId: process.env.AUTH_GITLAB_ID!,
      clientSecret: process.env.AUTH_GITLAB_SECRET!,
    }),
  ],
};

export function getServerSession() {
  return getNextAuthServerSession(AuthConfig);
}
