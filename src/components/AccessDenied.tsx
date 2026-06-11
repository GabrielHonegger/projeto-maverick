import React from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AccessDeniedProps {
  onBackToSafety?: () => void;
}

export default function AccessDenied({ onBackToSafety }: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 border border-red-100/50 mb-6 animate-pulse">
        <ShieldAlert className="h-8 w-8 text-red-650" />
      </div>
      
      <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-850 tracking-tight mb-2">
        Acesso Negado
      </h1>
      
      <p className="text-sm text-zinc-500 max-w-md mb-8 leading-relaxed">
        Você não possui permissão para visualizar esta página. Caso ache que isso seja um erro, entre em contato com o Administrador Geral.
      </p>

      {onBackToSafety ? (
        <button
          onClick={onBackToSafety}
          className="flex items-center gap-2 px-4.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para área segura
        </button>
      ) : (
        <Link
          href="/"
          className="flex items-center gap-2 px-4.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o início
        </Link>
      )}
    </div>
  );
}
