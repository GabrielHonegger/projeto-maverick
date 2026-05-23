"use client";

import React, { useState } from "react";
import { 
  Wrench, 
  Trash2, 
  RotateCcw, 
  Box, 
  Layers, 
  Eye, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { DamagePoint } from "@/types";

interface MotorcycleDamageSelectorProps {
  damagePoints: DamagePoint[];
  onChange: (points: DamagePoint[]) => void;
  readOnly?: boolean;
}

interface Hotspot2D {
  id: string;
  name: string;
  top: string;
  left: string;
}

// Simplified hotspots list divided by perspective for cleaner visual mapping
const HOTSPOTS_BY_PERSPECTIVE: Record<string, Hotspot2D[]> = {
  left: [
    { id: "front_wheel", name: "Roda Dianteira (Esq)", top: "75%", left: "18%" },
    { id: "front_fender", name: "Paralama Dianteiro", top: "55%", left: "20%" },
    { id: "front_fork", name: "Garfo Dianteiro (Esq)", top: "45%", left: "24%" },
    { id: "handlebars_left", name: "Guidão/Manete Esquerdo", top: "24%", left: "29%" },
    { id: "tank_left", name: "Tanque de Combustível (Esq)", top: "34%", left: "46%" },
    { id: "engine_left", name: "Motor / Estator (Esq)", top: "64%", left: "44%" },
    { id: "rider_seat_left", name: "Assento do Piloto (Esq)", top: "40%", left: "58%" },
    { id: "exhaust_left", name: "Escapamento (Curva/Cano)", top: "72%", left: "48%" },
    { id: "swingarm_left", name: "Balança Traseira (Esq)", top: "68%", left: "68%" },
    { id: "rear_wheel", name: "Roda Traseira (Esq)", top: "75%", left: "78%" },
    { id: "tail_cowl_left", name: "Carenagem da Rabeta (Esq)", top: "40%", left: "80%" },
  ],
  right: [
    { id: "rear_wheel", name: "Roda Traseira (Dir)", top: "75%", left: "22%" },
    { id: "swingarm_right", name: "Balança Traseira (Dir)", top: "68%", left: "32%" },
    { id: "exhaust_silencer", name: "Ponteira do Escapamento", top: "68%", left: "42%" },
    { id: "rider_seat_right", name: "Assento do Piloto (Dir)", top: "40%", left: "42%" },
    { id: "tank_right", name: "Tanque de Combustível (Dir)", top: "34%", left: "54%" },
    { id: "engine_right", name: "Motor / Embreagem (Dir)", top: "64%", left: "56%" },
    { id: "handlebars_right", name: "Guidão/Manete Direito", top: "24%", left: "71%" },
    { id: "front_fork", name: "Garfo Dianteiro (Dir)", top: "45%", left: "76%" },
    { id: "front_fender", name: "Paralama Dianteiro", top: "55%", left: "80%" },
    { id: "front_wheel", name: "Roda Dianteira (Dir)", top: "75%", left: "82%" },
    { id: "tail_cowl_right", name: "Carenagem da Rabeta (Dir)", top: "40%", left: "20%" },
  ],
  front: [
    { id: "front_wheel", name: "Roda / Pneu Dianteiro", top: "80%", left: "50%" },
    { id: "front_fender", name: "Paralama Dianteiro", top: "62%", left: "50%" },
    { id: "front_forks", name: "Garfos Dianteiros (Par)", top: "50%", left: "50%" },
    { id: "headlight", name: "Bloco Optico do Farol", top: "38%", left: "50%" },
    { id: "handlebars", name: "Guidão e Painel", top: "24%", left: "50%" },
    { id: "mirror_left", name: "Retrovisor Esquerdo", top: "12%", left: "28%" },
    { id: "mirror_right", name: "Retrovisor Direito", top: "12%", left: "72%" },
  ],
  rear: [
    { id: "rear_wheel", name: "Roda / Pneu Traseiro", top: "80%", left: "50%" },
    { id: "license_plate", name: "Suporte de Placa / Placa", top: "62%", left: "50%" },
    { id: "taillight", name: "Lanterna Traseira", top: "42%", left: "50%" },
    { id: "passenger_seat", name: "Assento do Passageiro", top: "36%", left: "50%" },
    { id: "grab_rails", name: "Alças Traseiras", top: "32%", left: "50%" },
    { id: "indicator_left", name: "Seta Traseira Esquerda", top: "52%", left: "34%" },
    { id: "indicator_right", name: "Seta Traseira Direita", top: "52%", left: "66%" },
  ],
  top: [
    { id: "front_wheel", name: "Roda Dianteira (Topo)", top: "12%", left: "50%" },
    { id: "handlebars", name: "Guidão e Mesa", top: "34%", left: "50%" },
    { id: "mirror_left", name: "Retrovisor Esquerdo", top: "32%", left: "28%" },
    { id: "mirror_right", name: "Retrovisor Direito", top: "32%", left: "72%" },
    { id: "tank", name: "Tanque de Combustível", top: "50%", left: "50%" },
    { id: "tank_cap", name: "Tampa do Tanque", top: "46%", left: "50%" },
    { id: "rider_seat", name: "Assento do Piloto", top: "68%", left: "50%" },
    { id: "passenger_seat", name: "Assento do Passageiro (Topo)", top: "80%", left: "50%" },
    { id: "taillight", name: "Lanterna Traseira (Topo)", top: "92%", left: "50%" },
  ],
};

export default function MotorcycleDamageSelector({
  damagePoints,
  onChange,
  readOnly = false,
}: MotorcycleDamageSelectorProps) {
  const renderStyle = "solid";
  const [perspective, setPerspective] = useState<"left" | "right" | "front" | "rear" | "top">("left");
  const [activeHotspot, setActiveHotspot] = useState<Hotspot2D | null>(null);
  const [damageType, setDamageType] = useState<"riscado" | "quebrado">("riscado");
  const [description, setDescription] = useState("");
  const [partNameInput, setPartNameInput] = useState("");

  // Helper to retrieve displaying coordinates (x, y) and perspective for a point (with fallback support)
  const getPointDisplayInfo = (point: DamagePoint) => {
    if (point.x !== undefined && point.y !== undefined && point.perspective) {
      return {
        x: point.x,
        y: point.y,
        perspective: point.perspective,
      };
    }
    // Fallback to searching predefined hotspots
    for (const [pKey, list] of Object.entries(HOTSPOTS_BY_PERSPECTIVE)) {
      const match = list.find((h) => h.id === point.partId);
      if (match) {
        return {
          x: parseFloat(match.left),
          y: parseFloat(match.top),
          perspective: pKey,
        };
      }
    }
    return null;
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;

    // Do nothing if the click is on an interactive element inside the container
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("label")) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Find closest hotspot to suggest a name
    let closestHotspot: Hotspot2D | null = null;
    let minDistance = Infinity;
    const hotspots = HOTSPOTS_BY_PERSPECTIVE[perspective] || [];
    for (const h of hotspots) {
      const hX = parseFloat(h.left);
      const hY = parseFloat(h.top);
      const dist = Math.hypot(hX - x, hY - y);
      if (dist < minDistance) {
        minDistance = dist;
        closestHotspot = h;
      }
    }

    const suggestedName = closestHotspot ? closestHotspot.name : `Ponto na lateral ${perspective}`;
    const tempId = `dmg_${Date.now()}`;

    setPartNameInput(suggestedName);
    setDamageType("riscado");
    setDescription("");
    setActiveHotspot({
      id: tempId,
      name: suggestedName,
      left: `${x.toFixed(1)}%`,
      top: `${y.toFixed(1)}%`,
    });
  };

  const handleSaveDamage = () => {
    if (!activeHotspot || readOnly) return;

    const filtered = damagePoints.filter((p) => p.partId !== activeHotspot.id);
    
    // Parse coordinates from activeHotspot properties
    const xVal = activeHotspot.left ? parseFloat(activeHotspot.left) : undefined;
    const yVal = activeHotspot.top ? parseFloat(activeHotspot.top) : undefined;

    const updated = [
      ...filtered,
      {
        partId: activeHotspot.id,
        partName: partNameInput.trim() || activeHotspot.name,
        type: damageType,
        description: description.trim() || undefined,
        x: xVal,
        y: yVal,
        perspective: perspective,
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

  // Find which perspective is best suited to show a specific part
  const handleSelectDamageFromList = (partId: string) => {
    const point = damagePoints.find(p => p.partId === partId);
    if (!point) return;

    const info = getPointDisplayInfo(point);
    if (info) {
      setPerspective(info.perspective as any);
      setPartNameInput(point.partName);
      setDamageType(point.type);
      setDescription(point.description || "");
      setActiveHotspot({
        id: point.partId,
        name: point.partName,
        left: `${info.x}%`,
        top: `${info.y}%`
      });
    }
  };

  // Generate SVG styles based on the active renderStyle (solid black, blue x-ray, cyan hologram)
  const getStyleClasses = () => {
    return {
      background: "bg-white",
      stroke: "stroke-zinc-800",
      strokeWidth: "2",
      fillMain: "fill-zinc-800",
      fillSecondary: "fill-zinc-700",
      fillAccent: "fill-zinc-900",
      fillFrame: "fill-zinc-600",
      fillGlass: "fill-zinc-550/20",
      fillTire: "fill-zinc-900",
      textColor: "text-zinc-800",
    };
  };

  const sc = getStyleClasses();

  // Helper to render the premium 2D vector schematic based on perspective
  const renderMotorcycleSVG = () => {
    const strokeDash = undefined;

    switch (perspective) {
      case "left":
      default:
        return (
          <svg className="w-full h-full block" viewBox="0 0 400 300" fill="none">
            {/* Rear Wheel & Rim */}
            <circle cx="320" cy="210" r="48" className={sc.fillTire} stroke="currentColor" strokeWidth="10" strokeDasharray={strokeDash} />
            <circle cx="320" cy="210" r="38" className={sc.fillSecondary} stroke="currentColor" strokeWidth="2" strokeDasharray={strokeDash} />
            <line x1="320" y1="210" x2="280" y2="210" stroke="currentColor" strokeWidth="4" strokeDasharray={strokeDash} />
            
            {/* Front Wheel & Rim */}
            <circle cx="80" cy="210" r="48" className={sc.fillTire} stroke="currentColor" strokeWidth="10" strokeDasharray={strokeDash} />
            <circle cx="80" cy="210" r="40" className={sc.fillSecondary} stroke="currentColor" strokeWidth="2" strokeDasharray={strokeDash} />
            
            {/* Front Brake Rotor */}
            <circle cx="80" cy="210" r="28" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />

            {/* Front Forks Telescopic */}
            <line x1="80" y1="210" x2="118" y2="90" stroke="currentColor" strokeWidth="6" strokeDasharray={strokeDash} />
            <rect x="108" y="90" width="20" height="8" rx="2" className={sc.fillAccent} stroke="currentColor" strokeWidth="1" />
            <rect x="110" y="140" width="16" height="65" rx="2" className={sc.fillFrame} />

            {/* Front Mudguard */}
            <path d="M 50 190 C 65 170, 95 170, 112 192 L 105 202 C 95 188, 70 188, 58 202 Z" className={sc.fillMain} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />

            {/* Exhaust Pipe & Curve */}
            <path d="M 155 155 Q 140 180, 145 210 Q 150 225, 180 225 L 260 222 L 310 195 L 320 210 L 260 235 L 180 235 Q 135 235, 128 205 Z" className={sc.fillAccent} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />

            {/* Underbelly Cowl */}
            <path d="M 130 222 L 205 228 L 190 242 L 125 232 Z" className={sc.fillMain} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />

            {/* Engine Block & Cooling Fins */}
            <rect x="145" y="145" width="48" height="52" rx="4" className={sc.fillFrame} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            <line x1="140" y1="155" x2="195" y2="155" stroke="currentColor" strokeWidth="2" />
            <line x1="140" y1="165" x2="195" y2="165" stroke="currentColor" strokeWidth="2" />
            <line x1="140" y1="175" x2="195" y2="175" stroke="currentColor" strokeWidth="2" />
            <line x1="140" y1="185" x2="195" y2="185" stroke="currentColor" strokeWidth="2" />
            <circle cx="170" cy="188" r="18" className={sc.fillAccent} stroke="currentColor" strokeWidth="1" />

            {/* Swingarm */}
            <path d="M 180 205 L 315 208 L 315 218 L 180 215 Z" className={sc.fillFrame} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />

            {/* Frame perimeter rails */}
            <path d="M 120 100 L 165 145 L 230 145 L 255 205" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={strokeDash} />

            {/* Solid Subframe Side Fairing (Closing empty space) */}
            <path d="M 195 145 L 245 145 L 285 175 L 235 205 Z" className={sc.fillMain} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />

            {/* Sculpted Fuel Tank (Sleeker and lower) */}
            <path d="M 115 115 C 125 102, 155 92, 195 98 C 215 104, 225 118, 240 135 L 185 145 Z" className={sc.fillMain} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            <circle cx="180" cy="102" r="5" className={sc.fillAccent} />

            {/* Left Shroud / Wing */}
            <path d="M 118 110 L 160 152 L 122 170 Z" className={sc.fillSecondary} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            <path d="M 125 125 L 150 148 L 128 158 Z" fill="currentColor" opacity="0.3" />

            {/* Continuous Stepped Seat */}
            <path d="M 238 133 C 248 126, 272 135, 290 145 C 305 132, 335 122, 350 126 L 352 135 C 335 130, 310 142, 290 153 L 238 143 Z" className={sc.fillTire} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />

            {/* Tail Cowl */}
            <path d="M 290 145 L 355 125 L 360 136 L 298 155 Z" className={sc.fillMain} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            <path d="M 315 126 L 340 128" stroke="currentColor" strokeWidth="4" />

            {/* Taillight LED red block */}
            <rect x="357" y="126" width="6" height="10" rx="1" fill="#ef4444" />

            {/* Headlight mask cowl */}
            <path d="M 118 92 L 132 108 L 125 130 L 110 115 Z" className={sc.fillMain} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            <polygon points="128,110 132,112 128,118" fill="#60a5fa" />

            {/* Visor flyscreen */}
            <path d="M 115 92 L 122 80 L 126 92 Z" className={sc.fillSecondary} />

            {/* Handlebars */}
            <line x1="118" y1="90" x2="114" y2="76" stroke="currentColor" strokeWidth="3" />

            {/* Mirror Left */}
            <path d="M 114 76 L 126 62 M 126 62 L 140 58 L 136 68 Z" className={sc.fillSecondary} stroke="currentColor" strokeWidth="1.5" />

            {/* License Plate Hanger */}
            <path d="M 350 136 L 372 172 M 372 172 L 378 185" stroke="currentColor" strokeWidth="3" />
            <rect x="365" y="172" width="16" height="12" fill="#fff" stroke="currentColor" strokeWidth="1" />
          </svg>
        );

      case "right":
        return (
          <svg className="w-full h-full block" viewBox="0 0 400 300" fill="none">
            {/* Mirror Right */}
            <path d="M 286 76 L 274 62 M 274 62 L 260 58 L 264 68 Z" className={sc.fillSecondary} stroke="currentColor" strokeWidth="1.5" />

            {/* License Plate Hanger */}
            <path d="M 50 136 L 28 172 M 28 172 L 22 185" stroke="currentColor" strokeWidth="3" />
            <rect x="19" y="172" width="16" height="12" fill="#fff" stroke="currentColor" strokeWidth="1" />

            {/* Rear Wheel & Rim */}
            <circle cx="80" cy="210" r="48" className={sc.fillTire} stroke="currentColor" strokeWidth="10" strokeDasharray={strokeDash} />
            <circle cx="80" cy="210" r="38" className={sc.fillSecondary} stroke="currentColor" strokeWidth="2" strokeDasharray={strokeDash} />
            
            {/* Front Wheel & Rim */}
            <circle cx="320" cy="210" r="48" className={sc.fillTire} stroke="currentColor" strokeWidth="10" strokeDasharray={strokeDash} />
            <circle cx="320" cy="210" r="40" className={sc.fillSecondary} stroke="currentColor" strokeWidth="2" strokeDasharray={strokeDash} />
            
            {/* Front Brake Rotor */}
            <circle cx="320" cy="210" r="28" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />

            {/* Front Forks */}
            <line x1="320" y1="210" x2="282" y2="90" stroke="currentColor" strokeWidth="6" strokeDasharray={strokeDash} />
            <rect x="272" y="90" width="20" height="8" rx="2" className={sc.fillAccent} stroke="currentColor" strokeWidth="1" />
            <rect x="274" y="140" width="16" height="65" rx="2" className={sc.fillFrame} />

            {/* Front Mudguard */}
            <path d="M 350 190 C 335 170, 305 170, 288 192 L 295 202 C 305 188, 330 188, 342 202 Z" className={sc.fillMain} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />

            {/* Swingarm */}
            <path d="M 220 205 L 85 208 L 85 218 L 220 215 Z" className={sc.fillFrame} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            <rect x="110" y="200" width="105" height="10" rx="1" className={sc.fillTire} />

            {/* Engine Block & Cooling Fins */}
            <rect x="207" y="145" width="48" height="52" rx="4" className={sc.fillFrame} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            <line x1="205" y1="155" x2="260" y2="155" stroke="currentColor" strokeWidth="2" />
            <line x1="205" y1="165" x2="260" y2="165" stroke="currentColor" strokeWidth="2" />
            <line x1="205" y1="175" x2="260" y2="175" stroke="currentColor" strokeWidth="2" />
            <line x1="205" y1="185" x2="260" y2="185" stroke="currentColor" strokeWidth="2" />
            <circle cx="230" cy="188" r="18" className={sc.fillAccent} stroke="currentColor" strokeWidth="1" />

            {/* Underbelly Cowl */}
            <path d="M 270 222 L 195 228 L 210 242 L 275 232 Z" className={sc.fillMain} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />

            {/* Exhaust Silencer Ponteira (Very prominent on right side) */}
            <path d="M 125 215 L 180 180 L 190 196 L 135 232 Z" className={sc.fillAccent} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            <path d="M 175 184 L 140 206 L 145 218 L 180 196 Z" className={sc.fillSecondary} stroke="currentColor" strokeWidth="1" />
            <circle cx="185" cy="188" r="6" fill="#18181b" />

            {/* Frame rails */}
            <path d="M 280 100 L 235 145 L 170 145 L 145 205" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={strokeDash} />

            {/* Solid Subframe Side Fairing */}
            <path d="M 205 145 L 155 145 L 115 175 L 165 205 Z" className={sc.fillMain} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />

            {/* Fuel Tank (Sleeker and lower) */}
            <path d="M 285 115 C 275 102, 245 92, 205 98 C 185 104, 175 118, 160 135 L 215 145 Z" className={sc.fillMain} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            <circle cx="220" cy="102" r="5" className={sc.fillAccent} />

            {/* Right Shroud */}
            <path d="M 282 110 L 240 152 L 278 170 Z" className={sc.fillSecondary} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            <path d="M 275 125 L 250 148 L 272 158 Z" fill="currentColor" opacity="0.3" />

            {/* Stepped Seat */}
            <path d="M 162 133 C 152 126, 128 135, 110 145 C 95 132, 65 122, 50 126 L 48 135 C 65 130, 90 142, 110 153 L 162 143 Z" className={sc.fillTire} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />

            {/* Tail Cowl */}
            <path d="M 110 145 L 45 125 L 40 136 L 102 155 Z" className={sc.fillMain} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            <path d="M 85 126 L 60 128" stroke="currentColor" strokeWidth="4" />

            {/* Taillight LED red block */}
            <rect x="37" y="126" width="6" height="10" rx="1" fill="#ef4444" />

            {/* Headlight cowl */}
            <path d="M 282 92 L 268 108 L 275 130 L 290 115 Z" className={sc.fillMain} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            <polygon points="272,110 268,112 272,118" fill="#60a5fa" />

            {/* Visor flyscreen */}
            <path d="M 285 92 L 278 80 L 274 92 Z" className={sc.fillSecondary} />

            {/* Handlebars */}
            <line x1="282" y1="90" x2="286" y2="76" stroke="currentColor" strokeWidth="3" />
          </svg>
        );

      case "front":
        return (
          <svg className="w-full h-full block" viewBox="0 0 200 350" fill="none">
            {/* Front Tire */}
            <rect x="84" y="210" width="32" height="120" rx="16" className={sc.fillTire} stroke="currentColor" strokeWidth="4" strokeDasharray={strokeDash} />
            <rect x="91" y="240" width="18" height="60" rx="3" className={sc.fillSecondary} />

            {/* Fork Legs */}
            <line x1="78" y1="310" x2="78" y2="120" stroke="currentColor" strokeWidth="6" strokeDasharray={strokeDash} />
            <line x1="122" y1="310" x2="122" y2="120" stroke="currentColor" strokeWidth="6" strokeDasharray={strokeDash} />
            <rect x="74" y="200" width="8" height="80" rx="1" className={sc.fillFrame} />
            <rect x="118" y="200" width="8" height="80" rx="1" className={sc.fillFrame} />

            {/* Front Mudguard wrapping tire */}
            <path d="M 72 195 L 128 195 L 122 170 L 78 170 Z" className={sc.fillMain} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />

            {/* Triple Clamps */}
            <rect x="70" y="115" width="60" height="8" rx="2" className={sc.fillAccent} stroke="currentColor" strokeWidth="1" />
            <rect x="70" y="96" width="60" height="6" rx="1" className={sc.fillAccent} stroke="currentColor" strokeWidth="1" />

            {/* Robotic Headlight Mask (Yamaha Face) */}
            <path d="M 72 105 L 100 152 L 128 105 L 122 88 L 78 88 Z" className={sc.fillMain} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            <circle cx="100" cy="126" r="10" fill="#60a5fa" opacity="0.8" stroke="currentColor" strokeWidth="1" />
            <circle cx="100" cy="126" r="4" fill="#fff" />

            {/* Visor flyscreen */}
            <path d="M 78 88 L 100 70 L 122 88 Z" className={sc.fillSecondary} stroke="currentColor" strokeWidth="1" />

            {/* Handlebars */}
            <path d="M 40 90 L 100 96 L 160 90" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray={strokeDash} />
            <rect x="34" y="86" width="14" height="8" rx="2" className={sc.fillTire} />
            <rect x="152" y="86" width="14" height="8" rx="2" className={sc.fillTire} />

            {/* Mirrors Left & Right */}
            <path d="M 52 91 L 35 62 M 35 62 L 15 65 L 22 75 Z" className={sc.fillSecondary} stroke="currentColor" strokeWidth="1.5" />
            <path d="M 148 91 L 165 62 M 165 62 L 185 65 L 178 75 Z" className={sc.fillSecondary} stroke="currentColor" strokeWidth="1.5" />

            {/* Flaring Tank Shrouds (Wings) */}
            <path d="M 72 120 L 45 165 L 72 155 Z" className={sc.fillSecondary} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            <path d="M 128 120 L 155 165 L 128 155 Z" className={sc.fillSecondary} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />

            {/* Oil cooler radiator screen */}
            <rect x="82" y="160" width="36" height="28" rx="2" className={sc.fillFrame} stroke="currentColor" strokeWidth="1" />
            <line x1="84" y1="167" x2="116" y2="167" stroke="currentColor" strokeWidth="1.5" />
            <line x1="84" y1="174" x2="116" y2="174" stroke="currentColor" strokeWidth="1.5" />
            <line x1="84" y1="181" x2="116" y2="181" stroke="currentColor" strokeWidth="1.5" />

            {/* Underbelly Pan bottom detail */}
            <path d="M 76 210 L 124 210 L 115 224 L 85 224 Z" className={sc.fillMain} stroke="currentColor" strokeWidth="1" />
          </svg>
        );

      case "rear":
        return (
          <svg className="w-full h-full block" viewBox="0 0 200 350" fill="none">
            {/* Rear Tire (Wide profile) */}
            <rect x="80" y="210" width="40" height="120" rx="16" className={sc.fillTire} stroke="currentColor" strokeWidth="4" strokeDasharray={strokeDash} />
            <rect x="88" y="240" width="24" height="60" rx="3" className={sc.fillSecondary} />

            {/* Tail Cowl */}
            <path d="M 76 100 L 124 100 L 118 135 L 82 135 Z" className={sc.fillMain} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />

            {/* Split Grab Rails (Sporty horns) */}
            <path d="M 68 95 L 84 80 L 80 100 Z" className={sc.fillFrame} stroke="currentColor" strokeWidth="1.5" />
            <path d="M 132 95 L 116 80 L 120 100 Z" className={sc.fillFrame} stroke="currentColor" strokeWidth="1.5" />

            {/* LED Taillight */}
            <rect x="86" y="98" width="28" height="6" rx="2" fill="#ef4444" />

            {/* Passenger Seat */}
            <path d="M 78 88 L 122 88 L 118 100 L 82 100 Z" className={sc.fillSecondary} stroke="currentColor" strokeWidth={sc.strokeWidth} />

            {/* License Plate Bracket (Rabeta) */}
            <rect x="94" y="135" width="12" height="45" className={sc.fillFrame} />
            <rect x="82" y="152" width="36" height="26" fill="#fff" stroke="currentColor" strokeWidth="1.5" />
            <line x1="86" y1="156" x2="114" y2="156" stroke="#b91c1c" strokeWidth="2" />
            <rect x="90" y="162" width="20" height="12" fill="#d4d4d8" />

            {/* Indicator Blinkers */}
            <line x1="64" y1="144" x2="94" y2="144" stroke="currentColor" strokeWidth="3" />
            <line x1="106" y1="144" x2="136" y2="144" stroke="currentColor" strokeWidth="3" />
            <circle cx="62" cy="144" r="3" fill="#f59e0b" />
            <circle cx="138" cy="144" r="3" fill="#f59e0b" />

            {/* Chain guard */}
            <rect x="68" y="210" width="10" height="70" rx="2" className={sc.fillTire} stroke="currentColor" strokeWidth="1" />

            {/* Exhaust Silencer (Angled on the right) */}
            <rect x="124" y="195" width="22" height="75" rx="3" transform="rotate(-15 124 195)" className={sc.fillAccent} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            <circle cx="138" cy="200" r="5" fill="#18181b" />
          </svg>
        );

      case "top":
        return (
          <svg className="w-full h-full block" viewBox="0 0 200 400" fill="none">
            {/* Front Wheel */}
            <rect x="92" y="15" width="16" height="60" rx="8" className={sc.fillTire} stroke="currentColor" strokeWidth="2" strokeDasharray={strokeDash} />

            {/* Front Mudguard */}
            <rect x="90" y="45" width="20" height="40" rx="4" className={sc.fillMain} stroke="currentColor" strokeWidth="1" />

            {/* Handlebars */}
            <path d="M 40 85 L 100 90 L 160 85" stroke="currentColor" strokeWidth="5" fill="none" strokeDasharray={strokeDash} />
            <rect x="32" y="81" width="14" height="8" rx="2" className={sc.fillTire} />
            <rect x="154" y="81" width="14" height="8" rx="2" className={sc.fillTire} />
            
            {/* Mirrors */}
            <path d="M 45 85 L 30 65 L 12 68 Z" className={sc.fillSecondary} stroke="currentColor" strokeWidth="1" />
            <path d="M 155 85 L 170 65 L 188 68 Z" className={sc.fillSecondary} stroke="currentColor" strokeWidth="1" />

            {/* Instrument display screen */}
            <rect x="90" y="78" width="20" height="11" rx="2" className={sc.fillAccent} stroke="currentColor" strokeWidth="1" />

            {/* Fuel Tank (Sleeker and narrower) */}
            <path d="M 75 105 C 70 145, 68 185, 80 215 L 120 215 C 132 185, 130 145, 125 105 Z" className={sc.fillMain} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            
            {/* Tank Shrouds (Left & Right) */}
            <path d="M 75 112 L 48 148 L 72 172 Z" className={sc.fillSecondary} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            <path d="M 125 112 L 152 148 L 128 172 Z" className={sc.fillSecondary} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />

            {/* Fuel cap */}
            <circle cx="100" cy="140" r="10" className={sc.fillAccent} stroke="currentColor" strokeWidth="1" />
            <circle cx="100" cy="140" r="4" fill="currentColor" />

            {/* Continuous Saddle Seat (Rider scoop & passenger block) */}
            <path d="M 78 215 C 75 235, 75 265, 80 282 L 120 282 C 125 265, 25 235, 122 215 Z" className={sc.fillTire} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />
            <path d="M 80 282 C 78 305, 80 332, 85 342 L 115 342 C 120 332, 122 305, 120 282 Z" className={sc.fillTire} stroke="currentColor" strokeWidth={sc.strokeWidth} strokeDasharray={strokeDash} />

            {/* Grab Rails (flanking passenger seat) */}
            <path d="M 72 292 L 68 335 L 82 338 L 84 310 Z" className={sc.fillFrame} stroke="currentColor" strokeWidth="1" />
            <path d="M 128 292 L 132 335 L 118 338 L 116 310 Z" className={sc.fillFrame} stroke="currentColor" strokeWidth="1" />

            {/* Rear Wheel (Wide, partially under tail) */}
            <rect x="90" y="335" width="20" height="52" rx="8" className={sc.fillTire} stroke="currentColor" strokeWidth="2" strokeDasharray={strokeDash} />

            {/* Taillight LED */}
            <rect x="92" y="348" width="16" height="4" fill="#ef4444" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-zinc-500 animate-spin" style={{ animationDuration: '6s' }} />
            Mapeamento Visual de Avarias
            <span className="text-[9px] font-extrabold bg-zinc-50 border border-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded tracking-widest uppercase">
              2D Multi-Perspectiva
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-1 font-semibold">
            {readOnly 
              ? "Diagrama de avarias estéticas/estruturais registradas na vistoria." 
              : "Escolha a perspectiva e clique na imagem para registrar a avaria no local exato."}
          </p>
        </div>

        {/* Legend status indicators */}
        <div className="flex gap-4 text-xs font-semibold select-none">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-500 border border-amber-400 shadow-[0_0_6px_#f59e0b] animate-pulse" />
            <span className="text-zinc-500">Riscado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500 border border-red-400 shadow-[0_0_6px_#ef4444] animate-ping" style={{ animationDuration: '1.5s' }} />
            <span className="text-zinc-500">Quebrado</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Canvas Area Container */}
        <div className="lg:col-span-2 relative bg-white rounded-2xl border border-zinc-150 overflow-hidden shadow-md flex flex-col justify-between">
          
          {/* Quick HUD controls overlay (Top Header Inside Canvas) */}
          <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
            
            {/* View presets */}
            <div className="flex gap-1 bg-white/90 backdrop-blur-sm border border-zinc-200 p-1 rounded-lg pointer-events-auto shadow-sm">
              {[
                { key: "left", label: "Esq" },
                { key: "right", label: "Dir" },
                { key: "front", label: "Front" },
                { key: "rear", label: "Tras" },
                { key: "top", label: "Topo" },
              ].map((view) => (
                <button
                  key={view.key}
                  type="button"
                  onClick={() => {
                    setPerspective(view.key as any);
                    setActiveHotspot(null);
                  }}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${
                    perspective === view.key
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100"
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>

            {/* Reset selection / view */}
            <button
              type="button"
              onClick={() => {
                setPerspective("left");
                setActiveHotspot(null);
              }}
              className="p-1.5 bg-white/90 backdrop-blur-sm border border-zinc-200 hover:border-zinc-350 text-zinc-500 hover:text-zinc-800 rounded-lg transition-colors pointer-events-auto shadow-sm"
              title="Voltar ao Padrão (Esq)"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Interactive Tutorial Tip */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center bg-white/70 border border-zinc-200/50 px-3.5 py-1 rounded-full text-[10px] font-bold text-zinc-500 tracking-wide backdrop-blur-[1px] opacity-80">
            {readOnly ? "Diagrama Vetorial" : "Clique em qualquer ponto do diagrama para registrar a avaria"}
          </div>

          {/* 2D Schematic Interactive Area */}
          <div className={`w-full h-[360px] flex items-center justify-center p-8 rounded-2xl relative select-none transition-colors duration-300 ${sc.background}`}>
            
            {/* Render selected perspective SVG + Hotspots Overlay */}
            <div 
              onClick={handleContainerClick}
              style={{
                position: "relative",
                height: "100%",
                aspectRatio: perspective === "front" || perspective === "rear" 
                  ? "200/350" 
                  : perspective === "top" 
                    ? "200/400" 
                    : "400/300",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: readOnly ? "default" : "crosshair",
              }}
              className={`transition-all duration-300 ${sc.textColor}`}
            >
              {renderMotorcycleSVG()}

              {/* Clickable 2D Hotspots Overlay */}
              {(() => {
                // Show pending point if not saved yet
                const pendingPoint = activeHotspot && !damagePoints.some(d => d.partId === activeHotspot.id) ? {
                  partId: activeHotspot.id,
                  partName: partNameInput || activeHotspot.name,
                  type: damageType,
                  description: description,
                  x: parseFloat(activeHotspot.left),
                  y: parseFloat(activeHotspot.top),
                  perspective: perspective,
                  isPending: true
                } : null;

                const displayPoints: (DamagePoint & { x: number; y: number; perspective: string; isPending?: boolean })[] = damagePoints
                  .map(p => {
                    const info = getPointDisplayInfo(p);
                    if (!info) return null;
                    return {
                      ...p,
                      x: info.x,
                      y: info.y,
                      perspective: info.perspective,
                      isPending: false
                    };
                  })
                  .filter((p): p is NonNullable<typeof p> => p !== null && p.perspective === perspective);

                if (pendingPoint) {
                  displayPoints.push(pendingPoint as any);
                }

                return displayPoints.map((point) => {
                  const isActive = activeHotspot?.id === point.partId;
                  
                  // Determine color class based on registered/pending damage type
                  let colorClass = "bg-blue-500 border-blue-200 text-white shadow-blue-500/50 hover:bg-blue-600 hover:scale-110";
                  let animationClass = "";

                  if (point.isPending) {
                    colorClass = "bg-zinc-650 border-zinc-450 text-white shadow-zinc-500/50 hover:scale-110 animate-pulse";
                    animationClass = "animate-ping";
                  } else if (point.type === "quebrado") {
                    colorClass = "bg-red-500 border-red-300 text-white shadow-red-500/80 hover:bg-red-600 animate-pulse scale-110";
                    animationClass = "animate-ping";
                  } else if (point.type === "riscado") {
                    colorClass = "bg-amber-500 border-amber-300 text-white shadow-amber-500/80 hover:bg-amber-600 hover:scale-110 scale-105";
                    animationClass = "animate-pulse";
                  }

                  return (
                    <div
                      key={point.partId}
                      style={{ top: `${point.y}%`, left: `${point.x}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-10 animate-fade-in"
                    >
                      {/* Pulsing halo ring */}
                      <div className={`absolute -inset-2.5 rounded-full border border-current opacity-40 pointer-events-none scale-100 ${animationClass} ${
                        point.isPending 
                          ? "text-zinc-500"
                          : point.type === "quebrado" 
                            ? "text-red-500" 
                            : "text-amber-500"
                      }`} />
                      
                      {/* Interactive Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const matchingPoint = damagePoints.find(d => d.partId === point.partId);
                          setActiveHotspot({
                            id: point.partId,
                            name: point.partName,
                            left: `${point.x}%`,
                            top: `${point.y}%`,
                          });
                          setPartNameInput(point.partName);
                          setDamageType(matchingPoint ? matchingPoint.type : "riscado");
                          setDescription(matchingPoint ? (matchingPoint.description || "") : "");
                        }}
                        className={`h-5 w-5 rounded-full border-2 text-[8px] font-extrabold flex items-center justify-center shadow-lg transition-all duration-300 pointer-events-auto ${colorClass} ${
                          isActive ? "ring-4 ring-offset-2 ring-zinc-500 scale-120" : ""
                        }`}
                        title={point.partName}
                      >
                        {point.isPending ? "+" : point.type === "quebrado" ? "Q" : "R"}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* 2D Popover Damage Edit Form Overlay */}
          {activeHotspot && (
            <div className="absolute z-40 bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md border border-zinc-200 p-4 rounded-xl shadow-2xl flex flex-col md:flex-row md:items-center gap-4 animate-fade-in text-zinc-800 shadow-zinc-200/50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-zinc-400" />
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    {readOnly ? "Avaria Registrada" : "Identificação da Avaria"} ({perspective.toUpperCase()})
                  </p>
                </div>
                {!readOnly ? (
                  <input
                    type="text"
                    value={partNameInput}
                    onChange={(e) => setPartNameInput(e.target.value)}
                    placeholder="Nome da peça/área (ex: Paralama)"
                    className="w-full mt-1.5 bg-zinc-50 border border-zinc-200 focus:border-zinc-350 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs font-bold text-zinc-850 placeholder-zinc-400 focus:outline-none transition-all"
                  />
                ) : (
                  <h4 className="text-sm font-extrabold text-zinc-955 mt-0.5">{activeHotspot.name}</h4>
                )}
                
                {/* Mode Selectors */}
                {!readOnly && (
                  <div className="flex items-center gap-4 mt-2.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-zinc-650">
                      <input
                        type="radio"
                        name="damageType2D"
                        checked={damageType === "riscado"}
                        onChange={() => setDamageType("riscado")}
                        className="accent-amber-500 h-4 w-4 cursor-pointer"
                      />
                      Riscado
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-zinc-650">
                      <input
                        type="radio"
                        name="damageType2D"
                        checked={damageType === "quebrado"}
                        onChange={() => setDamageType("quebrado")}
                        className="accent-red-500 h-4 w-4 cursor-pointer"
                      />
                      Quebrado
                    </label>
                  </div>
                )}

                {/* Read Only Details */}
                {readOnly && (
                  <div className="mt-2 text-xs">
                    {damagePoints.find(d => d.partId === activeHotspot.id) ? (
                      <div className="bg-zinc-50 border border-zinc-150 px-2.5 py-1.5 rounded-lg flex flex-col gap-1 shadow-sm">
                        <span className="font-bold flex items-center gap-1.5 text-zinc-850">
                          <span className={`h-2.5 w-2.5 rounded-full ${
                            damagePoints.find(d => d.partId === activeHotspot.id)?.type === "quebrado" ? "bg-red-500 animate-pulse" : "bg-amber-500"
                          }`} />
                          Partição Registrada: {damagePoints.find(d => d.partId === activeHotspot.id)?.type === "quebrado" ? "Quebrado" : "Riscado"}
                        </span>
                        {damagePoints.find(d => d.partId === activeHotspot.id)?.description && (
                          <p className="text-[11px] text-zinc-500 italic">
                            "{damagePoints.find(d => d.partId === activeHotspot.id)?.description}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-zinc-500 font-medium italic">Partição intacta. Nenhuma avaria registrada nesta área.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Description inputs */}
              {!readOnly ? (
                <div className="flex-[2] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="Observação detalhada (ex: risco superficial de 3cm)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex-1 bg-zinc-50 border border-zinc-200 focus:border-zinc-350 focus:bg-white rounded-lg px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none transition-all"
                  />
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSaveDamage}
                      className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold rounded-lg px-3.5 py-2 text-xs transition-all shrink-0 cursor-pointer shadow-md"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDamage(activeHotspot.id)}
                      className="bg-zinc-50 hover:bg-zinc-100 hover:text-red-600 active:scale-95 border border-zinc-200 text-zinc-650 font-bold rounded-lg px-3.5 py-2 text-xs transition-all shrink-0 cursor-pointer"
                    >
                      Limpar
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveHotspot(null)}
                      className="bg-transparent hover:bg-zinc-50 active:scale-95 text-zinc-450 hover:text-zinc-600 rounded-lg px-2.5 py-2 text-xs transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveHotspot(null)}
                  className="bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold rounded-lg px-4 py-2 text-xs transition-colors cursor-pointer border border-zinc-200"
                >
                  Fechar Detalhes
                </button>
              )}
            </div>
          )}
        </div>

        {/* Registered Damage List (Sidebar Panel) */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-md h-[360px] flex flex-col overflow-hidden">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5 border-b border-zinc-50 pb-2">
            <span>Avarias Registradas ({damagePoints.length})</span>
          </h4>
          
          {damagePoints.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
              <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm mb-3">
                <CheckCircle2 className="h-6 w-6 animate-bounce" style={{ animationDuration: '3s' }} />
              </div>
              <p className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider">Moto Intacta</p>
              <p className="text-[10px] text-zinc-400 font-semibold mt-1 max-w-[180px] leading-relaxed">
                Nenhum sinal de dano ou avaria registrado nesta motocicleta.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin">
              {damagePoints.map((point) => (
                <div
                  key={point.partId}
                  onClick={() => handleSelectDamageFromList(point.partId)}
                  className={`flex items-start justify-between p-3 rounded-xl border transition-all text-xs cursor-pointer ${
                    point.type === "riscado"
                      ? "bg-amber-50/40 border-amber-100 hover:bg-amber-50 hover:border-amber-200 shadow-sm"
                      : "bg-red-50/40 border-red-100 hover:bg-red-50 hover:border-red-200 shadow-sm"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 font-bold text-zinc-900 mb-0.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 shadow-sm ${
                          point.type === "riscado" ? "bg-amber-500" : "bg-red-500 animate-pulse"
                        }`}
                      />
                      <span className="truncate">{point.partName}</span>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                      {point.type === "riscado" ? "Riscado" : "Quebrado"}
                    </p>
                    {point.description ? (
                      <p className="text-[10px] text-zinc-650 bg-white/70 border border-zinc-150 px-2 py-1.5 rounded-lg italic leading-relaxed break-words">
                        "{point.description}"
                      </p>
                    ) : (
                      <p className="text-[10px] text-zinc-400 italic font-medium px-2 py-0.5">Sem observações.</p>
                    )}
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // prevent clicking from focusing/setting perspective
                        handleRemoveDamage(point.partId);
                      }}
                      className="text-zinc-300 hover:text-red-500 hover:bg-red-50/80 p-1.5 rounded-lg transition-all shrink-0 cursor-pointer"
                      title="Excluir avaria"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  {readOnly && (
                    <span className="text-zinc-350 hover:text-zinc-500 p-1 transition-colors shrink-0">
                      <ChevronRight className="h-4 w-4" />
                    </span>
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
