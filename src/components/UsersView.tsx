import React, { useState, useEffect, useTransition } from "react";
import { Users, UserPlus, Mail, Lock, Shield, Eye, EyeOff, Loader2, Trash } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { getTeamMembersAction, createUserAction, deleteUserAction } from "@/app/actions";

interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin_geral' | 'aux_admin' | 'mecanico_chefe' | 'mecanico' | 'ajudante';
  createdAt: string;
}

interface UsersViewProps {
  currentUserId?: string;
}

export default function UsersView({ currentUserId }: UsersViewProps) {
  const [members, setMembers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<'admin_geral' | 'aux_admin' | 'mecanico_chefe' | 'mecanico' | 'ajudante'>("ajudante");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPasswordInfo, setGeneratedPasswordInfo] = useState<string | null>(null);

  // Validation states
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const loadTeamMembers = async () => {
    try {
      setIsLoading(true);
      const res = await getTeamMembersAction();
      if ("error" in res) {
        toast.error("Erro ao carregar equipe: " + res.error);
        return;
      }
      const formattedMembers = (res.members || []).map((m: any) => ({
        ...m,
        createdAt: typeof m.createdAt === "string" ? m.createdAt : m.createdAt?.toISOString() || new Date().toISOString()
      }));
      setMembers(formattedMembers);
    } catch (err) {
      console.error(err);
      toast.error("Erro inesperado ao carregar equipe.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setNameError("");
    setEmailError("");
    setPasswordError("");

    let hasValidationError = false;

    if (!name.trim()) {
      setNameError("Nome completo é obrigatório.");
      hasValidationError = true;
    }

    if (!email.trim()) {
      setEmailError("E-mail de acesso é obrigatório.");
      hasValidationError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("E-mail inválido.");
      hasValidationError = true;
    }

    if (!password) {
      setPasswordError("Senha provisória é obrigatória.");
      hasValidationError = true;
    } else if (password.length < 6) {
      setPasswordError("A senha deve conter no mínimo 6 caracteres.");
      hasValidationError = true;
    }

    if (hasValidationError) {
      toast.error("Por favor, corrija os erros no formulário.");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          name,
          email,
          role,
          password: password,
        };

        const res = await createUserAction(payload);

        if (res && res.error) {
          toast.error(res.error);
        } else {
          toast.success("Funcionário cadastrado com sucesso!");
          
          if (res.tempPassword) {
            setGeneratedPasswordInfo(`Usuário: ${email} | Senha gerada: ${res.tempPassword}`);
          } else {
            setGeneratedPasswordInfo(null);
          }

          // Reset form
          setName("");
          setEmail("");
          setRole("ajudante");
          setPassword("");
          setShowAddForm(false);
          
          // Reload
          loadTeamMembers();
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao cadastrar funcionário.");
      }
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUserId) {
      toast.error("Você não pode remover sua própria conta administrativa.");
      return;
    }

    if (!confirm("Tem certeza que deseja remover este integrante da equipe? Esta ação também removerá o acesso dele ao sistema e não pode ser desfeita.")) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteUserAction(userId);
        if (res && res.error) {
          toast.error(res.error);
        } else {
          toast.success("Funcionário removido da equipe com sucesso!");
          loadTeamMembers();
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao remover funcionário.");
      }
    });
  };

  const getRoleBadgeClass = (r: Profile["role"]) => {
    switch (r) {
      case "admin_geral":
        return "bg-zinc-900 text-zinc-100 border-zinc-950";
      case "aux_admin":
        return "bg-sky-50 text-sky-800 border-sky-200/50";
      case "mecanico_chefe":
        return "bg-violet-50 text-violet-800 border-violet-200/50";
      case "mecanico":
        return "bg-amber-50 text-amber-800 border-amber-200/50";
      case "ajudante":
      default:
        return "bg-zinc-100 text-zinc-650 border-zinc-200/50";
    }
  };

  const getRoleLabel = (r: Profile["role"]) => {
    switch (r) {
      case "admin_geral":
        return "Administrador Geral";
      case "aux_admin":
        return "Auxiliar Administrativo";
      case "mecanico_chefe":
        return "Mecânico Chefe";
      case "mecanico":
        return "Mecânico";
      case "ajudante":
      default:
        return "Ajudante Geral";
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-zinc-500" />
          Gerenciamento da Equipe
        </h2>
        {!showAddForm && (
          <button
            onClick={() => {
              setGeneratedPasswordInfo(null);
              setNameError("");
              setEmailError("");
              setPasswordError("");
              setShowAddForm(true);
            }}
            className="flex items-center justify-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs tracking-wide px-3.5 py-2 rounded-xl transition-all duration-150 shadow-sm shrink-0 self-start md:self-auto cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            CADASTRAR NOVO INTEGRANTE
          </button>
        )}
      </div>

      {generatedPasswordInfo && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs font-semibold text-emerald-800 space-y-2">
          <p className="font-bold flex items-center gap-1.5">
            <span>✓</span> Integrante criado! Copie as credenciais de acesso abaixo antes de fechar este aviso:
          </p>
          <div className="bg-white/80 border border-emerald-200 rounded-xl p-3 font-mono break-all select-all select-text">
            {generatedPasswordInfo}
          </div>
          <button
            onClick={() => setGeneratedPasswordInfo(null)}
            className="text-[10px] underline hover:text-emerald-950 cursor-pointer block"
          >
            Entendido, fechar aviso
          </button>
        </div>
      )}

      {showAddForm ? (
        <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm space-y-4 max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="h-4 w-4 text-zinc-500" />
              Novo Integrante da Equipe
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-[10px] font-bold text-zinc-400 hover:text-zinc-650 cursor-pointer"
            >
              CANCELAR
            </button>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4" noValidate>
            {/* Nome */}
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wide ${nameError ? "text-red-500" : "text-zinc-450"}`}>Nome Completo *</label>
              <input
                type="text"
                placeholder="Ex: João da Silva"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
                className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 placeholder-zinc-450 focus:outline-none ${
                  nameError 
                    ? "border-red-500 focus:border-red-500 bg-red-50/10" 
                    : "border-zinc-200 focus:border-zinc-500"
                }`}
                required
              />
              {nameError && <p className="text-[10px] text-red-500 mt-1">{nameError}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wide ${emailError ? "text-red-500" : "text-zinc-450"}`}>E-mail de Acesso *</label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${emailError ? "text-red-400" : "text-zinc-400"}`} />
                <input
                  type="email"
                  placeholder="Ex: joao@oficina.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  className={`w-full bg-white border rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-zinc-700 placeholder-zinc-450 focus:outline-none ${
                    emailError 
                      ? "border-red-500 focus:border-red-500 bg-red-50/10" 
                      : "border-zinc-200 focus:border-zinc-500"
                  }`}
                  required
                />
              </div>
              {emailError && <p className="text-[10px] text-red-500 mt-1">{emailError}</p>}
            </div>

            {/* Cargo / Nivel de acesso */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wide">Cargo / Nível de Acesso *</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-zinc-750 focus:outline-none focus:border-zinc-500 appearance-none cursor-pointer"
                  required
                >
                  <option value="admin_geral">Administrador Geral (Poder Completo)</option>
                  <option value="aux_admin">Auxiliar Administrativo (Controle Quase Completo)</option>
                  <option value="mecanico_chefe">Mecânico Chefe (Controle Quase Completo)</option>
                  <option value="mecanico">Mecânico (Edição parcial de O.S)</option>
                  <option value="ajudante">Ajudante Geral (Leitura/Controle Mínimo)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-450 text-[10px]">▼</div>
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wide ${passwordError ? "text-red-500" : "text-zinc-450"}`}>Senha Provisória *</label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${passwordError ? "text-red-400" : "text-zinc-400"}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 caracteres"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  className={`w-full bg-white border rounded-xl pl-9 pr-10 py-2 text-xs font-semibold text-zinc-700 placeholder-zinc-450 focus:outline-none ${
                    passwordError 
                      ? "border-red-500 focus:border-red-500 bg-red-50/10" 
                      : "border-zinc-200 focus:border-zinc-500"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-450 hover:text-zinc-650 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {passwordError && <p className="text-[10px] text-red-500 mt-1">{passwordError}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs tracking-wide py-3 rounded-xl transition-all duration-150 shadow-sm cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  CADASTRANDO...
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  CADASTRAR INTEGRANTE
                </>
              )}
            </button>
          </form>
        </div>
      ) : isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800" />
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Carregando membros da equipe...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-100 bg-zinc-50/80">
                <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Integrante</TableHead>
                <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">E-mail</TableHead>
                <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Cargo</TableHead>
                <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Cadastrado em</TableHead>
                <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap text-right pr-4">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-xs font-semibold text-zinc-400">
                    Nenhum integrante cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => {
                  const initials = member.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
                  const dateStr = member.createdAt ? new Date(member.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  }) : "-";
                  return (
                    <TableRow key={member.id} className="border-zinc-100 hover:bg-zinc-50/60 transition-colors">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-650 shrink-0">
                            {initials}
                          </div>
                          <span className="font-bold text-zinc-800 text-xs">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-600 text-xs font-medium">{member.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${getRoleBadgeClass(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                      </TableCell>
                      <TableCell className="text-zinc-450 text-xs font-semibold font-mono">{dateStr}</TableCell>
                      <TableCell className="text-right pr-4">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(member.id)}
                          disabled={isPending || member.id === currentUserId}
                          className="inline-flex items-center justify-center h-8 w-8 bg-zinc-50 hover:bg-red-50 text-zinc-400 hover:text-red-650 rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                          title={member.id === currentUserId ? "Não é possível excluir a si mesmo" : "Excluir integrante"}
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
