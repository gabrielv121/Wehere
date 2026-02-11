import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  /** Optional custom fallback; if not provided, default UI is used */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary to catch React errors in the tree and show a fallback UI
 * instead of a blank screen. See https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl font-bold">
              !
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-4">Something went wrong</h1>
            <p className="text-slate-600 mt-2">
              We’ve run into an error. Try refreshing the page or going back home.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-4 p-3 rounded-lg bg-slate-100 text-left text-xs text-slate-700 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-colors"
              >
                Try again
              </button>
              <Link
                to="/"
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Go home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
