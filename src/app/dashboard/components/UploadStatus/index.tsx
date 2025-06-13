import React from 'react';

interface UploadStatusProps {
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

const statusMap = {
  idle: null,
  uploading: <div className="mb-4 text-blue-600">正在上传...</div>,
  success: <div className="mb-4 text-green-600">上传成功！</div>,
  error: (msg: string) => <div className="mb-4 text-red-600">{msg}</div>,
};

export default function UploadStatus({ status, errorMessage }: UploadStatusProps) {
  if (status === 'idle') return null;
  if (status === 'error') return statusMap.error(errorMessage || '上传失败');
  return statusMap[status] as React.ReactNode;
}
