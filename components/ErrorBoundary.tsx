import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-stone-800 rounded-lg shadow-xl p-6 border border-red-100 dark:border-red-900/30">
            <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-8 h-8" />
              <h2 className="text-xl font-bold uppercase tracking-wide">Algo salió mal</h2>
            </div>
            
            <p className="text-stone-600 dark:text-stone-300 mb-4 text-sm">
              Ha ocurrido un error inesperado al cargar este componente.
            </p>

            {this.state.error && (
              <div className="bg-stone-100 dark:bg-stone-950 p-3 rounded text-xs font-mono text-stone-600 dark:text-stone-400 overflow-x-auto mb-6 border border-stone-200 dark:border-stone-800">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
