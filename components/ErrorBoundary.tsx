import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React Error Boundary:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4 font-vazir text-right" dir="rtl">
          <div className="bg-white dark:bg-slate-800 max-w-lg w-full p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              ⚠️
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              خطایی در بارگذاری سامانه رخ داده است
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
              متأسفانه مرورگر شما هنگام اجرای برنامه با یک خطا مواجه شد. می‌توانید صفحه را بازنشانی کنید یا حافظه موقت را پاک کنید.
            </p>
            {this.state.error && (
              <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-400 mb-6 text-left overflow-x-auto max-h-32 dir-ltr">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition-colors shadow-md text-sm"
              >
                تلاش مجدد (بارگذاری مجدد)
              </button>
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors text-sm"
              >
                پاکسازی حافظه و ورود مجدد
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
