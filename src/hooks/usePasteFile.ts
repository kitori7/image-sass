import { useEffect } from 'react';

export default function usePasteFile({ onFilesPaste }: { onFilesPaste: (files: File[]) => void }) {
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      const fileList: File[] = [];
      if (items) {
        const files = Array.from(items).filter(item => item.type.startsWith('image/'));
        files.forEach(file => {
          const fileData = file.getAsFile();
          if (fileData) {
            fileList.push(fileData);
          }
        });
        if (fileList.length > 0) {
          onFilesPaste(fileList);
        }
      }
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [onFilesPaste]);
}
