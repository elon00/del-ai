import React, { useRef, useEffect, useState, useCallback } from "react";
import { AutomatonTheme, AutomatonRule } from "../../types";
import { Pen, Eraser, Sparkles, ZoomIn, ZoomOut, Maximize2, Move } from "lucide-react";

interface ConwayCanvasProps {
  grid: Uint8Array;
  width: number;
  height: number;
  onCellClick: (row: number, col: number, brush: string) => void;
  onBatchCellsChange?: (cellsToSet: Array<{ row: number; col: number; state: number }>) => void;
  theme: AutomatonTheme;
  showHeatmap: boolean;
  activeBrush: "pen" | "eraser" | "glider" | "pulsar" | "spaceship" | "random-spray";
  setActiveBrush: (brush: "pen" | "eraser" | "glider" | "pulsar" | "spaceship" | "random-spray") => void;
}

export const ConwayCanvas: React.FC<ConwayCanvasProps> = ({
  grid,
  width,
  height,
  onCellClick,
  onBatchCellsChange,
  theme,
  showHeatmap,
  activeBrush,
  setActiveBrush,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pan and Zoom states
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null);

  // Cell color themes
  const themeColors: Record<AutomatonTheme, { bg: string; grid: string; alive: string[]; dead: string; cursor: string }> = {
    "cyber-matrix": {
      bg: "#050b08",
      grid: "rgba(16, 185, 129, 0.08)",
      alive: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#059669"],
      dead: "#050b08",
      cursor: "rgba(16, 185, 129, 0.4)",
    },
    "quantum-cyan": {
      bg: "#030712",
      grid: "rgba(6, 182, 212, 0.08)",
      alive: ["#06b6d4", "#22d3ee", "#67e8f9", "#a5f3fc", "#0891b2"],
      dead: "#030712",
      cursor: "rgba(6, 182, 212, 0.4)",
    },
    "bioluminescent": {
      bg: "#090514",
      grid: "rgba(236, 72, 153, 0.08)",
      alive: ["#ec4899", "#f43f5e", "#d946ef", "#a855f7", "#8b5cf6"],
      dead: "#090514",
      cursor: "rgba(236, 72, 153, 0.4)",
    },
    "amber-terminal": {
      bg: "#0c0800",
      grid: "rgba(245, 158, 11, 0.08)",
      alive: ["#f59e0b", "#fbbf24", "#fcd34d", "#fef3c7", "#d97706"],
      dead: "#0c0800",
      cursor: "rgba(245, 158, 11, 0.4)",
    },
    "monochrome-slate": {
      bg: "#090d16",
      grid: "rgba(148, 163, 184, 0.08)",
      alive: ["#cbd5e1", "#e2e8f0", "#f8fafc", "#94a3b8", "#64748b"],
      dead: "#090d16",
      cursor: "rgba(148, 163, 184, 0.4)",
    },
  };

  // Render loop
  const renderGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentTheme = themeColors[theme] || themeColors["cyber-matrix"];
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background fill
    ctx.fillStyle = currentTheme.bg;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Coordinate transformations
    ctx.translate(displayWidth / 2 + offset.x, displayHeight / 2 + offset.y);
    ctx.scale(scale, scale);

    const cellSize = Math.min(displayWidth / width, displayHeight / height) * 0.95;
    const startX = -(width * cellSize) / 2;
    const startY = -(height * cellSize) / 2;

    // Draw Grid background
    ctx.fillStyle = currentTheme.dead;
    ctx.fillRect(startX, startY, width * cellSize, height * cellSize);

    // Draw Cells
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const idx = r * width + c;
        const cellAge = grid[idx];
        const cellX = startX + c * cellSize;
        const cellY = startY + r * cellSize;

        if (cellAge > 0) {
          if (showHeatmap) {
            // Heatmap color interpolation
            const heatRatio = Math.min(cellAge / 25, 1);
            ctx.fillStyle = `hsl(${140 - heatRatio * 140}, 90%, 55%)`;
          } else {
            const colorIdx = Math.min(cellAge - 1, currentTheme.alive.length - 1);
            ctx.fillStyle = currentTheme.alive[colorIdx];
          }

          // Inset cell slightly for nice visual definition
          const gap = cellSize > 8 ? 1 : 0.5;
          ctx.fillRect(
            cellX + gap,
            cellY + gap,
            Math.max(1, cellSize - gap * 2),
            Math.max(1, cellSize - gap * 2)
          );
        }
      }
    }

    // Draw Grid Lines when zoomed in
    if (cellSize * scale > 7) {
      ctx.strokeStyle = currentTheme.grid;
      ctx.lineWidth = 1 / scale;
      ctx.beginPath();
      for (let c = 0; c <= width; c++) {
        const x = startX + c * cellSize;
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY + height * cellSize);
      }
      for (let r = 0; r <= height; r++) {
        const y = startY + r * cellSize;
        ctx.moveTo(startX, y);
        ctx.lineTo(startX + width * cellSize, y);
      }
      ctx.stroke();
    }

    // Highlight hovered cell / brush footprint
    if (hoverCell && hoverCell.r >= 0 && hoverCell.r < height && hoverCell.c >= 0 && hoverCell.c < width) {
      ctx.fillStyle = currentTheme.cursor;
      const hx = startX + hoverCell.c * cellSize;
      const hy = startY + hoverCell.r * cellSize;

      if (activeBrush === "pen" || activeBrush === "eraser") {
        ctx.fillRect(hx, hy, cellSize, cellSize);
      } else if (activeBrush === "glider") {
        const gliderOffsets = [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]];
        gliderOffsets.forEach(([dr, dc]) => {
          ctx.fillRect(hx + dc * cellSize, hy + dr * cellSize, cellSize, cellSize);
        });
      } else if (activeBrush === "pulsar") {
        ctx.strokeStyle = currentTheme.cursor;
        ctx.lineWidth = 2 / scale;
        ctx.strokeRect(hx - 3 * cellSize, hy - 3 * cellSize, 15 * cellSize, 15 * cellSize);
      } else if (activeBrush === "spaceship") {
        const ssOffsets = [[0, 1], [0, 4], [1, 5], [2, 1], [2, 5], [3, 2], [3, 3], [3, 4], [3, 5]];
        ssOffsets.forEach(([dr, dc]) => {
          ctx.fillRect(hx + dc * cellSize, hy + dr * cellSize, cellSize, cellSize);
        });
      }
    }

    ctx.restore();
  }, [grid, width, height, theme, showHeatmap, scale, offset, hoverCell, activeBrush]);

  useEffect(() => {
    renderGrid();
  }, [renderGrid]);

  // Convert mouse/touch canvas coords to grid [row, col]
  const getGridCoords = (e: React.MouseEvent<HTMLCanvasElement>): { r: number; c: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    const cellSize = Math.min(displayWidth / width, displayHeight / height) * 0.95;

    // Invert translation and scale
    const worldX = (clientX - (displayWidth / 2 + offset.x)) / scale;
    const worldY = (clientY - (displayHeight / 2 + offset.y)) / scale;

    const startX = -(width * cellSize) / 2;
    const startY = -(height * cellSize) / 2;

    const c = Math.floor((worldX - startX) / cellSize);
    const r = Math.floor((worldY - startY) / cellSize);

    if (r >= 0 && r < height && c >= 0 && c < width) {
      return { r, c };
    }
    return null;
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.shiftKey) {
      // Middle click or Shift+Click for panning
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    } else if (e.button === 0) {
      // Left click for drawing
      setIsDrawing(true);
      const coords = getGridCoords(e);
      if (coords) {
        onCellClick(coords.r, coords.c, activeBrush);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const coords = getGridCoords(e);
    setHoverCell(coords);

    if (isDrawing && coords) {
      if (activeBrush === "pen" || activeBrush === "eraser" || activeBrush === "random-spray") {
        onCellClick(coords.r, coords.c, activeBrush);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDrawing(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setScale((prev) => Math.max(0.5, Math.min(8.0, prev * zoomFactor)));
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col shadow-2xl">
      {/* Floating Canvas Action Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-1.5 p-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-lg text-xs">
        <button
          id="brush-pen"
          onClick={() => setActiveBrush("pen")}
          title="Single Cell Pen (Draw)"
          className={`p-2 rounded-lg transition-all ${
            activeBrush === "pen"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Pen className="h-4 w-4" />
        </button>

        <button
          id="brush-eraser"
          onClick={() => setActiveBrush("eraser")}
          title="Eraser (Kill cell)"
          className={`p-2 rounded-lg transition-all ${
            activeBrush === "eraser"
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Eraser className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-slate-800" />

        <button
          id="brush-glider"
          onClick={() => setActiveBrush("glider")}
          title="Stamp Glider (c/4 diagonal travel)"
          className={`px-2 py-1 rounded-lg font-medium transition-all ${
            activeBrush === "glider"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          + Glider
        </button>

        <button
          id="brush-spaceship"
          onClick={() => setActiveBrush("spaceship")}
          title="Stamp Lightweight Spaceship (LWSS)"
          className={`px-2 py-1 rounded-lg font-medium transition-all ${
            activeBrush === "spaceship"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          + LWSS
        </button>

        <button
          id="brush-spray"
          onClick={() => setActiveBrush("random-spray")}
          title="Quantum Particle Spray Brush"
          className={`p-2 rounded-lg transition-all ${
            activeBrush === "random-spray"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </div>

      {/* Floating Zoom & Pan Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5 p-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-lg text-xs">
        <button
          onClick={() => setScale((prev) => Math.min(8.0, prev * 1.25))}
          title="Zoom In"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => setScale((prev) => Math.max(0.5, prev * 0.8))}
          title="Zoom Out"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={resetView}
          title="Reset Zoom & Pan"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Main Canvas Viewport */}
      <div ref={containerRef} className="flex-1 w-full h-full cursor-crosshair relative">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full block"
        />
      </div>

      {/* Coordinate & Status Footer Bar */}
      <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <Move className="h-3.5 w-3.5 text-slate-500" />
            <span>Shift+Drag or Middle-Click to Pan</span>
          </span>
          <span>Zoom: {(scale * 100).toFixed(0)}%</span>
        </div>

        {hoverCell ? (
          <div className="font-mono text-emerald-400">
            Row: {hoverCell.r} | Col: {hoverCell.c} | State: {grid[hoverCell.r * width + hoverCell.c] > 0 ? "Alive (Age " + grid[hoverCell.r * width + hoverCell.c] + ")" : "Dead"}
          </div>
        ) : (
          <span className="text-slate-500 font-mono">Grid size: {width} x {height} ({width * height} cells)</span>
        )}
      </div>
    </div>
  );
};
