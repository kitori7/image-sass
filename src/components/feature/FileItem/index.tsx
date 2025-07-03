import { Meta, UppyFile } from '@uppy/core';
import Image from 'next/image';
import { useMemo } from 'react';

export interface FileItemProps {
  url: string;
  name: string;
  createdAt: string;
  uploading?: boolean;
}

export default function FileItem({ url, name, createdAt, uploading }: FileItemProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg bg-white shadow-sm transition-all hover:shadow-md">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={url}
          alt={name}
          width={300}
          height={300}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-lg font-bold text-blue-500">
            上传中...
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">{new Date(createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

export function LocalFileItem({
  file,
  createdAt,
  uploading,
}: {
  file: UppyFile<Meta, Record<string, never>>;
  createdAt: string;
  uploading?: boolean;
}) {
  const url = useMemo(() => URL.createObjectURL(file.data), [file]);
  return <FileItem url={url} name={file.name || ''} createdAt={createdAt} uploading={uploading} />;
}

export function RemoteFileItem({
  url,
  name,
  createdAt,
  uploading,
}: {
  url: string;
  name: string;
  createdAt: string;
  uploading?: boolean;
}) {
  return <FileItem url={url} name={name} createdAt={createdAt} uploading={uploading} />;
}
