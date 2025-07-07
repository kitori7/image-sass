import { Button } from '@/components/ui/button';
import Uppy from '@uppy/core';
import { Upload } from 'lucide-react';
import { useRef } from 'react';

export default function UploadButton({ uppy }: { uppy: Uppy }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button
        onClick={() => inputRef.current?.click()}
        className="bg-white text-blue-600 shadow-md transition-all duration-200 hover:bg-blue-50 hover:text-blue-700"
        size="default"
      >
        <Upload className="mr-2 h-4 w-4" />
        <span className="font-medium">选择图片</span>
      </Button>
      <input
        type="file"
        multiple
        accept="image/*"
        ref={inputRef}
        className="hidden"
        onChange={e => {
          const fileList = e.target.files;
          if (fileList) {
            Array.from(fileList).forEach(file => {
              uppy.addFile({
                name: file.name,
                type: file.type,
                data: file,
              });
            });
            e.target.value = '';
          }
        }}
      />
    </>
  );
}
