import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className={`relative w-full ${sizes[size]} max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-scale-in border border-gray-200 dark:border-gray-800`}>
                <div className="flex items-center justify-between flex-shrink-0 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="btn-ghost p-1.5 rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex-1 px-6 py-4 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}