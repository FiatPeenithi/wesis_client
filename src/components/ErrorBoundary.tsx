import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-neutral-800 p-8 rounded-2xl border border-neutral-700 shadow-xl max-w-sm w-full flex flex-col items-center gap-6">
            <div className="bg-red-500/10 p-5 rounded-full">
              <svg className="w-16 h-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-neutral-100">เกิดข้อผิดพลาด</h1>
              <p className="text-neutral-400 text-sm leading-relaxed">
                แอปพลิเคชันเกิดปัญหาที่ไม่คาดคิด<br />
                กรุณาลองใหม่อีกครั้ง
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 transition-colors text-neutral-300 font-medium py-3 px-4 rounded-xl"
              >
                ลองใหม่
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 transition-colors text-neutral-950 font-bold py-3 px-4 rounded-xl"
              >
                รีเฟรช
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
