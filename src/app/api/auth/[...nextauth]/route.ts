import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Gitlab from 'next-auth/providers/gitlab';
import { db } from '@/server/db/schema';

import * as dotenv from 'dotenv';
dotenv.config({ path: './dev.env' });

const handler = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Gitlab({
      clientId: process.env.AUTH_GITLAB_ID!,
      clientSecret: process.env.AUTH_GITLAB_SECRET!,
    }),
  ],
});

export { handler as GET, handler as POST };
