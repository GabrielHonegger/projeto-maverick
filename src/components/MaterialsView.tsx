import React, { useState } from "react";
import { Search, ClipboardList, Plus, Edit2, Trash2, Phone, Building2, User, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Material } from "@/types";

interface MaterialsViewProps {
  materials: Material[];
  currentUser: any;
  onSaveMaterial: (material: Omit<Material, "id" | "createdAt" | "updatedAt"> & { id?: string }) => Promise<any>;
  onDeleteMaterial: (id: string) => Promise<any>;
}

type CategoryKey = 'insumo_servico' | 'insumo_mercado' | 'ferramenta' | 'lubrificante' | 'peca_essencial';

export default function MaterialsView({
  materials,
  currentUser,
  onSaveMaterial,
  onDeleteMaterial,
}: MaterialsViewProps) {
  const [activeTab, setActiveTab] = useState<CategoryKey>('insumo_servico');
  const [searchQuery, setSearchQuery] = useState("");

  // Permissions
  const canEdit = currentUser?.permissions?.materials?.edit !== false;
  const canDelete = currentUser?.permissions?.materials?.delete !== false;
  const isAdmin = canEdit;

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states for reporting shortage
  const [reportName, setReportName] = useState("");
  const [reportCategory, setReportCategory] = useState<CategoryKey>('insumo_servico');
  const [reportByName, setReportByName] = useState(currentUser?.name || "");
  const [reportDate, setReportDate] = useState<Date | undefined>(undefined);
  const [reportHour, setReportHour] = useState("12");
  const [reportMinute, setReportMinute] = useState("00");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedExistingMaterial, setSelectedExistingMaterial] = useState<Material | null>(null);

  // Form states for editing (Admin)
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<CategoryKey>('insumo_servico');
  const [editStatus, setEditStatus] = useState<'pendente' | 'a_caminho' | 'chegou'>('pendente');
  const [editCost, setEditCost] = useState(0);
  const [editSupplierName, setEditSupplierName] = useState("");
  const [editSupplierPhone, setEditSupplierPhone] = useState("");
  const [editReportedBy, setEditReportedBy] = useState("");
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editHour, setEditHour] = useState("12");
  const [editMinute, setEditMinute] = useState("00");

  // Delete state
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");

  const categories = [
    { key: 'insumo_servico', label: 'Insumos de Serviço' },
    { key: 'insumo_mercado', label: 'Insumos de Mercado' },
    { key: 'ferramenta', label: 'Ferramentas' },
    { key: 'lubrificante', label: 'Lubrificantes' },
    { key: 'peca_essencial', label: 'Peças Essenciais' },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const formatNeededBy = (date?: string, time?: string) => {
    if (!date) return null;
    try {
      const [y, m, d] = date.split("-");
      const dateFormatted = `${d}/${m}/${y}`;
      const timeFormatted = time ? ` às ${time}` : "";
      return `${dateFormatted}${timeFormatted}`;
    } catch {
      return date + (time ? ` ${time}` : "");
    }
  };

  // Filter materials based on search and active tab
  const filteredMaterials = materials.filter((item) => {
    if (item.category !== activeTab) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.supplierName?.toLowerCase().includes(q) ||
      item.reportedBy?.toLowerCase().includes(q)
    );
  });

  // Filter existing materials for reporting autocomplete
  const autocompleteSuggestions = materials.filter((item) => {
    const q = reportName.toLowerCase().trim();
    if (!q) return false;
    return item.name.toLowerCase().includes(q) && item.name.toLowerCase() !== q;
  }).slice(0, 5);

  const handleOpenReportModal = () => {
    setReportName("");
    setReportCategory(activeTab);
    setReportByName(currentUser?.name || "");
    setReportDate(undefined);
    setReportHour("12");
    setReportMinute("00");
    setSelectedExistingMaterial(null);
    setShowAutocomplete(false);
    setIsReportModalOpen(true);
  };

  const handleSelectSuggestion = (item: Material) => {
    setReportName(item.name);
    setReportCategory(item.category);
    setSelectedExistingMaterial(item);
    setShowAutocomplete(false);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportName.trim()) return;

    try {
      if (selectedExistingMaterial) {
        // Material already exists, we just update status to 'pendente' and update who reported it
        await onSaveMaterial({
          id: selectedExistingMaterial.id,
          name: selectedExistingMaterial.name,
          category: selectedExistingMaterial.category,
          status: 'pendente',
          cost: selectedExistingMaterial.cost,
          supplierName: selectedExistingMaterial.supplierName,
          supplierPhone: selectedExistingMaterial.supplierPhone,
          reportedBy: reportByName.trim() || undefined,
          neededByDate: reportDate ? format(reportDate, "yyyy-MM-dd") : undefined,
          neededByTime: reportDate ? `${reportHour}:${reportMinute}` : undefined,
        });
      } else {
        // Create new material in 'pendente' status
        await onSaveMaterial({
          name: reportName.trim(),
          category: reportCategory,
          status: 'pendente',
          cost: 0,
          reportedBy: reportByName.trim() || undefined,
          neededByDate: reportDate ? format(reportDate, "yyyy-MM-dd") : undefined,
          neededByTime: reportDate ? `${reportHour}:${reportMinute}` : undefined,
        });
      }
      setIsReportModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditModal = (item: Material) => {
    setEditId(item.id);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditStatus(item.status);
    setEditCost(item.cost);
    setEditSupplierName(item.supplierName || "");
    setEditSupplierPhone(item.supplierPhone || "");
    setEditReportedBy(item.reportedBy || "");
    if (item.neededByDate) {
      try {
        const [y, m, d] = item.neededByDate.split("-");
        setEditDate(new Date(parseInt(y), parseInt(m) - 1, parseInt(d)));
      } catch {
        setEditDate(undefined);
      }
    } else {
      setEditDate(undefined);
    }
    if (item.neededByTime) {
      const [h, min] = item.neededByTime.split(":");
      setEditHour(h || "12");
      setEditMinute(min || "00");
    } else {
      setEditHour("12");
      setEditMinute("00");
    }
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      await onSaveMaterial({
        id: editId,
        name: editName.trim(),
        category: editCategory,
        status: editStatus,
        cost: editCost,
        supplierName: editSupplierName.trim() || undefined,
        supplierPhone: editSupplierPhone.trim() || undefined,
        reportedBy: editReportedBy.trim() || undefined,
        neededByDate: editDate ? format(editDate, "yyyy-MM-dd") : undefined,
        neededByTime: editDate ? `${editHour}:${editMinute}` : undefined,
      });
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDeleteModal = (item: Material) => {
    setDeleteId(item.id);
    setDeleteName(item.name);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async () => {
    try {
      await onDeleteMaterial(deleteId);
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadgeClass = (status: 'pendente' | 'a_caminho' | 'chegou') => {
    switch (status) {
      case "pendente":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "a_caminho":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "chegou":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      default:
        return "bg-zinc-50 text-zinc-650 border border-zinc-200";
    }
  };

  const getStatusLabel = (status: 'pendente' | 'a_caminho' | 'chegou') => {
    switch (status) {
      case "pendente":
        return "Faltando (Pendente)";
      case "a_caminho":
        return "A Caminho";
      case "chegou":
        return "Entregue (Chegou)";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <ClipboardList className="h-4.5 w-4.5 text-zinc-500" />
          Controle de Materiais e Insumos
        </h2>
        <button
          onClick={handleOpenReportModal}
          className="flex items-center justify-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs tracking-wide px-3.5 py-2 rounded-xl transition-all duration-155 shadow-sm shrink-0 self-start md:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          REPORTAR FALTA DE MATERIAL
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-zinc-200 pb-px">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveTab(cat.key as CategoryKey)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === cat.key
                ? "border-zinc-900 text-zinc-900 bg-white"
                : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar por descrição, fornecedor, solicitante..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-1.5 text-xs font-semibold text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
        />
      </div>

      {/* Content */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl py-16 text-center shadow-sm">
          <ClipboardList className="h-9 w-9 text-zinc-300 mx-auto mb-3" />
          <p className="font-semibold text-zinc-700 text-sm">Nenhum material encontrado</p>
          <p className="text-xs text-zinc-400 mt-1">
            Esta categoria está vazia ou não há resultados para a busca.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile view - Cards */}
          <div className="md:hidden space-y-2">
            {filteredMaterials.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-3 shadow-sm hover:border-zinc-300 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-zinc-900 text-xs">{item.name}</h3>
                    <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full mt-1.5 ${getStatusBadgeClass(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                      title={canEdit ? "Editar" : "Visualizar Detalhes"}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleOpenDeleteModal(item)}
                        className="p-1.5 bg-zinc-50 hover:bg-red-50 rounded-lg text-zinc-500 hover:text-red-600 transition-colors cursor-pointer"
                        title="Remover"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-2 pt-2.5 border-t border-zinc-100 text-[10px] font-semibold text-zinc-500">
                  <div>
                    <p className="text-[9px] text-zinc-400 uppercase font-bold">Custo</p>
                    <p className="text-zinc-800 font-extrabold mt-0.5">
                      {item.cost > 0 ? formatPrice(item.cost) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-zinc-400 uppercase font-bold">Fornecedor</p>
                    <p className="text-zinc-800 mt-0.5 flex items-center gap-1">
                      {item.supplierName ? (
                        <>
                          <Building2 className="h-3 w-3 shrink-0 text-zinc-400" />
                          <span className="truncate max-w-[100px]">{item.supplierName}</span>
                        </>
                      ) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-zinc-400 uppercase font-bold">Telefone Fornecedor</p>
                    <p className="text-zinc-850 mt-0.5 flex items-center gap-1 font-mono">
                      {item.supplierPhone ? (
                        <>
                          <Phone className="h-3 w-3 shrink-0 text-zinc-400" />
                          <span>{item.supplierPhone}</span>
                        </>
                      ) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-zinc-400 uppercase font-bold">Solicitado por</p>
                    <p className="text-zinc-800 mt-0.5 flex items-center gap-1">
                      <User className="h-3 w-3 shrink-0 text-zinc-400" />
                      <span>{item.reportedBy || "Desconhecido"}</span>
                    </p>
                  </div>
                  <div className="col-span-2 pt-1 flex justify-between items-start gap-4">
                    <div>
                      <p className="text-[9px] text-zinc-400 uppercase font-bold">Data Relato</p>
                      <p className="text-zinc-650 mt-0.5 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3 shrink-0 text-zinc-450" />
                        <span>{formatDate(item.createdAt)}</span>
                      </p>
                    </div>
                    {item.neededByDate && (
                      <div className="text-right">
                        <p className="text-[9px] text-red-500 uppercase font-bold">Necessário Até</p>
                        <p className="text-red-700 font-extrabold mt-0.5 text-[11px]">
                          {formatNeededBy(item.neededByDate, item.neededByTime)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop view - Table */}
          <div className="hidden md:block bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-150 bg-zinc-50/50">
                  <TableHead className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold whitespace-nowrap py-3 pl-4">Material / Insumo</TableHead>
                  <TableHead className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold whitespace-nowrap">Custo Unitário</TableHead>
                  <TableHead className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold whitespace-nowrap">Fornecedor</TableHead>
                  <TableHead className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold whitespace-nowrap">Telefone</TableHead>
                  <TableHead className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold whitespace-nowrap">Reportado por</TableHead>
                  <TableHead className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold whitespace-nowrap">Necessário Até</TableHead>
                  <TableHead className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold whitespace-nowrap">Data Relato</TableHead>
                  <TableHead className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold whitespace-nowrap text-right pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-zinc-100 hover:bg-zinc-50/40 transition-colors cursor-pointer group"
                    onClick={() => handleOpenEditModal(item)}
                  >
                    <TableCell className="py-3.5 pl-4 font-bold text-zinc-850 text-xs">
                      {item.name}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </TableCell>
                    <TableCell className="font-extrabold text-zinc-800 text-xs">
                      {item.cost > 0 ? formatPrice(item.cost) : "-"}
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-650 text-xs">
                      {item.supplierName || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-zinc-600 text-xs">
                      {item.supplierPhone || "-"}
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-650 text-xs">
                      {item.reportedBy || "-"}
                    </TableCell>
                    <TableCell className="font-bold text-red-600 text-xs whitespace-nowrap">
                      {formatNeededBy(item.neededByDate, item.neededByTime) || <span className="text-zinc-350 font-normal italic">Sem prazo</span>}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-xs">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="inline-flex items-center justify-center h-8 w-8 bg-zinc-50 hover:bg-zinc-900 hover:text-white text-zinc-500 rounded-lg transition-all duration-150 cursor-pointer"
                          title={isAdmin ? "Editar" : "Ver Detalhes"}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleOpenDeleteModal(item)}
                            className="inline-flex items-center justify-center h-8 w-8 bg-zinc-50 hover:bg-red-500 hover:text-white text-zinc-500 rounded-lg transition-all duration-150 cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* REPORT SHORTAGE MODAL */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="bg-white border border-zinc-200 rounded-2xl max-w-md shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
              Reportar Falta de Material
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Digite o nome do material em falta. Se já estiver cadastrado, selecione-o. Caso contrário, crie um novo material na categoria apropriada.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReportSubmit} className="space-y-4 pt-2">
            {/* Name Input with Autocomplete */}
            <div className="space-y-1 relative">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Nome do Material</label>
              <input
                type="text"
                required
                value={reportName}
                onChange={(e) => {
                  setReportName(e.target.value);
                  setSelectedExistingMaterial(null);
                  setShowAutocomplete(true);
                }}
                onFocus={() => setShowAutocomplete(true)}
                placeholder="Ex: WD-40, Chave combinada 12mm, Óleo Motul"
                className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
              />

              {/* Suggestions Panel */}
              {showAutocomplete && autocompleteSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 divide-y divide-zinc-50 overflow-hidden">
                  {autocompleteSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 font-semibold text-zinc-650 flex justify-between items-center"
                    >
                      <span>{item.name}</span>
                      <span className="text-[9px] font-extrabold uppercase text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
                        {categories.find(c => c.key === item.category)?.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected existing material warning */}
            {selectedExistingMaterial && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-[11px] font-semibold text-zinc-600">
                ✨ Material encontrado no sistema! Ele será marcado como **Faltando (Pendente)**.
              </div>
            )}

            {/* Category selection (only shown/enabled when creating a new material) */}
            {!selectedExistingMaterial && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Categoria</label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value as CategoryKey)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-2 py-2 text-xs font-semibold text-zinc-700 focus:outline-none focus:border-zinc-500 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reported by */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Quem está relatando a falta?</label>
              <input
                type="text"
                required
                value={reportByName}
                onChange={(e) => setReportByName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
              />
            </div>

            {/* Needed by date & time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Até que dia precisa?</label>
                <Popover>
                  <PopoverTrigger
                    type="button"
                    className="w-full flex items-center justify-between bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-750 focus:outline-none focus:border-zinc-500 cursor-pointer h-[34px]"
                  >
                    <span className="truncate">
                      {reportDate ? format(reportDate, "dd/MM/yyyy") : "Selecione..."}
                    </span>
                    {reportDate ? (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportDate(undefined);
                        }}
                        className="text-zinc-400 hover:text-zinc-650 cursor-pointer p-0.5 rounded-full hover:bg-zinc-100 leading-none text-sm"
                      >
                        ×
                      </span>
                    ) : (
                      <CalendarIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border border-zinc-200 rounded-2xl shadow-xl z-[60]" align="start">
                    <Calendar
                      mode="single"
                      selected={reportDate}
                      onSelect={(date) => setReportDate(date)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Até que horas?</label>
                <div className="flex gap-1 items-center">
                  <Select value={reportHour} onValueChange={(val) => setReportHour(val ?? "12")}>
                    <SelectTrigger className="w-full bg-white border border-zinc-200 rounded-xl px-2 h-[34px] text-xs font-semibold text-zinc-705 focus:outline-none cursor-pointer">
                      <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-zinc-200 rounded-xl max-h-48 overflow-y-auto">
                      {Array.from({ length: 24 }).map((_, i) => {
                        const val = String(i).padStart(2, "0");
                        return (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <span className="text-zinc-400 font-bold text-xs shrink-0">:</span>
                  <Select value={reportMinute} onValueChange={(val) => setReportMinute(val ?? "00")}>
                    <SelectTrigger className="w-full bg-white border border-zinc-200 rounded-xl px-2 h-[34px] text-xs font-semibold text-zinc-705 focus:outline-none cursor-pointer">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-zinc-200 rounded-xl max-h-48 overflow-y-auto">
                      {Array.from({ length: 12 }).map((_, i) => {
                        const val = String(i * 5).padStart(2, "0");
                        return (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 flex flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-650 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Confirmar Relato
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT MATERIAL / ADMIN VIEW DETAIL MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-white border border-zinc-200 rounded-2xl max-w-md shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
              {isAdmin ? "Gerenciar Material" : "Detalhes do Material"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              {isAdmin
                ? "Edite informações de status, custo, fornecedor e categoria do material."
                : "Informações completas de controle de compras e fornecedor."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <fieldset disabled={!isAdmin} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Nome do Material</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Categoria</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as CategoryKey)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-2 py-2 text-xs font-semibold text-zinc-700 focus:outline-none focus:border-zinc-500 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'pendente' | 'a_caminho' | 'chegou')}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-2 py-2 text-xs font-semibold text-zinc-700 focus:outline-none focus:border-zinc-500 cursor-pointer"
                  >
                    <option value="pendente">Faltando (Pendente)</option>
                    <option value="a_caminho">A Caminho</option>
                    <option value="chegou">Entregue (Chegou)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Cost */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Custo Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editCost}
                    onChange={(e) => setEditCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 focus:outline-none focus:border-zinc-500"
                  />
                </div>

              </div>

              {/* Needed by date & time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Necessário até (Data)</label>
                  <Popover>
                    <PopoverTrigger
                      type="button"
                      className="w-full flex items-center justify-between bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-750 focus:outline-none focus:border-zinc-500 cursor-pointer h-[34px]"
                    >
                      <span className="truncate">
                        {editDate ? format(editDate, "dd/MM/yyyy") : "Selecione..."}
                      </span>
                      {editDate ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditDate(undefined);
                          }}
                          className="text-zinc-400 hover:text-zinc-650 cursor-pointer p-0.5 rounded-full hover:bg-zinc-100 leading-none text-sm"
                        >
                          ×
                        </span>
                      ) : (
                        <CalendarIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      )}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border border-zinc-200 rounded-2xl shadow-xl z-[60]" align="start">
                      <Calendar
                        mode="single"
                        selected={editDate}
                        onSelect={(date) => setEditDate(date)}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Necessário até (Hora)</label>
                  <div className="flex gap-1 items-center">
                    <Select value={editHour} onValueChange={(val) => setEditHour(val ?? "12")}>
                      <SelectTrigger className="w-full bg-white border border-zinc-200 rounded-xl px-2 h-[34px] text-xs font-semibold text-zinc-705 focus:outline-none cursor-pointer">
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-zinc-200 rounded-xl max-h-48 overflow-y-auto">
                        {Array.from({ length: 24 }).map((_, i) => {
                          const val = String(i).padStart(2, "0");
                          return (
                            <SelectItem key={val} value={val}>
                              {val}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <span className="text-zinc-400 font-bold text-xs shrink-0">:</span>
                    <Select value={editMinute} onValueChange={(val) => setEditMinute(val ?? "00")}>
                      <SelectTrigger className="w-full bg-white border border-zinc-200 rounded-xl px-2 h-[34px] text-xs font-semibold text-zinc-705 focus:outline-none cursor-pointer">
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-zinc-200 rounded-xl max-h-48 overflow-y-auto">
                        {Array.from({ length: 12 }).map((_, i) => {
                          const val = String(i * 5).padStart(2, "0");
                          return (
                            <SelectItem key={val} value={val}>
                              {val}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-3 space-y-3">
                <p className="text-[10px] font-extrabold text-zinc-800 uppercase tracking-widest">
                  Dados de Compra / Fornecedor
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Supplier Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Nome da Empresa</label>
                    <input
                      type="text"
                      value={editSupplierName}
                      onChange={(e) => setEditSupplierName(e.target.value)}
                      placeholder="Ex: Auto Peças Silva"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  {/* Supplier Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Telefone de Contato</label>
                    <input
                      type="text"
                      value={editSupplierPhone}
                      onChange={(e) => setEditSupplierPhone(e.target.value)}
                      placeholder="Ex: (11) 99999-9999"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            <DialogFooter className="pt-4 flex flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-650 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                {isAdmin ? "Cancelar" : "Fechar"}
              </button>
              {isAdmin && (
                <button
                  type="submit"
                  className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Salvar Alterações
                </button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE MODAL */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-white border border-zinc-200 rounded-2xl max-w-sm shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
              Excluir Material
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 pt-2">
              Tem certeza que deseja excluir o material **{deleteName}**? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex flex-row gap-2.5 justify-end">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-650 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteSubmit}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Excluir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
