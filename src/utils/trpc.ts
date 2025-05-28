import { initTRPC, TRPCError } from '@trpc/server';
import { getServerSession } from '@/server/auth';

export async function createTRPCContext() {
  const session = await getServerSession();
  if (!session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return {
    session,
  };
}

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create();

const { router, procedure, createCallerFactory, middleware } = t;

const logMiddleware = middleware(async ({ next }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;
  console.log(`${result.ok ? '✅' : '❌'} ${duration}ms`);
  return result;
});

const logProcedure = procedure.use(logMiddleware);

export const appRouter = router({
  hello: logProcedure.query(() => {
    return 'Hello, world!';
  }),
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
