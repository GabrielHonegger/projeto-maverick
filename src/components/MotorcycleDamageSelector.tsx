import React, { useState } from "react";
import { Wrench, Trash2, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import { DamagePoint } from "@/types";

interface MotorcycleDamageSelectorProps {
  damagePoints: DamagePoint[];
  onChange: (points: DamagePoint[]) => void;
  readOnly?: boolean;
}

interface Hotspot {
  id: string;
  name: string;
  x: number; // percentage
  y: number; // percentage
}

const MOTORCYCLE_HOTSPOTS: Hotspot[] = [
  { id: "front_wheel", name: "Roda Dianteira", x: 18, y: 78 },
  { id: "front_fender", name: "Paralama Dianteiro", x: 16, y: 64 },
  { id: "front_fork", name: "Suspensão Dianteira", x: 23, y: 55 },
  { id: "headlight", name: "Farol/Painel", x: 26, y: 32 },
  { id: "handlebars", name: "Guidão/Manetes/Retrovisores", x: 34, y: 20 },
  { id: "tank", name: "Tanque de Combustível", x: 48, y: 35 },
  { id: "seat", name: "Banco/Assento", x: 65, y: 38 },
  { id: "engine", name: "Motor/Escapamento (Curva)", x: 46, y: 65 },
  { id: "side_fairing", name: "Carenagem Lateral/Tampas", x: 58, y: 52 },
  { id: "exhaust", name: "Escapamento (Ponteira)", x: 78, y: 65 },
  { id: "rear_wheel", name: "Roda Traseira", x: 84, y: 75 },
  { id: "rear_fender", name: "Paralama Traseiro/Lanterna", x: 84, y: 45 },
];

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
    
    // Check if it already has damage
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

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-zinc-500" />
            Mapeamento Visual de Avarias
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {readOnly ? "Visualização de avarias registradas" : "Clique nas partes marcadas para registrar avarias."}
          </p>
        </div>
        <div className="flex gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-500 border border-amber-300 animate-pulse" />
            <span className="text-zinc-600">Riscado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500 border border-red-300 animate-pulse" />
            <span className="text-zinc-600">Quebrado</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* SVG Interactive Canvas */}
        <div className="lg:col-span-2 relative bg-zinc-950 rounded-2xl border border-zinc-900 p-6 flex flex-col items-center justify-center min-h-[300px] overflow-hidden shadow-inner">
          {/* Blueprint background grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
          
          {/* Tech HUD lines */}
          <div className="absolute top-4 left-4 border-l-2 border-t-2 border-zinc-800 w-6 h-6 rounded-tl-md" />
          <div className="absolute top-4 right-4 border-r-2 border-t-2 border-zinc-800 w-6 h-6 rounded-tr-md" />
          <div className="absolute bottom-4 left-4 border-l-2 border-b-2 border-zinc-800 w-6 h-6 rounded-bl-md" />
          <div className="absolute bottom-4 right-4 border-r-2 border-b-2 border-zinc-800 w-6 h-6 rounded-br-md" />
          
          {/* Stylized Vector Motorcycle Graphic */}
          <svg
            viewBox="0 0 600 350"
            className="w-full max-w-[500px] h-auto relative z-10 select-none opacity-80"
            fill="none"
            stroke="currentColor"
          >
            {/* Front Wheel */}
            <circle cx="120" cy="250" r="60" stroke="#52525b" strokeWidth="6" />
            <circle cx="120" cy="250" r="45" stroke="#3f3f46" strokeWidth="2" strokeDasharray="5 3" />
            <circle cx="120" cy="250" r="15" stroke="#71717a" strokeWidth="4" />
            {/* Spokes Front */}
            <line x1="120" y1="250" x2="120" y2="190" stroke="#3f3f46" strokeWidth="2" />
            <line x1="120" y1="250" x2="120" y2="310" stroke="#3f3f46" strokeWidth="2" />
            <line x1="120" y1="250" x2="60" y2="250" stroke="#3f3f46" strokeWidth="2" />
            <line x1="120" y1="250" x2="180" y2="250" stroke="#3f3f46" strokeWidth="2" />
            <line x1="120" y1="250" x2="78" y2="208" stroke="#3f3f46" strokeWidth="1.5" />
            <line x1="120" y1="250" x2="162" y2="292" stroke="#3f3f46" strokeWidth="1.5" />
            <line x1="120" y1="250" x2="162" y2="208" stroke="#3f3f46" strokeWidth="1.5" />
            <line x1="120" y1="250" x2="78" y2="292" stroke="#3f3f46" strokeWidth="1.5" />

            {/* Rear Wheel */}
            <circle cx="480" cy="250" r="65" stroke="#52525b" strokeWidth="8" />
            <circle cx="480" cy="250" r="48" stroke="#3f3f46" strokeWidth="2" strokeDasharray="5 3" />
            <circle cx="480" cy="250" r="20" stroke="#71717a" strokeWidth="5" />
            {/* Spokes Rear */}
            <line x1="480" y1="250" x2="480" y2="185" stroke="#3f3f46" strokeWidth="2.5" />
            <line x1="480" y1="250" x2="480" y2="315" stroke="#3f3f46" strokeWidth="2.5" />
            <line x1="480" y1="250" x2="415" y2="250" stroke="#3f3f46" strokeWidth="2.5" />
            <line x1="480" y1="250" x2="545" y2="250" stroke="#3f3f46" strokeWidth="2.5" />
            
            {/* Frame / Chassis */}
            <path d="M 120 250 L 170 120 L 310 110 L 410 170 L 480 250" stroke="#a1a1aa" strokeWidth="5" strokeLinecap="round" />
            <path d="M 170 120 L 260 230 L 480 250" stroke="#a1a1aa" strokeWidth="4" />
            <path d="M 260 230 L 320 230 L 410 170" stroke="#a1a1aa" strokeWidth="4" />
            
            {/* Engine block outline */}
            <rect x="230" y="150" width="100" height="80" rx="10" stroke="#71717a" strokeWidth="3" fill="#27272a" />
            <circle cx="280" cy="190" r="25" stroke="#52525b" strokeWidth="2" />
            {/* Engine details */}
            <line x1="240" y1="165" x2="320" y2="165" stroke="#52525b" strokeWidth="2" />
            <line x1="240" y1="175" x2="320" y2="175" stroke="#52525b" strokeWidth="2" />
            <line x1="240" y1="215" x2="320" y2="215" stroke="#52525b" strokeWidth="2" />

            {/* Front Fork / Suspension */}
            <line x1="120" y1="250" x2="185" y2="85" stroke="#d4d4d8" strokeWidth="5" strokeLinecap="round" />
            <line x1="125" y1="250" x2="190" y2="85" stroke="#71717a" strokeWidth="2" />
            
            {/* Handlebars */}
            <path d="M 185 85 L 210 70 L 250 72" stroke="#e4e4e7" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 210 70 L 205 60" stroke="#a1a1aa" strokeWidth="3" />
            <circle cx="205" cy="55" r="7" stroke="#71717a" strokeWidth="2" /> {/* Mirror */}
            
            {/* Front Fender */}
            <path d="M 90 200 C 100 170, 150 175, 160 210" stroke="#a1a1aa" strokeWidth="4.5" strokeLinecap="round" />

            {/* Fuel Tank */}
            <path d="M 185 110 C 200 85, 290 85, 320 120 C 320 120, 270 160, 200 150 Z" stroke="#e4e4e7" strokeWidth="3" fill="#18181b" />
            
            {/* Seat */}
            <path d="M 310 125 C 340 120, 390 125, 430 155 L 400 175 C 370 150, 330 140, 310 140 Z" stroke="#a1a1aa" strokeWidth="3" fill="#27272a" strokeLinecap="round" />

            {/* Side Cover / Plastics */}
            <path d="M 320 140 L 370 140 L 360 200 L 305 180 Z" stroke="#71717a" strokeWidth="2" fill="#1c1917" />

            {/* Exhaust pipe */}
            <path d="M 290 220 L 380 220 L 490 190" stroke="#e4e4e7" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 380 220 L 490 190" stroke="#27272a" strokeWidth="3.5" strokeLinecap="round" /> {/* Heat shield */}

            {/* Rear Swingarm */}
            <line x1="320" y1="230" x2="480" y2="250" stroke="#71717a" strokeWidth="6" />

            {/* Rear Fender / Tail */}
            <path d="M 410 150 L 480 180 L 460 200 Z" stroke="#a1a1aa" strokeWidth="3.5" fill="#18181b" />
          </svg>

          {/* Hotspot buttons absolute overlays */}
          {MOTORCYCLE_HOTSPOTS.map((hotspot) => {
            const damage = damagePoints.find((p) => p.partId === hotspot.id);
            const isSelected = activeHotspot?.id === hotspot.id;
            
            let colorClass = "bg-blue-500/20 border-blue-500 hover:bg-blue-500/40 text-blue-400";
            if (damage?.type === "riscado") {
              colorClass = "bg-amber-500/30 border-amber-500 hover:bg-amber-500/50 text-amber-400 animate-pulse";
            } else if (damage?.type === "quebrado") {
              colorClass = "bg-red-500/30 border-red-500 hover:bg-red-500/50 text-red-400 animate-pulse";
            }
            if (isSelected) {
              colorClass = "bg-white border-white scale-125 ring-4 ring-blue-500/30 text-zinc-950";
            }

            return (
              <button
                key={hotspot.id}
                type="button"
                onClick={() => handleHotspotClick(hotspot)}
                className={`absolute w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 z-20 cursor-pointer shadow-md ${colorClass}`}
                style={{ top: `${hotspot.y}%`, left: `${hotspot.x}%` }}
                title={hotspot.name}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
              </button>
            );
          })}

          {/* Interactive Tooltip / Popover when Hotspot is selected */}
          {activeHotspot && !readOnly && (
            <div className="absolute z-30 bottom-4 left-4 right-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-2xl flex flex-col md:flex-row md:items-center gap-4 animate-fade-in text-white">
              <div className="flex-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Avaria em:</p>
                <h4 className="text-sm font-semibold text-white">{activeHotspot.name}</h4>
                
                {/* Radio selects */}
                <div className="flex items-center gap-4 mt-3">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-zinc-300">
                    <input
                      type="radio"
                      name="damageType"
                      checked={damageType === "riscado"}
                      onChange={() => setDamageType("riscado")}
                      className="accent-amber-500 h-4 w-4"
                    />
                    Riscado
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-zinc-300">
                    <input
                      type="radio"
                      name="damageType"
                      checked={damageType === "quebrado"}
                      onChange={() => setDamageType("quebrado")}
                      className="accent-red-500 h-4 w-4"
                    />
                    Quebrado
                  </label>
                </div>
              </div>

              {/* Description Input */}
              <div className="flex-[2] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Observação detalhada (ex: risco superficial de 3cm)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDamage}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg px-3 py-1.5 text-xs transition-colors shrink-0"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleRemoveDamage(activeHotspot.id);
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg px-3 py-1.5 text-xs transition-colors shrink-0"
                  >
                    Limpar avaria
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHotspot(null)}
                    className="bg-transparent hover:bg-zinc-800 text-zinc-400 rounded-lg px-2 py-1.5 text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Damage list sidebar */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm h-full flex flex-col max-h-[360px] overflow-hidden">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Avarias Registradas ({damagePoints.length})
          </h4>
          
          {damagePoints.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
              <CheckCircle2 className="h-6.5 w-6.5 text-emerald-500/80 mb-2" />
              <p className="text-xs font-bold text-zinc-700">Nenhuma avaria</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Moto limpa ou sem danos aparentes</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {damagePoints.map((point) => (
                <div
                  key={point.partId}
                  className={`flex items-start justify-between p-3 rounded-xl border transition-all text-xs ${
                    point.type === "riscado"
                      ? "bg-amber-50/50 border-amber-100 hover:bg-amber-50"
                      : "bg-red-50/50 border-red-100 hover:bg-red-50"
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
                    <p className="text-[11px] text-zinc-500 capitalize font-medium mb-1">
                      {point.type === "riscado" ? "Riscado" : "Quebrado"}
                    </p>
                    {point.description && (
                      <p className="text-[10px] text-zinc-600 bg-white/60 border border-zinc-100/80 px-2 py-1 rounded-md italic">
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
        </div>
      </div>
    </div>
  );
}
