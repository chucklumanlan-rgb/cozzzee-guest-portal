import React, { useRef, useState } from 'react';
import { cn } from "../lib/utils";

export function UploadDropzone({ onFile }: { onFile: (file: File) => void }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFile(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer",
        isDragActive
          ? "border-blue-600 bg-pink-50"
          : "border-pink-300 bg-pink-50/40 hover:bg-pink-50/60"
      )}
    >
      <input 
        ref={inputRef}
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleChange}
      />
      <p className="text-blue-900 font-medium">
        {isDragActive
          ? "Drop passport photo here"
          : "Click or drag your passport photo to upload"}
      </p>
      <p className="text-xs text-slate-500 mt-2">JPG or PNG, max 5MB</p>
    </div>
  );
}