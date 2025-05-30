import { router } from '@/server/trpc';
import { fileRoutes } from './routes/file';

export const appRouter = router({ file: fileRoutes });

export type AppRouter = typeof appRouter;
