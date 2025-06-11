'use client';
import { useState, useEffect, useRef } from 'react';
import { Uppy } from '@uppy/core';
import AWS3 from '@uppy/aws-s3';
import Image from 'next/image';
import { useUppyState } from './useUppyState';
import { trpcPureClient } from '@/lib/trpc-client';
import { Button } from '@/components/ui/button';

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

  return (
    <div className="flex h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-center text-2xl font-bold">图片上传</h1>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="w-full rounded-md border border-gray-300 p-2"
        />

        {files.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {files.map(file => {
              const url = URL.createObjectURL(file.data);
              return (
                <div key={file.id} className="relative">
                  <Image
                    src={url}
                    alt={file.name || ''}
                    width={200}
                    height={200}
                    className="rounded object-cover"
                  />
                  <p className="mt-1 truncate text-sm text-gray-600">{file.name}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center">
          <Button
            onClick={() => uppy.upload()}
            disabled={files.length === 0 || uploadStatus === 'uploading'}
            className="min-w-32"
          >
            {uploadStatus === 'uploading' ? '上传中...' : '开始上传'}
          </Button>
        </div>

        <div className={`text-center text-sm ${getStatusColor()}`}>{getStatusText()}</div>
      </div>
    </div>
  );
}
