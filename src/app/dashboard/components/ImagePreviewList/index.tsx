import { RemoteFileItem } from '@/components/feature/FileItem';
import type { FileItemProps } from '@/components/feature/FileItem';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ImagePreviewItem extends FileItemProps {
  id: string;
}

interface ImagePreviewListProps {
  images: ImagePreviewItem[];
  children?: React.ReactNode;
}

export default function ImagePreviewList({ images, children }: ImagePreviewListProps) {
  return (
    <ScrollArea className="h-full">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {images.map(item => (
          <RemoteFileItem
            key={item.id}
            url={item.url}
            name={item.name}
            createdAt={item.createdAt}
            uploading={item.uploading}
          />
        ))}
      </div>
      {children}
    </ScrollArea>
  );
}
