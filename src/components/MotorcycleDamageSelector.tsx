import React, { useState } from "react";
import { 
  Wrench, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  Eye, 
  Activity, 
  AlertTriangle, 
  Plus, 
  Tag, 
  Info,
  ChevronRight
} from "lucide-react";
import { DamagePoint } from "@/types";

interface Hotspot {
  id: string;
  name: string;
  x: number; // percentage
  y: number; // percentage
  category: "front" | "mid" | "rear" | "engine";
}

const MOTORCYCLE_HOTSPOTS: Hotspot[] = [
  { id: "front_wheel", name: "Roda & Disco Dianteiro", x: 19, y: 78, category: "front" },
  { id: "front_fender", name: "Paralama Dianteiro", x: 15, y: 62, category: "front" },
  { id: "front_fork", name: "Suspensão Dianteira", x: 23, y: 55, category: "front" },
  { id: "front_brake", name: "Freio / Pinça Dianteira", x: 21, y: 70, category: "front" },
  { id: "headlight", name: "Farol & Caretagem Frontal", x: 24, y: 35, category: "front" },
  { id: "dashboard", name: "Painel de Instrumentos & Cúpula", x: 29, y: 25, category: "front" },
  { id: "handlebars", name: "Guidão, Manetes & Espelhos", x: 35, y: 16, category: "front" },
  { id: "tank", name: "Tanque de Combustível", x: 48, y: 34, category: "mid" },
  { id: "radiator", name: "Radiador & Protetores", x: 38, y: 48, category: "mid" },
  { id: "engine", name: "Motor (Tampas & Bloco)", x: 46, y: 64, category: "engine" },
  { id: "frame", name: "Chassi (Quadro & Treliça)", x: 52, y: 46, category: "mid" },
  { id: "seat_pilot", name: "Assento do Piloto", x: 61, y: 38, category: "mid" },
  { id: "seat_passenger", name: "Assento do Garupa", x: 72, y: 36, category: "rear" },
  { id: "side_cover", name: "Carenagem Lateral / Tampa", x: 74, y: 47, category: "rear" },
  { id: "exhaust_header", name: "Escapamento (Curvas/Coletor)", x: 41, y: 76, category: "engine" },
  { id: "exhaust_muffler", name: "Ponteira do Escapamento", x: 78, y: 66, category: "rear" },
  { id: "chain_sprocket", name: "Relação (Corrente/Coroa)", x: 64, y: 72, category: "rear" },
  { id: "swingarm", name: "Balança Traseira", x: 68, y: 64, category: "rear" },
  { id: "rear_shock", name: "Amortecedor Monoshock", x: 58, y: 56, category: "mid" },
  { id: "rear_wheel", name: "Roda & Disco Traseiro", x: 84, y: 76, category: "rear" },
  { id: "rear_fender", name: "Paralama Traseiro & Suporte", x: 87, y: 48, category: "rear" },
  { id: "tail_light", name: "Lanterna & Piscas Traseiros", x: 81, y: 33, category: "rear" },
];

const SCRATCH_QUICK_TAGS = [
  "Risco Superficial",
  "Risco Profundo",
  "Amassado Leve",
  "Amassado Forte",
  "Pintura Descascada",
  "Verniz Desbotado",
  "Esfregado / Atrito",
];

const BROKEN_QUICK_TAGS = [
  "Peça Trincada",
  "Peça Quebrada",
  "Suporte Trincado",
  "Falta Parafuso",
  "Entortado",
  "Solto com Folga",
  "Rasgado",
];

interface MotorcycleDamageSelectorProps {
  damagePoints: DamagePoint[];
  onChange: (points: DamagePoint[]) => void;
  readOnly?: boolean;
}

export default function MotorcycleDamageSelector({
  damagePoints,
  onChange,
  readOnly = false,
}: MotorcycleDamageSelectorProps) {
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [damageType, setDamageType] = useState<"riscado" | "quebrado">("riscado");
  const [description, setDescription] = useState("");

  const handleHotspotClick = (hotspot: Hotspot) => {
    if (readOnly) return;

    const existing = damagePoints.find((p) => p.partId === hotspot.id);
    if (existing) {
      setDamageType(existing.type);
      setDescription(existing.description || "");
    } else {
      setDamageType("riscado");
      setDescription("");
    }
    setActiveHotspot(hotspot);
  };

  const handleQuickTagClick = (tag: string) => {
    if (description.includes(tag)) return;
    const current = description.trim();
    setDescription(current ? `${current}, ${tag.toLowerCase()}` : tag);
  };

  const handleSaveDamage = () => {
    if (!activeHotspot) return;

    const filtered = damagePoints.filter((p) => p.partId !== activeHotspot.id);
    const updated = [
      ...filtered,
      {
        partId: activeHotspot.id,
        partName: activeHotspot.name,
        type: damageType,
        description: description.trim() || undefined,
      },
    ];

    onChange(updated);
    setActiveHotspot(null);
    setDescription("");
  };

  const handleRemoveDamage = (partId: string) => {
    if (readOnly) return;
    const updated = damagePoints.filter((p) => p.partId !== partId);
    onChange(updated);
    if (activeHotspot?.id === partId) {
      setActiveHotspot(null);
    }
  };

  // Aesthetics score algorithm
  const totalScratches = damagePoints.filter((p) => p.type === "riscado").length;
  const totalBroken = damagePoints.filter((p) => p.type === "quebrado").length;
  
  const scoreRaw = 100 - (totalScratches * 4 + totalBroken * 8);
  const estheticScore = Math.max(0, scoreRaw);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 70) return "text-amber-500 border-amber-500/30 bg-amber-500/10";
    return "text-red-500 border-red-500/30 bg-red-500/10";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excelente";
    if (score >= 70) return "Regular (Danos Leves)";
    return "Crítico (Avarias Graves)";
  };

  return (
    <div className="space-y-4">
      {/* Sonar pulse CSS and HUD styling */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes sonar-ring {
          0% { transform: scale(0.6); opacity: 0.9; }
          60% { opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes tech-scan {
          0% { transform: translateY(-100%); opacity: 0.1; }
          50% { opacity: 0.35; }
          100% { transform: translateY(100%); opacity: 0.1; }
        }
        @keyframes grid-pulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.45; }
        }
        .pulse-sonar {
          animation: sonar-ring 2s cubic-bezier(0.25, 0, 0.45, 1) infinite;
        }
        .tech-grid {
          background-size: 20px 20px;
          background-image: 
            linear-gradient(to right, rgba(63, 63, 70, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(63, 63, 70, 0.15) 1px, transparent 1px);
          animation: grid-pulse 6s ease-in-out infinite;
        }
        .hud-scanline {
          animation: tech-scan 7s linear infinite;
        }
      `}} />

      {/* Header and Aesthetic Conservation Stats */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm text-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
            <Activity className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              Vistoria Visual Interativa
            </h3>
            <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">
              {readOnly 
                ? "Resumo das avarias estruturais e cosméticas." 
                : "Selecione os pontos da motocicleta para cadastrar riscos ou quebras."}
            </p>
          </div>
        </div>

        {/* HUD Stats */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Aesthetic index */}
          <div className={`flex items-center gap-3.5 border px-3 py-1.5 rounded-lg ${getScoreColor(estheticScore)}`}>
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-60 leading-none">Índice Estético</p>
              <p className="text-[10px] font-extrabold mt-0.5">{getScoreLabel(estheticScore)}</p>
            </div>
            <span className="text-lg font-black tracking-tight">{estheticScore}%</span>
          </div>

          {/* Counts */}
          <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700/80 px-3 py-2 rounded-lg text-[11px] font-bold text-zinc-300">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>{totalScratches} Riscados</span>
            </div>
            <span className="text-zinc-600">|</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span>{totalBroken} Quebrados</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Interactive Tactical Canvas */}
        <div className="lg:col-span-3 relative bg-zinc-950 rounded-2xl border border-zinc-900 p-4 sm:p-6 flex flex-col items-center justify-center min-h-[340px] overflow-hidden shadow-2xl">
          {/* Blueprint grid pattern */}
          <div className="absolute inset-0 tech-grid pointer-events-none" />
          
          {/* Laser scanning sweep line */}
          <div className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-sky-500/10 to-transparent pointer-events-none hud-scanline" />
          
          {/* Futuristic HUD corner bracket decorations */}
          <div className="absolute top-4 left-4 border-l-2 border-t-2 border-zinc-800 w-8 h-8 rounded-tl-lg pointer-events-none" />
          <div className="absolute top-4 right-4 border-r-2 border-t-2 border-zinc-800 w-8 h-8 rounded-tr-lg pointer-events-none" />
          <div className="absolute bottom-4 left-4 border-l-2 border-b-2 border-zinc-800 w-8 h-8 rounded-bl-lg pointer-events-none" />
          <div className="absolute bottom-4 right-4 border-r-2 border-b-2 border-zinc-800 w-8 h-8 rounded-br-lg pointer-events-none" />
          
          {/* Diagnostic status readout (Decorations) */}
          <div className="absolute top-5 left-14 hidden sm:flex items-center gap-2 text-[9px] font-mono text-zinc-500 tracking-wider uppercase pointer-events-none">
            <span>SYS_DIAG_MODE: ACTIVE</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
          </div>

          <div className="absolute bottom-5 right-14 hidden sm:flex items-center gap-1.5 text-[9px] font-mono text-zinc-650 tracking-wider pointer-events-none">
            <span>SCALE: 1:12</span>
            <span>·</span>
            <span>MODEL: NAKED_STD</span>
          </div>

          {/* Stylized Modern Naked Motorcycle Graphic */}
          <svg
            viewBox="0 0 600 350"
            className="w-full max-w-[530px] h-auto relative z-10 select-none opacity-85"
            fill="none"
            stroke="currentColor"
          >
            {/* Front Wheel Rim & Spokes */}
            <circle cx="120" cy="250" r="58" stroke="#374151" strokeWidth="6" />
            <circle cx="120" cy="250" r="54" stroke="#1f2937" strokeWidth="2.5" />
            <circle cx="120" cy="250" r="43" stroke="#4b5563" strokeWidth="1.5" strokeDasharray="3 4" />
            <circle cx="120" cy="250" r="16" stroke="#9ca3af" strokeWidth="3" />
            {/* Double spokes spokes (10-spoke sports wheel) */}
            <path d="M 120 250 L 120 196 M 120 250 L 120 304 M 120 250 L 66 250 M 120 250 L 174 250 M 120 250 L 82 212 M 120 250 L 158 288 M 120 250 L 158 212 M 120 250 L 82 288" stroke="#4b5563" strokeWidth="1.5" />
            {/* Front Disc Brake */}
            <circle cx="120" cy="250" r="32" stroke="#9ca3af" strokeWidth="2" strokeDasharray="5 3" />
            <rect x="132" y="222" width="10" height="18" rx="2" stroke="#6b7280" fill="#374151" strokeWidth="1.5" /> {/* Caliper */}

            {/* Rear Wheel Rim & Spokes */}
            <circle cx="480" cy="250" r="62" stroke="#374151" strokeWidth="8" />
            <circle cx="480" cy="250" r="56" stroke="#1f2937" strokeWidth="3.5" />
            <circle cx="480" cy="250" r="45" stroke="#4b5563" strokeWidth="1.5" strokeDasharray="3 4" />
            <circle cx="480" cy="250" r="22" stroke="#9ca3af" strokeWidth="4" />
            {/* Double spokes rear */}
            <path d="M 480 250 L 480 192 M 480 250 L 480 308 M 480 250 L 422 250 M 480 250 L 538 250 M 480 250 L 439 209 M 480 250 L 521 291 M 480 250 L 521 209 M 480 250 L 439 291" stroke="#4b5563" strokeWidth="2" />
            {/* Rear Sprocket / Chain connection */}
            <circle cx="480" cy="250" r="28" stroke="#4b5563" strokeWidth="2" />

            {/* Front Suspension & Steering Axis */}
            <line x1="120" y1="250" x2="188" y2="78" stroke="#cbd5e1" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="125" y1="248" x2="190" y2="85" stroke="#475569" strokeWidth="2" />
            <rect x="150" y="110" width="14" height="60" rx="2" transform="rotate(-22, 150, 110)" stroke="#64748b" fill="#334155" strokeWidth="1.5" /> {/* Fork protector shroud */}

            {/* Front Mudguard Fender */}
            <path d="M 85 208 C 90 185, 140 180, 160 215" stroke="#94a3b8" strokeWidth="4.5" strokeLinecap="round" />

            {/* Clip-on Handlebars, controls & mirror */}
            <path d="M 188 78 L 214 62 L 254 64" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" />
            <line x1="214" y1="62" x2="208" y2="52" stroke="#64748b" strokeWidth="3" />
            <circle cx="206" cy="46" r="8" stroke="#475569" strokeWidth="2" /> {/* Mirror */}
            <path d="M 214 62 L 225 65" stroke="#f1f5f9" strokeWidth="2.5" /> {/* Brake lever */}

            {/* Engine & Cylinder Block */}
            <rect x="235" y="155" width="105" height="85" rx="8" stroke="#4b5563" strokeWidth="3" fill="#1e1b4b" fillOpacity="0.3" />
            <circle cx="290" cy="198" r="28" stroke="#4b5563" strokeWidth="2" fill="#18181b" /> {/* Clutch box cover */}
            {/* Cooling fins and bolt accents */}
            <line x1="245" y1="168" x2="330" y2="168" stroke="#374151" strokeWidth="2" />
            <line x1="245" y1="178" x2="330" y2="178" stroke="#374151" strokeWidth="2" />
            <line x1="245" y1="218" x2="330" y2="218" stroke="#374151" strokeWidth="2" />
            <circle cx="250" cy="198" r="3" stroke="#6b7280" fill="#6b7280" />
            <circle cx="325" cy="198" r="3" stroke="#6b7280" fill="#6b7280" />

            {/* Radiator Core & Cowl */}
            <rect x="195" y="145" width="18" height="60" rx="3" transform="rotate(-8, 195, 145)" stroke="#475569" fill="#1f2937" strokeWidth="2" />
            <line x1="198" y1="155" x2="204" y2="198" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />

            {/* Front Headlight Cowling & Instruments */}
            <path d="M 188 78 L 175 105 L 195 125 L 205 110 C 205 110, 202 85, 188 78 Z" stroke="#cbd5e1" strokeWidth="2.5" fill="#0f172a" fillOpacity="0.4" />
            <path d="M 175 105 L 182 114" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" /> {/* Headlight LED glow accent */}

            {/* Tubular Steel Trellis Frame */}
            <path d="M 188 108 L 265 210 M 265 210 L 355 200 M 355 200 L 415 145 M 188 108 L 355 200" stroke="#ef4444" strokeWidth="4.5" strokeLinecap="round" strokeOpacity="0.9" /> {/* Red trellis accent */}
            <path d="M 188 108 L 300 135 M 300 135 L 415 145 M 265 210 L 300 135" stroke="#991b1b" strokeWidth="3" strokeLinecap="round" />

            {/* Fuel Tank (Aggressive Naked shape) */}
            <path d="M 188 114 C 200 80, 280 75, 335 115 C 335 115, 290 162, 218 152 Z" stroke="#cbd5e1" strokeWidth="3" fill="#1e293b" fillOpacity="0.6" />
            <path d="M 270 90 L 290 92" stroke="#64748b" strokeWidth="2" /> {/* Fuel cap */}

            {/* Driver Rider Seat */}
            <path d="M 320 128 C 342 118, 385 122, 420 152 L 398 172 C 370 148, 335 140, 320 140 Z" stroke="#94a3b8" strokeWidth="2.5" fill="#18181b" strokeLinecap="round" />

            {/* Passenger Pillian Seat & Cowl */}
            <path d="M 408 140 C 430 132, 460 136, 480 155 L 465 174 C 445 158, 422 152, 408 150 Z" stroke="#94a3b8" strokeWidth="2.5" fill="#18181b" strokeLinecap="round" />

            {/* Side Cover Plate */}
            <path d="M 325 140 L 375 140 L 368 185 L 320 170 Z" stroke="#4b5563" strokeWidth="1.5" fill="#27272a" />

            {/* Rear Monoshock & Spring Coil */}
            <line x1="365" y1="145" x2="355" y2="200" stroke="#94a3b8" strokeWidth="4" />
            <polyline points="360,150 368,155 354,163 368,171 354,179 368,187 354,195" stroke="#ef4444" strokeWidth="3.5" fill="none" strokeLinecap="round" /> {/* Pulsing red spring */}

            {/* Rear Swingarm Axle */}
            <path d="M 345 220 L 480 250 L 465 262 L 345 228 Z" stroke="#64748b" strokeWidth="3.5" fill="#334155" fillOpacity="0.5" strokeLinecap="round" />

            {/* Exhaust Header Curves & Muffler Cannister */}
            <path d="M 252 235 C 262 278, 335 285, 385 260 L 485 208" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
            <path d="M 385 260 L 485 208" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" /> {/* Heat shield carbon cover */}
            <rect x="420" y="210" width="70" height="20" rx="3" transform="rotate(-24, 420, 210)" stroke="#64748b" fill="#0f172a" strokeWidth="2" />
            <circle cx="482" cy="180" r="5" stroke="#94a3b8" fill="#475569" strokeWidth="1.5" /> {/* Outlet */}

            {/* Chain and Sprocket Cover */}
            <path d="M 348 226 L 478 248" stroke="#4b5563" strokeWidth="2.5" strokeDasharray="4 3" />

            {/* Rear license plate mudguard mount */}
            <path d="M 465 160 L 515 200 L 505 210" stroke="#475569" strokeWidth="3.5" fill="#18181b" />
            <rect x="500" y="205" width="12" height="15" rx="1" stroke="#374151" fill="#f8fafc" strokeWidth="1" /> {/* License plate representation */}
          </svg>

          {/* Hotspot buttons absolute overlays with improved styles */}
          {MOTORCYCLE_HOTSPOTS.map((hotspot) => {
            const damage = damagePoints.find((p) => p.partId === hotspot.id);
            const isSelected = activeHotspot?.id === hotspot.id;
            
            let colorClass = "bg-sky-500/20 border-sky-500 hover:bg-sky-500/40 text-sky-400";
            if (damage?.type === "riscado") {
              colorClass = "bg-amber-500/30 border-amber-500 hover:bg-amber-500/50 text-amber-400";
            } else if (damage?.type === "quebrado") {
              colorClass = "bg-red-500/30 border-red-500 hover:bg-red-500/50 text-red-400";
            }
            
            return (
              <div
                key={hotspot.id}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                style={{ top: `${hotspot.y}%`, left: `${hotspot.x}%` }}
              >
                {/* Glowing sonar pulse effect on active damages */}
                {damage && (
                  <span className={`absolute inset-0 rounded-full pulse-sonar pointer-events-none ${
                    damage.type === "riscado" ? "bg-amber-500" : "bg-red-500"
                  }`} />
                )}
                
                {/* Target sights decoration on selected hotspot */}
                {isSelected && (
                  <>
                    <span className="absolute -inset-2.5 border border-sky-500/50 rounded-full animate-ping pointer-events-none" />
                    <span className="absolute -inset-1.5 border border-dashed border-sky-400/80 rounded-full pointer-events-none" />
                  </>
                )}

                <button
                  type="button"
                  onClick={() => handleHotspotClick(hotspot)}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-[0_0_12px_rgba(0,0,0,0.5)] ${
                    isSelected 
                      ? "bg-white border-white scale-125 ring-4 ring-sky-500/35 text-zinc-950" 
                      : colorClass
                  }`}
                  title={hotspot.name}
                >
                  {damage ? (
                    <span className="text-[10px] font-black uppercase tracking-tight">
                      {damage.type === "riscado" ? "R" : "Q"}
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  )}
                </button>
              </div>
            );
          })}

          {/* Interactive Floating Details popover panel */}
          {activeHotspot && !readOnly && (
            <div className="absolute z-30 inset-x-4 bottom-4 bg-zinc-950/95 border border-zinc-800 p-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col gap-4 animate-fade-in text-white backdrop-blur-md">
              {/* Header inside popover */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-md bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Tag className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block leading-none">Inspecionar Peça</span>
                    <h4 className="text-xs font-bold text-white mt-0.5">{activeHotspot.name}</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveHotspot(null)}
                  className="text-zinc-500 hover:text-zinc-300 text-xs font-bold px-1.5 py-0.5 rounded transition-colors"
                >
                  Fechar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* 1. Damage type selector */}
                <div className="md:col-span-4 space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Gravidade / Tipo</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDamageType("riscado")}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        damageType === "riscado"
                          ? "bg-amber-500/20 border-amber-500 text-amber-400 font-extrabold shadow-sm"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Riscado
                    </button>
                    <button
                      type="button"
                      onClick={() => setDamageType("quebrado")}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        damageType === "quebrado"
                          ? "bg-red-500/20 border-red-500 text-red-400 font-extrabold shadow-sm"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      Quebrado
                    </button>
                  </div>
                </div>

                {/* 2. Text Input & Quick Tags */}
                <div className="md:col-span-8 flex flex-col gap-2">
                  <div className="space-y-1">
                    <label htmlFor="avaria-desc" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Descrição da Avaria</label>
                    <input
                      id="avaria-desc"
                      type="text"
                      placeholder="Ex: Risco profundo na lateral, quebrado no suporte de fixação..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-zinc-600 font-semibold"
                    />
                  </div>

                  {/* Predefined Quick Action Tags */}
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase mr-1 flex items-center gap-1">
                      <ChevronRight className="h-3 w-3" />
                      Atalhos:
                    </span>
                    {(damageType === "riscado" ? SCRATCH_QUICK_TAGS : BROKEN_QUICK_TAGS).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleQuickTagClick(tag)}
                        className="text-[9px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 px-2 py-0.5 rounded transition-all cursor-pointer font-medium"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confirm / Action controls */}
              <div className="flex items-center justify-end gap-2 border-t border-zinc-800 pt-3">
                <button
                  type="button"
                  onClick={() => handleRemoveDamage(activeHotspot.id)}
                  className="bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer mr-auto"
                >
                  Remover Avaria
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHotspot(null)}
                  className="bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveDamage}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg px-4 py-1.5 text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Salvar Avaria
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detailed damages diagnostics sidepanel */}
        <div className="bg-white rounded-2xl border border-zinc-150 p-4.5 shadow-sm h-full flex flex-col max-h-[380px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-3 shrink-0">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-zinc-400" />
              Diagnóstico ({damagePoints.length})
            </h4>
            {damagePoints.length > 0 && (
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide bg-zinc-50 border border-zinc-150 px-1.5 py-0.5 rounded">
                Danos
              </span>
            )}
          </div>
          
          {damagePoints.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
              <CheckCircle2 className="h-7 w-7 text-emerald-500 mb-2" />
              <p className="text-xs font-bold text-zinc-700">Veículo Limpo</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Nenhuma avaria estética ou estrutural identificada na vistoria.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {damagePoints.map((point) => (
                <div
                  key={point.partId}
                  className={`flex items-start justify-between p-2.5 rounded-xl border transition-all text-xs ${
                    point.type === "riscado"
                      ? "bg-amber-50/40 border-amber-100/60 hover:bg-amber-50"
                      : "bg-red-50/40 border-red-100/60 hover:bg-red-50"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 font-bold text-zinc-900 mb-0.5">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          point.type === "riscado" ? "bg-amber-500" : "bg-red-500"
                        }`}
                      />
                      <span className="truncate">{point.partName}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">
                      {point.type === "riscado" ? "Cosmético" : "Estrutural"}
                    </p>
                    {point.description && (
                      <p className="text-[10px] text-zinc-650 bg-white/70 border border-zinc-150/50 px-2 py-1 rounded font-semibold italic">
                        "{point.description}"
                      </p>
                    )}
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDamage(point.partId)}
                      className="text-zinc-400 hover:text-red-500 p-1 rounded-lg hover:bg-white/80 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick instructions indicator */}
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center gap-1.5 text-[9px] text-zinc-400 font-semibold uppercase tracking-wider shrink-0">
            <Info className="h-3.5 w-3.5 text-zinc-400" />
            <span>Legenda: R (Riscado) | Q (Quebrado)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
