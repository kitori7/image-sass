import { NextRequest } from 'next/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/router';

const handler = (request: NextRequest) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: () => ({}),
  });
};

export { handler as GET, handler as POST };
