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
    console.error('MDQSHOW Error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0e1117] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20 text-2xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold text-white">Hubo un pequeño inconveniente</h2>
            <p className="text-xs text-slate-400">
              Ocurrió un error al cargar la vista. Podés recargar la cartelera para continuar.
            </p>
            {this.state.error && (
              <div className="text-left bg-slate-950 p-3 rounded-xl border border-rose-900/50 text-[11px] text-rose-300 font-mono overflow-auto max-h-36">
                <p className="font-bold">{this.state.error.name}: {this.state.error.message}</p>
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Recargar cartelera
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
