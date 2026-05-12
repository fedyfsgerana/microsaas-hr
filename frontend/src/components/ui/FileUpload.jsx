import { useRef, useState } from 'react';

export default function FileUpload({ onFile, accept = '*', maxMB = 5, label = 'Upload File' }) {
    const inputRef = useRef();
    const [dragging, setDragging] = useState(false);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');

    const handleFile = (file) => {
        if (!file) return;
        if (file.size > maxMB * 1024 * 1024) {
            setError(`Ukuran file maksimal ${maxMB}MB`);
            return;
        }
        setError('');
        setFileName(file.name);
        onFile(file);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
    };

    return (
        <div>
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
          ${dragging
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files[0])}
                />
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {fileName ? (
                    <p className="text-sm font-medium text-primary-600">{fileName}</p>
                ) : (
                    <>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
                        <p className="mt-1 text-xs text-gray-400">Drag & drop atau klik untuk pilih file (maks {maxMB}MB)</p>
                    </>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}