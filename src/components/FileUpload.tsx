'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

export default function FileUpload({ onFileUpload, isLoading = false }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300 ease-in-out hover-lift
          ${isDragActive || dragActive
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20 shadow-lg scale-105'
            : 'border-gray-300/50 dark:border-gray-600/50 hover:border-blue-400/50 dark:hover:border-blue-500/50 bg-white/80 dark:bg-gray-800/80'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed scale-100' : ''}
          backdrop-blur-sm
        `}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
      >
        <input {...getInputProps()} disabled={isLoading} />
        
        <div className="space-y-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center shadow-lg">
            <svg
              className={`w-10 h-10 transition-all duration-300 ${
                isDragActive || dragActive 
                  ? 'text-blue-600 dark:text-blue-400 scale-110' 
                  : 'text-gray-400 dark:text-gray-500'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          <div className="space-y-2">
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {isLoading ? 'Processing timetable...' : 'Upload your timetable'}
            </p>
            <p className="text-base text-gray-600 dark:text-gray-400">
              {isDragActive
                ? 'Drop your timetable image here'
                : 'Drag and drop your timetable screenshot, or click to browse'
              }
            </p>
          </div>
          
          {!isLoading && (
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>JPG, PNG, GIF, WebP</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Max 10MB</span>
              </div>
            </div>
          )}
        </div>
        
        {isLoading && (
          <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse-slow"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Analyzing timetable...
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This may take a few moments
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full opacity-60"></div>
        <div className="absolute bottom-4 left-4 w-3 h-3 bg-purple-400 dark:bg-purple-500 rounded-full opacity-40"></div>
        <div className="absolute top-1/2 left-4 w-1 h-1 bg-emerald-400 dark:bg-emerald-500 rounded-full opacity-50"></div>
      </div>
    </div>
  );
} 