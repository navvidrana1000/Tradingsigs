import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Terminal ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-zinc-200 p-8">
          <div className="text-red-400 text-xl font-semibold mb-2">Something went wrong</div>
          <div className="text-sm text-zinc-400 max-w-md text-center mb-4">
            {this.state.error?.message || "An unexpected error occurred in the terminal."}
          </div>
          <button
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
            onClick={() => window.location.reload()}
          >
            Reload Terminal
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
