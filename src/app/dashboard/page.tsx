'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Meta, Uppy, UppyFile } from '@uppy/core';
import AWS3 from '@uppy/aws-s3';
import { useUppyState } from './useUppyState';
import { trpcPureClient, AppRouter } from '@/lib/trpc-client';
import { trpc } from '@/components/trpc-provider';
import Dropzone from '@/components/feature/Dropzone';
import usePasteFile from '@/hooks/usePasteFile';
import UploadButton from '@/components/feature/UploadButton';
import UploadStatus from '@/app/dashboard/components/UploadStatus';
import UpLoadPreview from '@/app/dashboard/components/UploadPreview';
import ImagePreviewList, { ImagePreviewItem } from '@/app/dashboard/components/ImagePreviewList';
import { inferRouterOutputs } from '@trpc/server';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

type FileItem = inferRouterOutputs<AppRouter>['file']['infiniteListFiles'];

export default function Dashboard() {
  // 使用 useRef 保存 Uppy 实例
  const uppyRef = useRef<Uppy | null>(null);

  // 初始化 Uppy 实例
  if (!uppyRef.current) {
    const uppy = new Uppy();
    uppy.use(AWS3, {
      shouldUseMultipart: false,
      getUploadParameters(file) {
        return trpcPureClient.file.createPresignedUrl.mutate({
          filename: file.data instanceof File ? file.data.name : '',
          contentType: file.data.type || '',
          size: file.size || 0,
        });
      },
    });
    uppyRef.current = uppy;
  }

  const uppy = uppyRef.current;

  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>(
    'idle'
  );
  const [uploadingFileIds, setUploadingFileIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const uppyFiles = useUppyState(uppy, s => s.files);
  const {
    data: infiniteData,
    isPending,
    fetchNextPage,
  } = trpc.file.infiniteListFiles.useInfiniteQuery(
    {
      limit: 10,
    },
    {
      getNextPageParam: res => res.nextCursor,
    }
  );
  const fileList =
    infiniteData?.pages.reduce((acc, page) => [...acc, ...page.files], [] as FileItem['files']) ??
    [];
  const utils = trpc.useUtils();

  // 在 useEffect 中管理事件监听器
  useEffect(() => {
    if (!uppy) return;

    const handleUpload = (uploadID: string, files: UppyFile<Meta, Record<string, never>>[]) => {
      setUploadStatus('uploading');
      setUploadingFileIds(files.map(file => file.id));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUploadSuccess = async (file: any, response: { uploadURL?: string }) => {
      if (file) {
        const res = await trpcPureClient.file.saveFile.mutate({
          name: file.data instanceof File ? file.data.name : '',
          type: file.data.type,
          path: response.uploadURL ?? '',
        });
        utils.file.infiniteListFiles.setInfiniteData(
          {
            limit: 10,
          },
          prev => {
            if (!prev) return { pages: [], pageParams: [] };

            const newPages = [...prev.pages];
            if (newPages.length > 0) {
              // 将新文件添加到第一页的最前面
              newPages[0] = {
                ...newPages[0],
                files: [res, ...newPages[0].files],
              };
            } else {
              // 如果没有页面，创建第一页
              newPages.push({
                files: [res],
                nextCursor: null,
              });
            }

            return {
              ...prev,
              pages: newPages,
            };
          }
        );
      }
    };

    const handleComplete = (result: { failed?: Array<unknown>; successful?: Array<unknown> }) => {
      setUploadingFileIds([]);
      if (result.failed && result.failed.length > 0) {
        setUploadStatus('error');
        setErrorMessage(`${result.failed.length} 个文件上传失败`);
      } else {
        setUploadStatus('success');
        // 上传成功后清空文件选择
        uppy.getFiles().forEach(file => {
          uppy.removeFile(file.id);
        });
        setTimeout(() => setUploadStatus('idle'), 3000); // 3秒后重置状态
      }
    };

    // 添加事件监听器
    uppy.on('upload', handleUpload);
    uppy.on('upload-success', handleUploadSuccess);
    uppy.on('complete', handleComplete);

    // 清理函数：移除事件监听器
    return () => {
      uppy.off('upload', handleUpload);
      uppy.off('upload-success', handleUploadSuccess);
      uppy.off('complete', handleComplete);
    };
  }, [uppy, utils]);

  // 组件卸载时清理 Uppy 实例
  useEffect(() => {
    return () => {
      if (uppyRef.current) {
        uppyRef.current.destroy();
        uppyRef.current = null;
      }
    };
  }, []);

  // 粘贴上传
  usePasteFile({
    onFilesPaste: files => {
      files.forEach(file => {
        uppy.addFile({
          name: file.name,
          type: file.type,
          data: file,
        });
      });
    },
  });

  // 乐观 UI 合并逻辑
  const uploadingImages: ImagePreviewItem[] = uploadingFileIds
    .map(id => {
      const item = uppyFiles[id];
      if (!item) return null;
      return {
        id: item.id,
        url: typeof item.data === 'string' ? item.data : URL.createObjectURL(item.data),
        name: item.name ?? '',
        createdAt: (item.meta.createdAt as string) || new Date().toISOString(),
        uploading: true,
      };
    })
    .filter(Boolean) as ImagePreviewItem[];

  const uploadedImages: ImagePreviewItem[] = (fileList || []).map(item => ({
    id: item.id,
    url: item.url,
    name: item.name,
    createdAt: item.createdAt || '',
    uploading: false,
  }));

  const images = useMemo(
    () => [...uploadingImages, ...uploadedImages],
    [uploadingImages, uploadedImages]
  );

  const buttonRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (buttonRef.current) {
      const currentButton = buttonRef.current;
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !isPending) {
              fetchNextPage();
            }
          });
        },
        {
          threshold: 0.1,
        }
      );
      observer.observe(currentButton);
      return () => {
        observer.disconnect();
      };
    }
  }, [isPending, fetchNextPage]);

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* 上传状态提示 */}
      <UploadStatus status={uploadStatus} errorMessage={errorMessage} />
      {/* 上传区域 */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧：标题和统计 */}
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-xl font-bold text-white">图片管理</h1>
                <p className="text-sm text-blue-100">
                  已上传 {images.filter(img => !img.uploading).length} 张图片
                  {uploadingFileIds.length > 0 && (
                    <span className="ml-2 text-yellow-300">
                      · 正在上传 {uploadingFileIds.length} 张
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex items-center space-x-3">
              <UploadButton uppy={uppy} />
            </div>
          </div>
        </div>
      </div>
      {/* 文件列表 - 使用 flex-1 自动填充剩余空间 */}
      <Dropzone uppy={uppy} className="flex-1 overflow-hidden">
        {dragging => (
          <div
            className={`relative h-full transition-all duration-300 ${
              dragging ? 'bg-gradient-to-br from-blue-50 to-purple-50' : 'bg-white'
            }`}
          >
            {/* 拖拽覆盖层 */}
            {dragging && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm">
                <div className="rounded-2xl bg-white/90 p-8 shadow-2xl backdrop-blur">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-4">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-800">释放以上传图片</h3>
                      <p className="text-sm text-gray-600">支持 JPG、PNG、GIF 等格式</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 内容区域 */}
            <div className="h-full p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">我的图片</h2>
                {!dragging && images.length === 0 && (
                  <div className="text-sm text-gray-500">拖拽图片到此处或点击上方按钮上传</div>
                )}
              </div>

              <div className="h-[calc(100%-5rem)] overflow-y-auto">
                {isPending ? (
                  <div className="flex h-32 items-center justify-center">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
                      <span>加载中...</span>
                    </div>
                  </div>
                ) : images.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                    <Upload className="mb-4 h-16 w-16" />
                    <h3 className="mb-2 text-lg font-medium">还没有图片</h3>
                    <p className="text-center text-sm">
                      点击&ldquo;选择图片&rdquo;按钮或将图片拖拽到此处开始上传
                    </p>
                  </div>
                ) : (
                  <ImagePreviewList images={images}>
                    <div className="flex justify-center p-8" ref={buttonRef}>
                      <Button variant="ghost" onClick={() => fetchNextPage()}>
                        加载更多
                      </Button>
                    </div>
                  </ImagePreviewList>
                )}
              </div>
            </div>
          </div>
        )}
      </Dropzone>

      <UpLoadPreview uppy={uppy}></UpLoadPreview>
    </div>
  );
}
