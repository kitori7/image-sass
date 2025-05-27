import { initTRPC } from '@trpc/server';

const t = initTRPC.create();

export const { router, procedure } = t;

export const appRouter = router({
  hello: procedure.query(() => {
    return 'Hello, world!';
  }),
});

export type AppRouter = typeof appRouter;
