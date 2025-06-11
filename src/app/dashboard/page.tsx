'use client';
import { useState, useEffect, useRef } from 'react';
import { Uppy } from '@uppy/core';
import AWS3 from '@uppy/aws-s3';
import Image from 'next/image';
import { useUppyState } from './useUppyState';
import { trpcPureClient } from '@/lib/trpc-client';
import { Button } from '@/components/ui/button';
import { trpc } from '@/components/trpc-provider';

export default function Dashboard() {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>(
    'idle'
  );
  const [errorMessage, setErrorMessage] = useState<string>('');

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

  // 在 useEffect 中管理事件监听器
  useEffect(() => {
    if (!uppy) return;

    // 定义事件处理函数
    const handleUpload = () => {
      setUploadStatus('uploading');
      setErrorMessage('');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUploadSuccess = (file: any, response: { uploadURL?: string }) => {
      if (file) {
        trpcPureClient.file.saveFile.mutate({
          name: file.data instanceof File ? file.data.name : '',
          type: file.data.type,
          path: response.uploadURL ?? '',
        });
      }
    };

    const handleComplete = (result: { failed?: Array<unknown>; successful?: Array<unknown> }) => {
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

    const handleError = (error: Error) => {
      setUploadStatus('error');
      setErrorMessage(error.message || '上传过程中发生错误');
    };

    // 添加事件监听器
    uppy.on('upload', handleUpload);
    uppy.on('upload-success', handleUploadSuccess);
    uppy.on('complete', handleComplete);
    uppy.on('error', handleError);

    // 清理函数：移除事件监听器
    return () => {
      uppy.off('upload', handleUpload);
      uppy.off('upload-success', handleUploadSuccess);
      uppy.off('complete', handleComplete);
      uppy.off('error', handleError);
    };
  }, [uppy]);

  // 组件卸载时清理 Uppy 实例
  useEffect(() => {
    return () => {
      if (uppyRef.current) {
        uppyRef.current.destroy();
        uppyRef.current = null;
      }
    };
  }, []);

  const files = useUppyState(uppy, state => Object.values(state.files));
  const progress = useUppyState(uppy, s => s.totalProgress);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      Array.from(fileList).forEach(file => {
        uppy.addFile({
          name: file.name,
          type: file.type,
          data: file,
        });
      });
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading':
        return `上传中... ${progress}%`;
      case 'success':
        return '上传成功！';
      case 'error':
        return `上传失败: ${errorMessage}`;
      default:
        return '选择图片并点击上传';
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // 列表展示
  const { data: fileList, isPending, refetch } = trpc.file.listFiles.useQuery();

  // 上传成功后刷新文件列表
  useEffect(() => {
    if (uploadStatus === 'success') {
      refetch();
    }
  }, [uploadStatus, refetch]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* 页面标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">我的图片库</h1>
          <p className="mt-2 text-gray-600">管理和浏览你的图片文件</p>
        </div>

        {/* 上传区域 */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center justify-center space-x-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="rounded-md border border-gray-300 p-2 text-sm"
            />
            <Button
              onClick={() => uppy.upload()}
              disabled={files.length === 0 || uploadStatus === 'uploading'}
              className="min-w-32"
            >
              {uploadStatus === 'uploading' ? '上传中...' : '开始上传'}
            </Button>
          </div>

          {/* 上传状态 */}
          <div className={`mt-4 text-center text-sm ${getStatusColor()}`}>{getStatusText()}</div>
        </div>

        {/* 文件列表 */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">已上传的图片</h2>

          {isPending ? (
            <div className="text-center text-gray-500">加载中...</div>
          ) : fileList && fileList.length > 0 ? (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {fileList.map(file => (
                <div
                  key={file.id}
                  className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={file.url}
                      alt={file.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(file.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>暂无上传的图片</p>
              <p className="mt-1 text-sm">选择图片文件开始上传吧</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
