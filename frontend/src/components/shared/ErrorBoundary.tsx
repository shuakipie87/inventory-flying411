import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mb-5">
              <AlertTriangle className="text-red-500" size={28} strokeWidth={1.5} />
            </div>
            <h1 className="text-lg font-semibold text-slate-800 mb-2 font-sans">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              An unexpected error occurred. Please try reloading the page.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-xs text-left text-red-600 bg-red-50 border border-red-100 rounded-lg p-4 mb-6 overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors"
              data-testid="error-boundary-retry"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
