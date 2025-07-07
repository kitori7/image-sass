import { Uppy } from '@uppy/core';
import { ReactNode, useRef, useState } from 'react';

interface DropzoneProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  uppy: Uppy;
  children: ReactNode | ((dragging: boolean) => ReactNode);
}

export default function Dropzone({ uppy, children, className, ...rest }: DropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  return (
    <div
      className={className}
      {...rest}
      onDragEnter={e => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={e => {
        e.preventDefault();
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        timerRef.current = setTimeout(() => {
          setDragging(false);
        }, 100);
      }}
      onDragOver={e => {
        e.preventDefault();
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }}
      onDrop={e => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        Array.from(files).forEach(file => {
          uppy.addFile({
            name: file.name,
            type: file.type,
            data: file,
          });
        });
        setDragging(false);
      }}
    >
      {typeof children === 'function' ? children(dragging) : children}
    </div>
  );
}
