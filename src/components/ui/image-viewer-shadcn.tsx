// src/components/ui/image-viewer-shadcn.tsx
// Pure shadcn/ui image viewer using Dialog, Carousel, and other built-in components

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Camera,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  X,
  FileImage,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageData {
  src?: string;
  title: string;
  description?: string;
  alt?: string;
}

interface ImageViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: ImageData[];
  initialIndex?: number;
  showDownload?: boolean;
  showZoomControls?: boolean;
  className?: string;
}

// Single Image Viewer using Dialog
export function ImageViewer({
  open,
  onOpenChange,
  images = [],
  initialIndex = 0,
  showDownload = true,
  showZoomControls = true,
  className,
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  // Reset states when dialog opens/closes or index changes
  useEffect(() => {
    if (open) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
      setZoom(1);
      setRotation(0);
      setIsLoading(true);
      setHasError(false);
    }
  }, [open, initialIndex, images.length]);

  // Sync carousel with current index
  useEffect(() => {
    if (carouselApi && currentIndex >= 0) {
      carouselApi.scrollTo(currentIndex);
    }
  }, [carouselApi, currentIndex]);

  // Listen to carousel changes
  useEffect(() => {
    if (!carouselApi) return;

    carouselApi.on("select", () => {
      setCurrentIndex(carouselApi.selectedScrollSnap());
      setZoom(1);
      setRotation(0);
      setIsLoading(true);
      setHasError(false);
    });
  }, [carouselApi]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          if (hasMultipleImages && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (hasMultipleImages && currentIndex < images.length - 1) {
            setCurrentIndex(currentIndex + 1);
          }
          break;
        case "Escape":
          e.preventDefault();
          onOpenChange(false);
          break;
        case "+":
        case "=":
          e.preventDefault();
          setZoom(Math.min(3, zoom + 0.2));
          break;
        case "-":
          e.preventDefault();
          setZoom(Math.max(0.2, zoom - 0.2));
          break;
        case "r":
          e.preventDefault();
          setRotation((prev) => prev + 90);
          break;
        case "0":
          e.preventDefault();
          setZoom(1);
          setRotation(0);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    open,
    currentIndex,
    images.length,
    hasMultipleImages,
    zoom,
    onOpenChange,
  ]);

  const handleDownload = async () => {
    if (!currentImage?.src) return;

    try {
      const response = await fetch(currentImage.src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${currentImage.title || "image"}.jpg`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const resetTransform = () => {
    setZoom(1);
    setRotation(0);
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("max-w-[95vw] h-[90vh] p-0 overflow-hidden", className)}>
        {/* Header */}
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="truncate">
                {currentImage?.title || "รูปภาพ"}
              </DialogTitle>
              {currentImage?.description && (
                <DialogDescription className="truncate">
                  {currentImage.description}
                </DialogDescription>
              )}
            </div>

            {hasMultipleImages && (
              <Badge variant="secondary" className="ml-2 shrink-0">
                {currentIndex + 1} / {images.length}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Main Image Area */}
        <div className="flex-1 relative bg-muted/30 overflow-hidden">
          {hasMultipleImages ? (
            <Carousel
              setApi={setCarouselApi}
              className="w-full h-full"
              opts={{
                startIndex: initialIndex,
                loop: true,
              }}>
              <CarouselContent className="h-full">
                {images.map((image, index) => (
                  <CarouselItem key={index} className="h-full">
                    <ImageDisplay
                      image={image}
                      zoom={index === currentIndex ? zoom : 1}
                      rotation={index === currentIndex ? rotation : 0}
                      isLoading={index === currentIndex ? isLoading : false}
                      hasError={index === currentIndex ? hasError : false}
                      onLoad={() => {
                        if (index === currentIndex) {
                          setIsLoading(false);
                          setHasError(false);
                        }
                      }}
                      onError={() => {
                        if (index === currentIndex) {
                          setIsLoading(false);
                          setHasError(true);
                        }
                      }}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Navigation Arrows */}
              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
            </Carousel>
          ) : (
            <ImageDisplay
              image={currentImage}
              zoom={zoom}
              rotation={rotation}
              isLoading={isLoading}
              hasError={hasError}
              onLoad={() => {
                setIsLoading(false);
                setHasError(false);
              }}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          )}

          {/* Zoom Controls Overlay */}
          {showZoomControls && !isLoading && !hasError && currentImage?.src && (
            <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/70 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.max(0.2, zoom - 0.2))}
                className="h-8 w-8 p-0 text-white hover:bg-white/20">
                <ZoomOut className="h-4 w-4" />
              </Button>

              <span className="text-white text-xs px-2 min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.min(3, zoom + 0.2))}
                className="h-8 w-8 p-0 text-white hover:bg-white/20">
                <ZoomIn className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-white/30 mx-1" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRotation(rotation + 90)}
                className="h-8 w-8 p-0 text-white hover:bg-white/20">
                <RotateCw className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={resetTransform}
                className="h-8 w-8 p-0 text-white hover:bg-white/20">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pt-2 border-t flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {hasMultipleImages && (
              <span>ใช้ลูกศรซ้าย/ขวา หรือ swipe เพื่อเปลี่ยนรูป</span>
            )}
            {showZoomControls && (
              <span className={cn(hasMultipleImages && "ml-4")}>
                +/- เพื่อซูม, R เพื่อหมุน, 0 เพื่อรีเซ็ต
              </span>
            )}
          </div>

          {showDownload && currentImage?.src && !hasError && (
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              ดาวน์โหลด
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Image Display Component
interface ImageDisplayProps {
  image: ImageData;
  zoom: number;
  rotation: number;
  isLoading: boolean;
  hasError: boolean;
  onLoad: () => void;
  onError: () => void;
}

function ImageDisplay({
  image,
  zoom,
  rotation,
  isLoading,
  hasError,
  onLoad,
  onError,
}: ImageDisplayProps) {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {hasError ? (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <AlertTriangle className="h-12 w-12" />
          <p className="text-sm">ไม่สามารถโหลดรูปภาพได้</p>
        </div>
      ) : image.src ? (
        <img
          src={image.src}
          alt={image.alt || image.title}
          onLoad={onLoad}
          onError={onError}
          className="max-w-full max-h-full object-contain transition-transform duration-200 cursor-move"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            display: isLoading ? "none" : "block",
          }}
          draggable={false}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <FileImage className="h-12 w-12" />
          <p className="text-sm">ไม่มีรูปภาพ</p>
        </div>
      )}
    </div>
  );
}

// Simple Image Lightbox for single image
interface ImageLightboxProps {
  src?: string;
  alt?: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
  showDownload?: boolean;
}

export function ImageLightbox({
  src,
  alt,
  title = "รูปภาพ",
  description,
  children,
  showDownload = true,
}: ImageLightboxProps) {
  const [open, setOpen] = useState(false);

  if (!src) {
    return <>{children}</>;
  }

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </div>

      <ImageViewer
        open={open}
        onOpenChange={setOpen}
        images={[{ src, title, description, alt }]}
        showDownload={showDownload}
      />
    </>
  );
}

// Gallery Grid Component
interface ImageGalleryProps {
  images: ImageData[];
  columns?: number;
  aspectRatio?: number;
  className?: string;
  onImageClick?: (index: number) => void;
}

export function ImageGallery({
  images,
  columns = 3,
  aspectRatio = 1,
  className,
  onImageClick,
}: ImageGalleryProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleImageClick = (index: number) => {
    setSelectedIndex(index);
    setViewerOpen(true);
    onImageClick?.(index);
  };

  return (
    <>
      <div
        className={cn(
          "grid gap-4",
          {
            "grid-cols-1": columns === 1,
            "grid-cols-2": columns === 2,
            "grid-cols-3": columns === 3,
            "grid-cols-4": columns === 4,
            "grid-cols-2 md:grid-cols-3": columns === 3,
            "grid-cols-2 md:grid-cols-4": columns === 4,
          },
          className
        )}>
        {images.map((image, index) => (
          <Card
            key={index}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleImageClick(index)}>
            <CardContent className="p-0">
              <AspectRatio ratio={aspectRatio}>
                {image.src ? (
                  <img
                    src={image.src}
                    alt={image.alt || image.title}
                    className="object-cover w-full h-full transition-transform hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <FileImage className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </AspectRatio>

              {(image.title || image.description) && (
                <div className="p-3">
                  {image.title && (
                    <h4 className="font-medium text-sm truncate">
                      {image.title}
                    </h4>
                  )}
                  {image.description && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {image.description}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <ImageViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        images={images}
        initialIndex={selectedIndex}
      />
    </>
  );
}

// Hook for easier usage
export function useImageViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<ImageData[]>([]);
  const [initialIndex, setInitialIndex] = useState(0);

  const showImage = (src: string, title?: string, description?: string) => {
    setImages([{ src, title: title || "รูปภาพ", description }]);
    setInitialIndex(0);
    setIsOpen(true);
  };

  const showImages = (imageList: ImageData[], startIndex = 0) => {
    setImages(imageList);
    setInitialIndex(startIndex);
    setIsOpen(true);
  };

  const closeViewer = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    showImage,
    showImages,
    closeViewer,
    ImageViewer: (
      <ImageViewer
        open={isOpen}
        onOpenChange={setIsOpen}
        images={images}
        initialIndex={initialIndex}
      />
    ),
  };
}

export default ImageViewer;
