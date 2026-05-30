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
import { toast } from "@/components/ui/toast";

interface MotorcycleDamageSelectorProps {
  damagePoints: DamagePoint[];
  onChange: (points: DamagePoint[]) => void;
  readOnly?: boolean;
}

interface Hotspot2D {
  id: string;
  name: string;
  top?: string;
  left?: string;
  polygon?: { x: number; y: number }[];
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

const isPointInPolygon = (x: number, y: number, polygon: { x: number; y: number }[]) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const getPolygonCentroid = (polygon: { x: number; y: number }[]) => {
  if (!polygon || polygon.length === 0) return null;
  let sumX = 0;
  let sumY = 0;
  polygon.forEach(pt => {
    sumX += pt.x;
    sumY += pt.y;
  });
  return {
    x: sumX / polygon.length,
    y: sumY / polygon.length
  };
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
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationData, setCalibrationData] = useState<Record<string, Hotspot2D[]>>(HOTSPOTS_BY_PERSPECTIVE);
  const [calibrationActiveIndex, setCalibrationActiveIndex] = useState(0);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [newCustomPartName, setNewCustomPartName] = useState("");

  // States for freehand pencil drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<{ x: number; y: number } | null>(null);

  const handleSavePolygon = () => {
    if (currentPath.length < 3) {
      toast.error("Desenhe pelo menos 3 pontos para formar um polígono.");
      return;
    }
    const currentList = calibrationData[perspective] || [];
    const updatedList = currentList.map((h, i) => {
      if (i === calibrationActiveIndex) {
        return {
          ...h,
          polygon: currentPath,
          left: undefined,
          top: undefined
        };
      }
      return h;
    });
    setCalibrationData({
      ...calibrationData,
      [perspective]: updatedList
    });
    setCurrentPath([]);
    if (calibrationActiveIndex < currentList.length - 1) {
      setCalibrationActiveIndex(calibrationActiveIndex + 1);
    }
    toast.success("Área salva com sucesso!");
  };

  const handleClearDrawing = () => {
    setCurrentPath([]);
    const currentList = calibrationData[perspective] || [];
    const updatedList = currentList.map((h, i) => {
      if (i === calibrationActiveIndex) {
        return {
          ...h,
          polygon: undefined,
          left: undefined,
          top: undefined
        };
      }
      return h;
    });
    setCalibrationData({
      ...calibrationData,
      [perspective]: updatedList
    });
    toast.success("Área e desenho limpos.");
  };

  const handleAddCustomPartToCalibrate = () => {
    if (!newCustomPartName.trim()) return;
    const newId = `custom_part_${Date.now()}`;
    const newPart: Hotspot2D = {
      id: newId,
      name: newCustomPartName.trim(),
    };
    const currentList = calibrationData[perspective] || [];
    const updatedData = {
      ...calibrationData,
      [perspective]: [...currentList, newPart]
    };
    setCalibrationData(updatedData);
    setCalibrationActiveIndex(currentList.length); 
    setCurrentPath([]);
    setNewCustomPartName("");
    toast.success(`Peça "${newPart.name}" adicionada à calibração!`);
  };

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
    for (const [pKey, list] of Object.entries(calibrationData)) {
      const match = list.find((h) => h.id === point.partId);
      if (match) {
        let xVal = 0;
        let yVal = 0;
        if (match.polygon && match.polygon.length > 0) {
          const ctr = getPolygonCentroid(match.polygon);
          if (ctr) {
            xVal = ctr.x;
            yVal = ctr.y;
          }
        } else if (match.left && match.top) {
          xVal = parseFloat(match.left);
          yVal = parseFloat(match.top);
        } else {
          continue;
        }
        return {
          x: xVal,
          y: yVal,
          perspective: pKey,
        };
      }
    }
    return null;
  };

  // Coordinates helper mapping pointer/touch Client relative coordinates
  const getRelativeCoordinates = (clientX: number, clientY: number, currentTarget: HTMLDivElement) => {
    const rect = currentTarget.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  // Drag-to-Draw (Freehand Pencil) event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCalibrating || readOnly) return;
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("label")) {
      return;
    }
    const { x, y } = getRelativeCoordinates(e.clientX, e.clientY, e.currentTarget);
    setIsDrawing(true);
    setHasDragged(false);
    setDragStartPoint({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCalibrating || !isDrawing || !dragStartPoint || readOnly) return;
    const { x, y } = getRelativeCoordinates(e.clientX, e.clientY, e.currentTarget);
    const lastPt = hasDragged && currentPath.length > 0 ? currentPath[currentPath.length - 1] : dragStartPoint;
    const dist = Math.hypot(x - lastPt.x, y - lastPt.y);
    
    // Smooth threshold (only add point if mouse dragged far enough from the last point)
    if (dist > 0.8) {
      if (!hasDragged) {
        setHasDragged(true);
        setCurrentPath([dragStartPoint, { x, y }]);
      } else {
        setCurrentPath((prev) => [...prev, { x, y }]);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCalibrating || !isDrawing || readOnly) return;
    setIsDrawing(false);
    if (!hasDragged && dragStartPoint) {
      // Single click behavior: append point to existing path
      setCurrentPath((prev) => [...prev, dragStartPoint]);
    }
    setDragStartPoint(null);
  };

  const handleMouseLeave = () => {
    if (!isCalibrating || !isDrawing || readOnly) return;
    setIsDrawing(false);
    if (!hasDragged && dragStartPoint) {
      setCurrentPath((prev) => [...prev, dragStartPoint]);
    }
    setDragStartPoint(null);
  };

  // Touch drawing support for mobile/tablet devices
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isCalibrating || readOnly || e.touches.length === 0) return;
    const touch = e.touches[0];
    const { x, y } = getRelativeCoordinates(touch.clientX, touch.clientY, e.currentTarget);
    setIsDrawing(true);
    setHasDragged(false);
    setDragStartPoint({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isCalibrating || !isDrawing || !dragStartPoint || readOnly || e.touches.length === 0) return;
    // Disable page scrolling while drawing
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    const { x, y } = getRelativeCoordinates(touch.clientX, touch.clientY, e.currentTarget);
    const lastPt = hasDragged && currentPath.length > 0 ? currentPath[currentPath.length - 1] : dragStartPoint;
    const dist = Math.hypot(x - lastPt.x, y - lastPt.y);

    if (dist > 0.8) {
      if (!hasDragged) {
        setHasDragged(true);
        setCurrentPath([dragStartPoint, { x, y }]);
      } else {
        setCurrentPath((prev) => [...prev, { x, y }]);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isCalibrating || !isDrawing || readOnly) return;
    setIsDrawing(false);
    if (!hasDragged && dragStartPoint) {
      setCurrentPath((prev) => [...prev, dragStartPoint]);
    }
    setDragStartPoint(null);
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;

    // Do nothing if the click is on an interactive element inside the container
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("label")) {
      return;
    }

    // Ignore normal clicks if calibrating since drawing events handle it
    if (isCalibrating) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Find if click falls inside any predefined polygon
    let matchedHotspot: Hotspot2D | null = null;
    const hotspots = calibrationData[perspective] || [];
    for (const h of hotspots) {
      if (h.polygon && h.polygon.length >= 3) {
        if (isPointInPolygon(x, y, h.polygon)) {
          matchedHotspot = h;
          break;
        } 
      }
    }

    // Fallback: closest centroid or top/left
    if (!matchedHotspot) {
      let minDistance = Infinity;
      for (const h of hotspots) {
        let hX = 0;
        let hY = 0;
        if (h.polygon && h.polygon.length > 0) {
          const ctr = getPolygonCentroid(h.polygon);
          if (ctr) {
            hX = ctr.x;
            hY = ctr.y;
          }
        } else if (h.left && h.top) {
          hX = parseFloat(h.left);
          hY = parseFloat(h.top);
        } else {
          continue;
        }
        const dist = Math.hypot(hX - x, hY - y);
        if (dist < minDistance) {
          minDistance = dist;
          matchedHotspot = h;
        }
      }
    }

    const suggestedName = matchedHotspot ? matchedHotspot.name : `Ponto na lateral ${perspective}`;
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
  // Helper to render real motorcycle images based on perspective
  const renderMotorcycleImage = () => {
    let imgPath = "";
    switch (perspective) {
      case "left":
        imgPath = "/modelo-moto-vistoria/scramber400xc-lado-esquerdo.jpg";
        break;
      case "right":
        imgPath = "/modelo-moto-vistoria/scramber400xc-lado-direito.jpg";
        break;
      case "front":
        imgPath = "/modelo-moto-vistoria/scramber400xc-lado-frente.jpg";
        break;
      case "rear":
        imgPath = "/modelo-moto-vistoria/scramber400xc-lado-tras.jpg";
        break;
      case "top":
        imgPath = "/modelo-moto-vistoria/scramber400xc-lado-topo.jpg";
        break;
    }
    return (
      <img
        src={imgPath}
        alt={`Perspectiva ${perspective}`}
        className="w-full h-full object-contain select-none pointer-events-none rounded-xl"
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-zinc-500" />
            Mapeamento Visual de Avarias
            <span className="text-[9px] font-extrabold bg-zinc-50 border border-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded tracking-widest uppercase">
              Foto Real Multi-Perspectiva
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-1 font-semibold">
            {readOnly 
              ? "Mapeamento de avarias estéticas/estruturais registradas na vistoria." 
              : "Escolha a perspectiva e clique na foto para registrar a avaria no local exato."}
          </p>
        </div>

        {/* Legend status indicators & Calibration mode toggle */}
        <div className="flex items-center gap-4 text-xs font-semibold select-none">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-500 border border-amber-400 shadow-[0_0_6px_#f59e0b] animate-pulse" />
            <span className="text-zinc-500">Riscado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500 border border-red-400 shadow-[0_0_6px_#ef4444] animate-ping" style={{ animationDuration: '1.5s' }} />
            <span className="text-zinc-500">Quebrado</span>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => {
                setIsCalibrating(!isCalibrating);
                setCalibrationActiveIndex(0);
              }}
              className={`ml-2 px-2.5 py-1 rounded-lg border text-[10px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
                isCalibrating 
                  ? "bg-purple-600 border-purple-500 text-white shadow-sm shadow-purple-500/50"
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              ⚙️ Calibrar
            </button>
          )}
        </div>
      </div>

      {isCalibrating && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-purple-950 space-y-3 animate-fade-in print:hidden">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>🔧 Calibração Visual por Desenho de Área (Polígonos)</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                setIsCalibrating(false);
                setCurrentPath([]);
              }}
              className="text-xs bg-purple-900 text-white font-bold rounded-lg px-2.5 py-1 hover:bg-purple-800 cursor-pointer"
            >
              Sair do Modo Calibração
            </button>
          </div>

          <div className="text-xs space-y-1 font-semibold">
            <p>
              Como desenhar a área de cada peça na foto:
            </p>
            <ol className="list-decimal pl-4 space-y-0.5 text-purple-800 text-[11px]">
              <li>Selecione a peça ativa na lista abaixo.</li>
              <li><strong>Desenho Livre (Lápis):</strong> Clique e arraste o mouse/dedo ao redor da peça na foto para traçar o contorno de forma contínua.</li>
              <li><strong>Clique a Clique:</strong> Se preferir, dê cliques pontuais ao redor da peça para traçar os vértices um a um.</li>
              <li>Após cobrir a peça por completo com o contorno, clique em <strong className="text-purple-950">"Confirmar Área"</strong> para salvá-lo.</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Hotspots list */}
            <div className="md:col-span-2 flex flex-col space-y-2">
              <div className="border border-purple-200 bg-white rounded-xl p-2.5 max-h-[180px] overflow-y-auto space-y-1">
                {(calibrationData[perspective] || []).map((h, i) => {
                  const isActive = i === calibrationActiveIndex;
                  const hasArea = h.polygon && h.polygon.length >= 3;
                  const pointsCount = h.polygon ? h.polygon.length : 0;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => {
                        setCalibrationActiveIndex(i);
                        setCurrentPath([]);
                      }}
                      className={`w-full text-left px-2 py-1 rounded text-xs font-bold flex justify-between items-center transition-colors ${
                        isActive 
                          ? "bg-purple-600 text-white" 
                          : "hover:bg-purple-100 text-purple-900"
                      }`}
                    >
                      <span>{i + 1}. {h.name}</span>
                      <span className="text-[10px] opacity-75 font-semibold">
                        {hasArea ? `🟢 ${pointsCount} pontos (Área Definida)` : "⚪ Não desenhado"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Add custom part input */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Nome de outra peça para adicionar..."
                  value={newCustomPartName}
                  onChange={(e) => setNewCustomPartName(e.target.value)}
                  className="flex-1 bg-white border border-purple-200 rounded-lg px-2.5 py-1 text-xs text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-purple-500 font-semibold"
                />
                <button
                  type="button"
                  onClick={handleAddCustomPartToCalibrate}
                  className="bg-purple-900 hover:bg-purple-800 text-white rounded-lg px-3 py-1 text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  + Add Peça
                </button>
              </div>
            </div>

            {/* Actions & JSON output */}
            <div className="flex flex-col justify-between space-y-2">
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={calibrationActiveIndex === 0}
                    onClick={() => {
                      setCalibrationActiveIndex(calibrationActiveIndex - 1);
                      setCurrentPath([]);
                    }}
                    className="flex-1 bg-purple-100 hover:bg-purple-200 disabled:opacity-40 text-purple-950 font-bold text-xs rounded-lg py-1.5 cursor-pointer text-center"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={calibrationActiveIndex >= (calibrationData[perspective] || []).length - 1}
                    onClick={() => {
                      setCalibrationActiveIndex(calibrationActiveIndex + 1);
                      setCurrentPath([]);
                    }}
                    className="flex-1 bg-purple-100 hover:bg-purple-200 disabled:opacity-40 text-purple-950 font-bold text-xs rounded-lg py-1.5 cursor-pointer text-center"
                  >
                    Próximo
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSavePolygon}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-lg py-2 cursor-pointer text-center shadow"
                  >
                    💾 Confirmar Área
                  </button>
                  <button
                    type="button"
                    onClick={handleClearDrawing}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-lg py-2 cursor-pointer text-center"
                  >
                    🗑️ Limpar
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(calibrationData, null, 2));
                  toast.success("JSON de Calibração copiado para a área de transferência!");
                }}
                className="w-full bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs rounded-lg py-2 cursor-pointer text-center"
              >
                Copiar JSON de Calibração
              </button>

              <div className="text-[9px] text-purple-700 italic leading-tight">
                Dica: Calibre os contornos das peças em todas as perspectivas e depois copie o JSON completo para nos enviar!
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start print:grid-cols-1 print:gap-6 print:break-inside-avoid">
        
        {/* Canvas Area Container */}
        <div className="lg:col-span-2 relative bg-white rounded-2xl border border-zinc-150 overflow-hidden shadow-md flex flex-col justify-between print:border-none print:shadow-none print:bg-transparent print:col-span-1">
          
          {/* Quick HUD controls overlay (Top Header Inside Canvas) */}
          <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none print:hidden">
            
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
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center bg-white/70 border border-zinc-200/50 px-3.5 py-1 rounded-full text-[10px] font-bold text-zinc-500 tracking-wide backdrop-blur-[1px] opacity-80 print:hidden">
            {readOnly ? "Imagem Real da Moto" : "Clique na foto da moto para registrar a avaria no local exato"}
          </div>

          {/* 2D Schematic Interactive Area */}
          <div className={`w-full h-[450px] flex items-center justify-center p-8 rounded-2xl relative select-none transition-colors duration-300 print:h-[260px] print:p-0 print:border-none print:shadow-none print:bg-transparent ${sc.background}`}>
            
            {/* Render selected perspective Real Image + Hotspots Overlay */}
            <div 
              onClick={handleContainerClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                position: "relative",
                width: "auto",
                height: "auto",
                maxWidth: "100%",
                maxHeight: "100%",
                aspectRatio: "2624/1632",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: readOnly ? "default" : "crosshair",
                touchAction: isCalibrating ? "none" : "auto",
              }}
              className={`transition-all duration-300 ${sc.textColor}`}
            >
              {renderMotorcycleImage()}

              {/* SVG overlay to render polygons during calibration or for debug */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                {/* Render already saved polygons for all hotspots of the current perspective */}
                {(calibrationData[perspective] || []).map((h, i) => {
                  if (!h.polygon || h.polygon.length < 2) return null;
                  const pointsString = h.polygon.map(p => `${p.x}%,${p.y}%`).join(" ");
                  const isActive = i === calibrationActiveIndex && isCalibrating;
                  return (
                    <polygon
                      key={h.id}
                      points={pointsString}
                      fill={isActive ? "rgba(168, 85, 247, 0.25)" : "rgba(168, 85, 247, 0.08)"}
                      stroke={isActive ? "#a855f7" : "rgba(168, 85, 247, 0.4)"}
                      strokeWidth="1.5"
                    />
                  );
                })}

                {/* Render current path being drawn */}
                {isCalibrating && currentPath.length > 0 && (
                  <>
                    {/* Render as a closed polygon with semi-transparent fill if we have >= 3 points */}
                    {currentPath.length >= 3 ? (
                      <polygon
                        points={currentPath.map(p => `${p.x}%,${p.y}%`).join(" ")}
                        fill="rgba(168, 85, 247, 0.15)"
                        stroke="#a855f7"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    ) : (
                      <polyline
                        points={currentPath.map(p => `${p.x}%,${p.y}%`).join(" ")}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    )}
                    {/* Render dots for path vertices (only if clicking point-by-point or few vertices to keep freehand drawing clean) */}
                    {(!hasDragged || currentPath.length < 15) && currentPath.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={`${pt.x}%`}
                        cy={`${pt.y}%`}
                        r="3.5"
                        fill="#a855f7"
                        stroke="#fff"
                        strokeWidth="1"
                      />
                    ))}
                  </>
                )}
              </svg>

              {/* If calibrating, render the current calibration pins or centroids */}
              {isCalibrating && (calibrationData[perspective] || []).map((h, i) => {
                let xVal = 0;
                let yVal = 0;
                if (h.polygon && h.polygon.length > 0) {
                  const ctr = getPolygonCentroid(h.polygon);
                  if (ctr) {
                    xVal = ctr.x;
                    yVal = ctr.y;
                  }
                } else if (h.left && h.top) {
                  xVal = parseFloat(h.left);
                  yVal = parseFloat(h.top);
                } else {
                  return null;
                }
                const isActive = i === calibrationActiveIndex;
                return (
                  <div
                    key={h.id}
                    style={{ top: `${yVal}%`, left: `${xVal}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                  >
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow ${
                      isActive ? "bg-purple-600 ring-2 ring-purple-300 scale-125" : "bg-purple-400 opacity-60"
                    }`}>
                      {i + 1}
                    </div>
                  </div>
                );
              })}

              {/* Clickable 2D Hotspots Overlay */}
              {(() => {
                // Show pending point if not saved yet
                const pendingPoint = activeHotspot && !damagePoints.some(d => d.partId === activeHotspot.id) ? {
                  partId: activeHotspot.id,
                  partName: partNameInput || activeHotspot.name,
                  type: damageType,
                  description: description,
                  x: activeHotspot.left ? parseFloat(activeHotspot.left) : 0,
                  y: activeHotspot.top ? parseFloat(activeHotspot.top) : 0,
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
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-md h-[450px] flex flex-col overflow-hidden print:border-none print:shadow-none print:h-auto print:p-0 print:overflow-visible">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5 border-b border-zinc-50 pb-2 print:text-zinc-500 print:border-zinc-100 print:mb-2">
            <span>Avarias Registradas ({damagePoints.length})</span>
          </h4>
          
          {damagePoints.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 print:bg-transparent print:border-none print:p-2">
              <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm mb-3 print:bg-emerald-105 print:shadow-none print:mb-1.5">
                <CheckCircle2 className="h-6 w-6 animate-bounce print:animate-none" style={{ animationDuration: '3s' }} />
              </div>
              <p className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider">Moto Intacta</p>
              <p className="text-[10px] text-zinc-400 font-semibold mt-1 max-w-[180px] leading-relaxed print:max-w-none">
                Nenhum sinal de dano ou avaria registrado nesta motocicleta.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin">
              {damagePoints.map((point) => (
                <div
                  key={point.partId}
                  onClick={() => handleSelectDamageFromList(point.partId)}
                  className={`flex items-start justify-between p-3 rounded-xl border transition-all text-xs cursor-pointer print:break-inside-avoid ${
                    point.type === "riscado"
                      ? "bg-amber-50/40 border-amber-100 hover:bg-amber-50 hover:border-amber-200 shadow-sm print:bg-transparent print:border-zinc-200 print:p-2.5"
                      : "bg-red-50/40 border-red-100 hover:bg-red-50 hover:border-red-200 shadow-sm print:bg-transparent print:border-zinc-200 print:p-2.5"
                  }`}
                >
                  <div className="min-w-0 pr-2 flex-1">
                    <div className="flex items-center gap-1.5 font-bold text-zinc-900 mb-0.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 shadow-sm print:shadow-none ${
                          point.type === "riscado" ? "bg-amber-500" : "bg-red-500 print:animate-none"
                        }`}
                      />
                      <span className="truncate">{point.partName}</span>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 print:mb-1">
                      {point.type === "riscado" ? "Riscado" : "Quebrado"}
                    </p>
                    {point.description ? (
                      <p className="text-[10px] text-zinc-650 bg-white/70 border border-zinc-150 px-2 py-1.5 rounded-lg italic leading-relaxed break-words print:bg-transparent print:border-none print:p-0 print:mt-1">
                        "{point.description}"
                      </p>
                    ) : (
                      <p className="text-[10px] text-zinc-400 italic font-medium px-2 py-0.5 print:px-0">Sem observações.</p>
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
