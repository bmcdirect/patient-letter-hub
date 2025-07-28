import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (files: FileList) => void;
  accept: string;
  maxSize: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  className?: string;
  large?: boolean;
}

export function FileUpload({
  onUpload,
  accept,
  maxSize,
  icon,
  title,
  subtitle,
  className,
  large = false
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleFileSelect = (files: FileList) => {
    const file = files[0];
    if (file && file.size <= maxSize) {
      onUpload(files);
    } else if (file.size > maxSize) {
      alert(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg text-center hover:border-primary-400 transition-colors",
        isDragOver ? "border-primary-400 bg-primary-50" : "border-gray-300",
        large ? "p-8" : "p-6",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mb-4">
        {icon}
      </div>
      <p className={`text-gray-600 mb-2 ${large ? 'text-lg' : 'text-sm'}`}>
        {title}
      </p>
      <Button
        type="button"
        variant="link"
        onClick={handleBrowseClick}
        className="text-primary-600 hover:text-primary-700 font-medium p-0 h-auto"
      >
        browse files
      </Button>
      <p className={`text-gray-500 mt-2 ${large ? 'text-sm' : 'text-xs'}`}>
        {subtitle}
      </p>
      
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => {
          if (e.target.files) {
            handleFileSelect(e.target.files);
          }
        }}
      />
    </div>
  );
}
