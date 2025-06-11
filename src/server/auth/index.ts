import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Gitlab from 'next-auth/providers/gitlab';
import { db } from '@/server/db/schema';
import { getServerSession as getNextAuthServerSession } from 'next-auth';
import type { DefaultSession, NextAuthOptions } from 'next-auth';

import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/dev.env' });

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

export const AuthConfig: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    Gitlab({
      clientId: process.env.AUTH_GITLAB_ID!,
      clientSecret: process.env.AUTH_GITLAB_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};

export function getServerSession() {
  return getNextAuthServerSession(AuthConfig);
}
