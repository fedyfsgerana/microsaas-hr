import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
                    <div className="flex items-center justify-center w-16 h-16 mb-4 bg-red-100 rounded-full">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-gray-900">Terjadi Kesalahan</h2>
                    <p className="max-w-sm mb-6 text-sm text-gray-500">
                        Halaman ini mengalami error. Coba refresh atau kembali ke halaman sebelumnya.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary"
                        >
                            Refresh Halaman
                        </button>
                        <button
                            onClick={() => { this.setState({ hasError: false }); window.history.back(); }}
                            className="btn-secondary"
                        >
                            Kembali
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}