import FileItem from '@/components/feature/FileItem';
import type { FileItemProps } from '@/components/feature/FileItem';

export interface ImagePreviewItem extends FileItemProps {
  id: string;
}

interface ImagePreviewListProps {
  images: ImagePreviewItem[];
}

export default function ImagePreviewList({ images }: ImagePreviewListProps) {
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
      {images.map(item => (
        <FileItem
          key={item.id}
          url={item.url}
          name={item.name}
          createdAt={item.createdAt}
          uploading={item.uploading}
        />
      ))}
    </div>
  );
}
