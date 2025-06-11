import { router } from '@/server/trpc';
import { protectedProcedure } from '../trpc';
import { z } from 'zod/v4';
import * as dotenv from 'dotenv';
import { PutObjectCommand, PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { TRPCError } from '@trpc/server';
import db from '../db';
import { files } from '../db/schema';
import { desc } from 'drizzle-orm';

dotenv.config({ path: process.cwd() + '/dev.env' });

export const fileRoutes = router({
  createPresignedUrl: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        contentType: z.string(),
        size: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // 生成文件key，添加随机UUID避免重名
        const randomId = crypto.randomUUID().replace(/-/g, '');
        const fileExtension = input.filename.split('.').pop();
        const key = `love-img/${randomId}.${fileExtension}`;

        const params: PutObjectCommandInput = {
          Bucket: process.env.BUCKET,
          Key: key,
          ContentType: input.contentType,
          ContentLength: input.size,
        };

        const s3Client = new S3Client({
          endpoint: process.env.API_ENDPOINT,
          region: process.env.REGION,
          forcePathStyle: true, // 腾讯云COS需要这个配置
          credentials: {
            accessKeyId: process.env.COS_APP_ID!,
            secretAccessKey: process.env.COS_APP_SECRET_KEY!,
          },
        });

        const command = new PutObjectCommand(params);
        const url = await getSignedUrl(s3Client, command, {
          expiresIn: 300, // 增加到5分钟
        });

        return {
          url,
          method: 'PUT' as const,
          key, // 返回文件key，方便后续获取
        };
      } catch (error) {
        console.error('生成预签名URL失败:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '生成上传URL失败',
        });
      }
    }),
  saveFile: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        path: z.string(),
        type: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const url = new URL(input.path);
      const photo = await db
        .insert(files)
        .values({
          ...input,
          path: url.pathname,
          url: url.toString(),
          userId: session.user.id,
          contentType: input.type,
        })
        .returning();
      return photo[0];
    }),
  listFiles: protectedProcedure.query(async ({}) => {
    const res = await db.query.files.findMany({
      orderBy: [desc(files.createdAt)],
    });
    return res;
  }),
});
