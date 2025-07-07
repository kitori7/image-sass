import React from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface UploadStatusProps {
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

export default function UploadStatus({ status, errorMessage }: UploadStatusProps) {
  if (status === 'idle') return null;

  const statusConfig = {
    uploading: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      text: '正在上传图片...',
      bgColor: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
    },
    success: {
      icon: <CheckCircle className="h-4 w-4" />,
      text: '上传成功！',
      bgColor: 'bg-green-50 border-green-200',
      textColor: 'text-green-700',
    },
    error: {
      icon: <XCircle className="h-4 w-4" />,
      text: errorMessage || '上传失败',
      bgColor: 'bg-red-50 border-red-200',
      textColor: 'text-red-700',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  return (
    <div className={`border-l-4 p-4 ${config.bgColor} transition-all duration-300`}>
      <div className="flex items-center space-x-3">
        <div className={config.textColor}>{config.icon}</div>
        <div className={`font-medium ${config.textColor}`}>{config.text}</div>
      </div>
    </div>
  );
}
