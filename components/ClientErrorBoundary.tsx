"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

/**
 * Captura errores en componentes hijo y muestra el mensaje en pantalla
 * en lugar del mensaje genérico "Application error".
 */
export class ClientErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ClientErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen bg-zinc-900 text-white p-6 flex flex-col items-center justify-center">
          <h1 className="text-xl font-semibold text-red-400 mb-2">Error en la aplicación</h1>
          <pre className="bg-black/40 p-4 rounded-lg text-sm overflow-auto max-w-2xl whitespace-pre-wrap break-words">
            {this.state.error.message}
          </pre>
          <p className="text-white/60 text-sm mt-4">
            Revisá la consola del navegador (F12) para más detalles.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-6 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
