
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageAlt: string;
}

export default function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  imageAlt,
}: ImagePreviewModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border-0 max-w-4xl w-full bg-transparent shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Vista Previa de Imagen</DialogTitle>
          <DialogDescription>
            Imagen ampliada del producto: {imageAlt}.
          </DialogDescription>
        </DialogHeader>
        <div className="relative w-full h-full">
            <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute -top-12 right-0 z-50 text-white hover:text-white/80"
            >
                <X className="h-8 w-8" />
                <span className="sr-only">Cerrar vista previa</span>
            </Button>
            <div className="relative aspect-square w-full h-auto">
                <Image
                    src={imageUrl}
                    alt={imageAlt}
                    fill
                    className="object-contain"
                />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
