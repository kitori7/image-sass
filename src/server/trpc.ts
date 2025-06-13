import { initTRPC, TRPCError } from '@trpc/server';
import { getServerSession } from '@/server/auth';

const t = initTRPC.context().create();

const { router, procedure, middleware } = t;

export const withLoggerProcedure = procedure.use(async ({ next }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;
  console.log(`${result.ok ? '✅' : '❌'} ${duration}ms`);
  return result;
});

export const withSessionMiddleware = middleware(async ({ next }) => {
  const session = await getServerSession();
  return next({ ctx: { session } });
});

export const protectedProcedure = withLoggerProcedure
  .use(withSessionMiddleware)
  .use(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({ ctx: { session: ctx.session! } });
  });

export { router };
