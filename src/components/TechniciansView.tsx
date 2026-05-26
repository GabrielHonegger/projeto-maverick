import React, { useState } from "react";
import { Search, Plus, User, Phone, Mail, Edit2, Trash2, Shield, UserCheck, UserX } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Technician } from "@/types";

const PREDEFINED_ROLES = [
  "Mecânico Chefe",
  "Mecânico",
  "Especialista",
  "Auxiliar",
  "Administrador",
  "Gerente"
];

interface TechniciansViewProps {
  technicians: Technician[];
  onSaveTechnician: (tech: Omit<Technician, "id" | "createdAt"> & { id?: string }) => Promise<void>;
  onDeleteTechnician: (id: string) => Promise<void>;
}

export default function TechniciansView({
  technicians,
  onSaveTechnician,
  onDeleteTechnician,
}: TechniciansViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [techToDelete, setTechToDelete] = useState<string | null>(null);

  // Dynamic role list for filtering
  const dynamicRoles = ["Todos", ...new Set(technicians.map((t) => t.role))];

  const getSelectableRoles = () => {
    const roles = [...PREDEFINED_ROLES];
    if (role && !roles.includes(role)) {
      roles.push(role);
    }
    return roles;
  };

  // Filtering logic
  const filteredTechs = technicians.filter((tech) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      tech.name.toLowerCase().includes(query) ||
      tech.role.toLowerCase().includes(query) ||
      (tech.phone && tech.phone.includes(query)) ||
      (tech.email && tech.email.toLowerCase().includes(query));

    const matchesRole = selectedRoleFilter === "Todos" || tech.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  const handleOpenAddModal = () => {
    setSelectedTech(null);
    setName("");
    setRole("");
    setPhone("");
    setEmail("");
    setActive(true);
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tech: Technician) => {
    setSelectedTech(tech);
    setName(tech.name);
    setRole(tech.role);
    setPhone(tech.phone || "");
    setEmail(tech.email || "");
    setActive(tech.active);
    setError("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("O nome é obrigatório.");
      return;
    }
    if (!role.trim()) {
      setError("A função/especialidade é obrigatória.");
      return;
    }

    try {
      const payload: Omit<Technician, "id" | "createdAt"> & { id?: string } = {
        name: name.trim(),
        role: role.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        active,
      };

      if (selectedTech) {
        payload.id = selectedTech.id;
      }

      await onSaveTechnician(payload);
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.message || "Ocorreu um erro ao salvar o técnico.");
    }
  };

  const handleToggleActive = async (tech: Technician) => {
    try {
      await onSaveTechnician({
        id: tech.id,
        name: tech.name,
        role: tech.role,
        phone: tech.phone || undefined,
        email: tech.email || undefined,
        active: !tech.active,
      });
    } catch (err) {
      console.error("Failed to toggle active status:", err);
    }
  };

  const handleOpenDeleteConfirm = (id: string) => {
    setTechToDelete(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (techToDelete) {
      try {
        await onDeleteTechnician(techToDelete);
        setIsDeleteOpen(false);
        setTechToDelete(null);
      } catch (err) {
        console.error("Failed to delete technician:", err);
      }
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <Shield className="h-4.5 w-4.5 text-zinc-500" />
          Gerenciar Técnicos (Mecânicos)
        </h2>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs tracking-wide px-3.5 py-2 rounded-xl transition-all duration-150 shadow-sm cursor-pointer self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          CADASTRAR NOVO TÉCNICO
        </button>
      </div>

      {/* Filter and Search Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nome, especialidade, contato..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-1.5 text-xs font-semibold text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
          />
        </div>

        {/* Quick role filters */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">Especialidade:</span>
          {dynamicRoles.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRoleFilter(r)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedRoleFilter === r
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-white border border-zinc-250 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      {filteredTechs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 py-16 text-center shadow-sm">
          <User className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-700">Nenhum técnico encontrado</h3>
          <p className="text-xs text-zinc-400 mt-1">Ajuste seus filtros ou adicione um novo técnico.</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-100 bg-zinc-50/80">
                <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Técnico</TableHead>
                <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Especialidade / Função</TableHead>
                <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Contato</TableHead>
                <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Status</TableHead>
                <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap text-right w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTechs.map((tech) => (
                <TableRow
                  key={tech.id}
                  className="border-zinc-100 hover:bg-zinc-50/60 transition-colors"
                >
                  {/* Name with initials bubble */}
                  <TableCell className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                        tech.active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400"
                      }`}>
                        {tech.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                      </div>
                      <div>
                        <p className={`font-bold text-xs ${tech.active ? "text-zinc-850" : "text-zinc-400 line-through"}`}>
                          {tech.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Specialty / Role */}
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${
                      tech.active 
                        ? "bg-zinc-100 text-zinc-700 border-zinc-200" 
                        : "bg-zinc-50 text-zinc-400 border-zinc-100"
                    }`}>
                      {tech.role}
                    </span>
                  </TableCell>

                  {/* Contact */}
                  <TableCell>
                    <div className="space-y-0.5">
                      {tech.phone && (
                        <div className={`flex items-center gap-1 text-[11px] font-medium ${tech.active ? "text-zinc-650" : "text-zinc-400"}`}>
                          <Phone className="h-3 w-3 text-zinc-350" />
                          {tech.phone}
                        </div>
                      )}
                      {tech.email && (
                        <div className={`flex items-center gap-1 text-[11px] font-medium ${tech.active ? "text-zinc-650" : "text-zinc-400"}`}>
                          <Mail className="h-3 w-3 text-zinc-350" />
                          {tech.email}
                        </div>
                      )}
                      {!tech.phone && !tech.email && (
                        <span className="text-zinc-400 text-xs italic">Não informado</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Status Toggle Switch / Badge */}
                  <TableCell>
                    <button
                      onClick={() => handleToggleActive(tech)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-bold tracking-wide uppercase transition-all duration-200 shadow-sm cursor-pointer ${
                        tech.active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                          : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                      }`}
                    >
                      {tech.active ? (
                        <>
                          <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <UserX className="h-3.5 w-3.5 text-red-400" />
                          Inativo
                        </>
                      )}
                    </button>
                  </TableCell>

                  {/* Action buttons */}
                  <TableCell className="text-right pr-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEditModal(tech)}
                        className="h-8 w-8 inline-flex items-center justify-center bg-zinc-50 hover:bg-zinc-150 text-zinc-600 rounded-lg transition-colors cursor-pointer"
                        title="Editar técnico"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteConfirm(tech.id)}
                        className="h-8 w-8 inline-flex items-center justify-center bg-zinc-50 hover:bg-red-50 text-zinc-400 hover:text-red-650 rounded-lg transition-colors cursor-pointer"
                        title="Excluir técnico"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal: Add/Edit Technician */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white border-zinc-100 rounded-2xl max-w-md shadow-xl mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900">
              {selectedTech ? "Editar Técnico" : "Cadastrar Novo Técnico"}
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              {selectedTech ? "Atualize as informações cadastrais do técnico." : "Insira os dados do novo técnico/mecânico."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-xs font-semibold text-red-600 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="tech-name" className="text-xs font-semibold text-zinc-700">Nome do Técnico</Label>
                <Input
                  id="tech-name"
                  placeholder="Ex: Carlos Roberto"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm"
                />
              </div>

              {/* Specialty / Role */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-700">Função / Especialidade</Label>
                <Select onValueChange={(val) => setRole(val ?? "")} value={role}>
                  <SelectTrigger className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm focus:outline-none">
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-zinc-100 rounded-xl shadow-lg">
                    {getSelectableRoles().map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tech-phone" className="text-xs font-semibold text-zinc-700">Celular / Contato</Label>
                  <Input
                    id="tech-phone"
                    placeholder="Ex: (11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tech-email" className="text-xs font-semibold text-zinc-700">E-mail</Label>
                  <Input
                    id="tech-email"
                    type="email"
                    placeholder="Ex: carlos@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm"
                  />
                </div>
              </div>

              {/* Status Toggle in Form */}
              <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-150 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-700">Status Ativo</span>
                  <span className="text-[10px] text-zinc-400">Determina se o técnico aparece na lista de novas O.S.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                    active ? "bg-zinc-950" : "bg-zinc-250"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2 flex-row gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 sm:flex-none px-4 py-2.5 border border-zinc-200 bg-white text-zinc-700 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                {selectedTech ? "Salvar Alterações" : "Cadastrar Técnico"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirm Delete */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-white border-zinc-100 rounded-2xl max-w-sm shadow-xl mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-zinc-900">Excluir Técnico</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              Tem certeza que deseja excluir este técnico do sistema? Esta ação é definitiva.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 flex-row gap-2">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="flex-1 px-4 py-2 border border-zinc-200 bg-white text-zinc-700 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Excluir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
