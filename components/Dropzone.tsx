import React, { useCallback } from 'react';
import { UploadCloud } from 'lucide-react';

interface DropzoneProps {
  onFileSelected: (file: File) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFileSelected }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        onFileSelected(file);
    }
  }, [onFileSelected]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
        onFileSelected(file);
    }
  }, [onFileSelected]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <label 
        htmlFor="file-upload" 
        className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-600 border-dashed rounded-xl cursor-pointer bg-slate-800/50 hover:bg-slate-700/50 transition-all group"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          <div className="mb-4 p-4 rounded-full bg-slate-700 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors text-slate-400">
            <UploadCloud size={40} />
          </div>
          <p className="mb-2 text-xl font-semibold text-slate-200">
            Click to upload or drag and drop
          </p>
          <p className="text-sm text-slate-400">
            Supports CBZ, CBR, JPG, PNG (Max 1GB)
          </p>
        </div>
        <input 
          id="file-upload" 
          type="file" 
          accept="image/*,.cbz,.cbr,.zip" 
          className="hidden" 
          onChange={handleFileChange}
        />
      </label>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="font-bold text-indigo-400 mb-1">1. Upload</div>
          <div className="text-xs text-slate-400">Comic pages or CBR/CBZ archives</div>
        </div>
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="font-bold text-indigo-400 mb-1">2. Smart Fit</div>
          <div className="text-xs text-slate-400">Text auto-scales to bubbles</div>
        </div>
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="font-bold text-indigo-400 mb-1">3. Fast AI</div>
          <div className="text-xs text-slate-400">Optimized for speed</div>
        </div>
      </div>
    </div>
  );
};
