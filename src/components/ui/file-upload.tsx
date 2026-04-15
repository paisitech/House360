"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";

interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSize?: number;
  error?: string;
  onChange: (file: File | null) => void;
  className?: string;
}

export function FileUpload({
  label,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024,
  error,
  onChange,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (file && file.size > maxSize) {
      onChange(null);
      setPreview(null);
      setFileName(null);
      return;
    }
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
      setFileName(null);
    }
    onChange(file);
  }

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 cursor-pointer hover:border-blue-400 transition-colors",
          error && "border-red-500"
        )}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="max-h-40 rounded-lg object-contain"
          />
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click to upload</p>
            <p className="text-xs text-gray-400 mt-1">
              Max {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </>
        )}
        {fileName && (
          <p className="text-xs text-gray-500 mt-2">{fileName}</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
