"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { loginAction } from "@/app/actions";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await loginAction({ email, password });
        if (res && res.error) {
          toast.error(res.error === "Invalid login credentials" ? "E-mail ou senha inválidos." : res.error);
        } else {
          toast.success("Login realizado com sucesso!");
          router.replace("/ordens-servico");
          router.refresh();
        }
      } catch (err) {
        console.error("Login failed:", err);
        toast.error("Ocorreu um erro ao realizar o login.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      {/* Visual background accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-zinc-900/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-zinc-900/40 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[420px] z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <img
            src="/logo.png"
            alt="Agus Moto Conceito"
            className="h-16 w-auto object-contain mb-4 filter invert brightness-0"
            onError={(e) => {
              // Fallback to text if image fails to load
              e.currentTarget.style.display = "none";
            }}
          />
          <h1 className="text-xl font-bold tracking-tight text-white mt-2">
            Agus Moto Conceito
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Painel Administrativo da Oficina
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900/40 border border-zinc-900/80 backdrop-blur-md rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <h2 className="text-lg font-bold text-white mb-6">Acesse sua conta</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-zinc-400">
                E-mail
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@provedor.com"
                  disabled={isPending}
                  className="w-full bg-zinc-900/70 border border-zinc-800 text-white rounded-2xl pl-10 pr-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-zinc-400">
                Senha
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isPending}
                  className="w-full bg-zinc-900/70 border border-zinc-800 text-white rounded-2xl pl-10 pr-10 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 transition-all disabled:opacity-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-zinc-50 hover:bg-zinc-150 text-zinc-950 font-bold py-3.5 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-6 text-sm active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
            >
              {isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Entrar no Sistema</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-zinc-600 text-center mt-8">
          Sistema Seguro • Agus Moto Conceito © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
