'use client';
import { useState, useEffect, useRef } from 'react';
import { Meta, Uppy, UppyFile } from '@uppy/core';
import AWS3 from '@uppy/aws-s3';
import { useUppyState } from './useUppyState';
import { trpcPureClient } from '@/lib/trpc-client';
import { trpc } from '@/components/trpc-provider';
import Dropzone from '@/components/feature/Dropzone';
import usePasteFile from '@/hooks/usePasteFile';
import UploadButton from '@/components/feature/UploadButton';
import UploadStatus from '@/app/dashboard/components/UploadStatus';
import UpLoadPreview from '@/app/dashboard/components/UploadPreview';
import ImagePreviewList, { ImagePreviewItem } from '@/app/dashboard/components/ImagePreviewList';

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
  const { data: fileList, isPending } = trpc.file.listFiles.useQuery();
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
        utils.file.listFiles.setData(undefined, prev => {
          if (!prev) {
            return [res];
          }
          return [res, ...prev];
        });
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

  const images = [...uploadingImages, ...uploadedImages];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* 页面标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">我的图片库</h1>
          <p className="mt-2 text-gray-600">管理和浏览你的图片文件</p>
        </div>
        {/* 上传状态提示 */}
        <UploadStatus status={uploadStatus} errorMessage={errorMessage} />
        {/* 上传区域 */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center justify-center space-x-4">
            <UploadButton uppy={uppy} />
          </div>
        </div>
        {/* 文件列表 */}
        <Dropzone uppy={uppy}>
          {dragging => (
            <div
              className={`relative rounded-lg bg-white p-6 shadow-sm ${dragging ? 'border-2 border-blue-500' : ''}`}
            >
              <h2 className="mb-6 text-xl font-semibold text-gray-900">已上传的图片</h2>
              {dragging && (
                <div className="absolute inset-0 z-10 flex h-full w-full items-center justify-center bg-gray-200/50 text-white">
                  拖拽图片到此处上传
                </div>
              )}
              {isPending ? (
                <div className="text-center text-gray-500">加载中...</div>
              ) : (
                <ImagePreviewList images={images} />
              )}
            </div>
          )}
        </Dropzone>
        <UpLoadPreview uppy={uppy}></UpLoadPreview>
      </div>
    </div>
  );
}
