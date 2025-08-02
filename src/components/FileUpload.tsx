'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png']
};

export default function FileUpload({ onFileUpload, isLoading = false }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB';
    }
    
    if (!Object.keys(ALLOWED_TYPES).includes(file.type)) {
      return 'Only JPG and PNG files are allowed';
    }
    
    return null;
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setFileError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors.some((error: any) => error.code === 'file-too-large')) {
        setFileError('File size must be less than 10MB');
      } else if (rejection.errors.some((error: any) => error.code === 'file-invalid-type')) {
        setFileError('Only JPG and PNG files are allowed');
      } else {
        setFileError('Invalid file. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const validationError = validateFile(file);
      
      if (validationError) {
        setFileError(validationError);
        return;
      }
      
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    multiple: false,
    maxSize: MAX_FILE_SIZE,
    disabled: isLoading
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out hover-lift
          ${isDragActive || dragActive
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20 shadow-lg scale-105'
            : 'border-gray-300/50 dark:border-gray-600/50 hover:border-blue-400/50 dark:hover:border-blue-500/50 bg-white/80 dark:bg-gray-800/80'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed scale-100' : ''}
          ${fileError ? 'border-red-300 bg-red-50/80 dark:bg-red-900/20' : ''}
          backdrop-blur-sm
        `}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        role="button"
        tabIndex={0}
        aria-label="Upload timetable image"
        aria-describedby={fileError ? "file-error" : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isLoading) {
              const input = e.currentTarget.querySelector('input');
              input?.click();
            }
          }
        }}
      >
        <input {...getInputProps()} disabled={isLoading} aria-hidden="true" />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center shadow-lg">
            <svg
              className={`w-8 h-8 transition-all duration-300 ${
                isDragActive || dragActive 
                  ? 'text-blue-600 dark:text-blue-400 scale-110' 
                  : fileError
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          <div className="space-y-1">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {isLoading ? 'Processing timetable...' : fileError ? 'Upload failed' : 'Upload your timetable'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {fileError 
                ? fileError
                : isDragActive
                ? 'Drop your timetable image here'
                : 'Drag and drop your timetable screenshot, or click to browse'
              }
            </p>
          </div>
          
          {!isLoading && !fileError && (
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>JPG, PNG</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Max 10MB</span>
              </div>
            </div>
          )}

          {fileError && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300" id="file-error">
                {fileError}
              </p>
            </div>
          )}
        </div>
        
        {isLoading && (
          <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse-slow"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  Analyzing timetable...
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  This may take a few moments
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Decorative elements */}
        <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-blue-400 dark:bg-blue-500 rounded-full opacity-60"></div>
        <div className="absolute bottom-3 left-3 w-2 h-2 bg-purple-400 dark:bg-purple-500 rounded-full opacity-40"></div>
        <div className="absolute top-1/2 left-3 w-0.5 h-0.5 bg-emerald-400 dark:bg-emerald-500 rounded-full opacity-50"></div>
      </div>
    </div>
  );
} 