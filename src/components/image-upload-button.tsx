"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ImageUploadButtonProps {
  onImageUpload: (imageUrl: string) => void;
  disabled?: boolean;
  currentImage?: string | null;
  onImageRemove?: () => void;
}

export function ImageUploadButton({
  onImageUpload,
  disabled,
  currentImage,
  onImageRemove,
}: ImageUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onImageUpload(base64);
        toast.success('Image uploaded');
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error('Failed to read image');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload image');
      setIsUploading(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {currentImage ? (
        <div className="relative inline-block">
          <div className="relative w-full max-w-md border rounded-md overflow-hidden">
            <Image
              src={currentImage}
              alt="Uploaded image"
              width={400}
              height={300}
              className="w-full h-auto"
            />
          </div>
          {onImageRemove && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onImageRemove}
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="gap-1"
          >
            <ImageIcon className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Add Image'}
          </Button>
        </>
      )}
    </div>
  );
}
