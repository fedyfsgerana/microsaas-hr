export default function LoadingSpinner({ size = 'md', center = false }) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    if (center) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizes[size]}`} />
            </div>
        );
    }

    return (
        <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizes[size]}`} />
    );
}