import { Button } from '@/components/ui/button';
import Uppy from '@uppy/core';
import { Plus } from 'lucide-react';
import { useRef } from 'react';

export default function UploadButton({ uppy }: { uppy: Uppy }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button onClick={() => inputRef.current?.click()}>
        <Plus />
        <span>上传</span>
      </Button>
      <input
        type="file"
        multiple
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
