import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import Uppy from '@uppy/core';
import { useUppyState } from '../../useUppyState';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FileItem from '@/components/feature/FileItem';

export default function UpLoadPreview({ uppy }: { uppy: Uppy }) {
  const files = useUppyState(uppy, s => Object.values(s.files));
  const open = files.length > 0;

  const [index, setIndex] = useState(0);

  const file = files[index];

  const clear = () => {
    files.forEach(file => {
      uppy.removeFile(file.id);
    });
    setIndex(0);
  };
  return file ? (
    <Dialog
      open={open}
      onOpenChange={flag => {
        if (!flag) {
          clear();
        }
      }}
    >
      <DialogContent className="max-w-3xl" onPointerDownOutside={e => e.preventDefault()}>
        <DialogTitle>图片预览</DialogTitle>
        <DialogDescription></DialogDescription>
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setIndex(index - 1)} disabled={index === 0}>
            <ChevronLeft />
          </Button>
          <FileItem
            url={URL.createObjectURL(file?.data ?? new File([], ''))}
            name={file?.name ?? ''}
            createdAt={new Date().toISOString()}
          />
          <Button
            variant="ghost"
            onClick={() => setIndex(index + 1)}
            disabled={index === files.length - 1}
          >
            <ChevronRight />
          </Button>
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => {
              uppy.removeFile(file.id);
              if (index >= files.length - 1) {
                setIndex(Math.max(0, files.length - 2));
              }
            }}
          >
            删除这张
          </Button>
          <Button
            onClick={async () => {
              await uppy.upload();
              clear();
            }}
          >
            上传全部
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null;
}
