import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, RotateCcw, Save, Trash2, Info } from 'lucide-react';

// ── TYPES ──
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  isFoam: boolean;
  foamAge: number;
  hue: number;
  alpha: number;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  life: number;
  vx: number;
  vy: number;
}

interface SteamPuff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
}

interface SimState {
  running: boolean;
  depth: number;
  angle: number;
  temp: number;
  time: number;
  MAX_TIME: number;
  vortexAngle: number;
  vortexSpeed: number;
  airPct: number;
  homoPct: number;
  currentTemp: number;
  score: number;
  particles: Particle[];
  bubbles: Bubble[];
  foamCells: any[]; // Unused in original but present in S
  steamPuffs: SteamPuff[];
}

interface HistoryEntry {
  n: number;
  score: number;
  grade: string;
  tex: string;
  depth: number;
  angle: number;
  temp: number;
  air: number;
  homo: number;
  ctemp: number;
  ts: string;
}

// ── CONSTANTS ──
const CW = 340;
const CH = 340;
const CR = 170;

export const MilkFrothingSimulator: React.FC = () => {
  // ── REFS ──
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wandVizRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  // ── STATE (Mutable for physics loop) ──
  const S = useRef<SimState>({
    running: false,
    depth: 30,
    angle: 45,
    temp: 65,
    time: 0,
    MAX_TIME: 35,
    vortexAngle: 0,
    vortexSpeed: 0,
    airPct: 0,
    homoPct: 0,
    currentTemp: 20,
    score: 0,
    particles: [],
    bubbles: [],
    foamCells: [],
    steamPuffs: [],
  });

  // ── REACT STATE (For UI updates) ──
  const [uiState, setUiState] = useState({
    running: false,
    depth: 30,
    angle: 45,
    targetTemp: 65,
    currentTemp: 20,
    airPct: 0,
    homoPct: 0,
    vortexSpeed: 0,
    time: 0,
    score: 0,
    phase: 0, // 0: Heat, 1: Air, 2: Integrate
    history: [] as HistoryEntry[],
    toast: { msg: '', show: false },
    texBadge: 'Configura y comienza',
    tipBox: 'Ajusta profundidad, ángulo y temperatura. Pulsa Iniciar.'
  });

  // ── HELPERS ──
  const showToast = useCallback((msg: string) => {
    setUiState(prev => ({ ...prev, toast: { msg, show: true } }));
    setTimeout(() => {
      setUiState(prev => ({ ...prev, toast: { ...prev.toast, show: false } }));
    }, 2800);
  }, []);

  const getWandPos = () => {
    const s = S.current;
    const na = s.angle / 70;
    const offsetR = (0.15 + na * 0.45) * (CR - 22);
    const a = Math.PI * 1.18;
    return {
      x: CR + offsetR * Math.cos(a),
      y: CR + offsetR * Math.sin(a),
      depth: s.depth / 100,
    };
  };

  const initParticles = useCallback(() => {
    const s = S.current;
    s.particles = [];
    for (let i = 0; i < 220; i++) {
      const r = Math.sqrt(Math.random()) * (CR - 20);
      const a = Math.random() * Math.PI * 2;
      s.particles.push({
        x: CR + r * Math.cos(a),
        y: CR + r * Math.sin(a),
        vx: 0, vy: 0,
        r: 2 + Math.random() * 2.5,
        isFoam: false,
        foamAge: 0,
        hue: 28 + Math.random() * 10,
        alpha: 0.4 + Math.random() * 0.3,
      });
    }
    s.bubbles = [];
    s.foamCells = [];
    s.steamPuffs = [];
    s.vortexAngle = 0;
    s.vortexSpeed = 0;
    s.airPct = 0;
    s.homoPct = 0;
    s.currentTemp = 20;
    s.score = 0;
    s.time = 0;
    
    // Sync UI
    setUiState(prev => ({
      ...prev,
      running: s.running,
      currentTemp: s.currentTemp,
      airPct: s.airPct,
      homoPct: s.homoPct,
      vortexSpeed: s.vortexSpeed,
      time: s.time,
      score: s.score,
      texBadge: 'Configura y comienza',
      tipBox: 'Ajusta profundidad, ángulo y temperatura. Pulsa Iniciar.'
    }));
  }, []);

  // ── DRAWING FUNCTIONS ──
  const drawWandViz = useCallback(() => {
    const canvas = wandVizRef.current;
    if (!canvas) return;
    const c = canvas.getContext('2d');
    if (!c) return;
    const s = S.current;
    
    const w = 180, h = 44;
    c.clearRect(0, 0, w, h);

    // Pitcher outline
    c.save();
    c.strokeStyle = 'rgba(0,0,0,0.3)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(20, 4); c.lineTo(20, 40);
    c.lineTo(160, 40); c.lineTo(160, 4);
    c.stroke();

    // Milk level
    const depthPx = 4 + (s.depth / 100) * 32;
    c.fillStyle = 'rgba(240,230,210,0.12)';
    c.fillRect(21, depthPx, 138, 40 - depthPx);

    // Wand
    const wand_x = 20 + (s.angle / 90) * 110;
    c.strokeStyle = '#8ab0c0';
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(wand_x, 2);
    c.lineTo(wand_x, depthPx);
    c.stroke();

    // Tip
    c.fillStyle = '#f0a030'; // Gold
    c.beginPath();
    c.arc(wand_x, depthPx, 3.5, 0, Math.PI * 2);
    c.fill();

    // Label
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.font = '7px monospace';
    c.fillText('superficie', 22, depthPx - 3);
    c.restore();
  }, []);

  const drawMainCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = S.current;

    ctx.clearRect(0, 0, CW, CH);

    // Jug BG
    ctx.beginPath();
    ctx.arc(CR, CR, CR - 15, 0, Math.PI * 2);
    ctx.fillStyle = '#f5f5f5';
    ctx.fill();

    // Milk
    const mg = ctx.createRadialGradient(CR, CR, 20, CR, CR, CR - 15);
    const warmth = Math.min((s.currentTemp - 20) / 80, 1);
    const l1 = `hsl(${30 + warmth * 5}, ${28 + warmth * 8}%, ${93 - warmth * 5}%)`;
    const l2 = `hsl(${28 + warmth * 4}, ${26 + warmth * 6}%, ${88 - warmth * 4}%)`;
    mg.addColorStop(0, l1);
    mg.addColorStop(1, l2);
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(CR, CR, CR - 18, 0, Math.PI * 2);
    ctx.fill();

    // Foam center
    const foamParticles = s.particles.filter(p => p.isFoam);
    if (foamParticles.length > 5) {
      const foamCount = foamParticles.length;
      const foamRadius = Math.min(40 + foamCount / 2, CR - 25);
      const foamGrad = ctx.createRadialGradient(CR, CR, 0, CR, CR, foamRadius);
      foamGrad.addColorStop(0, 'rgba(255,255,255,0.5)');
      foamGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = foamGrad;
      ctx.beginPath();
      ctx.arc(CR, CR, foamRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wand
    const w = getWandPos();
    const active = s.running;

    // Vortex lines
    if (s.vortexSpeed > 0.15) {
      const speed = s.vortexSpeed;
      const alpha = Math.min(speed / 4.5, 1) * 0.6; // Increased alpha for visibility
      const arms = 8; // More arms for denser spiral
      ctx.save();
      ctx.globalAlpha = alpha;
      for (let arm = 0; arm < arms; arm++) {
        const gradient = ctx.createLinearGradient(0, 0, CW, CH);
        gradient.addColorStop(0, 'rgba(255,255,255,0.8)'); // White
        gradient.addColorStop(1, 'rgba(255,255,255,0.1)'); // Transparent white
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const t = i / 100;
          const a = s.vortexAngle + arm * (Math.PI * 2 / arms) + t * Math.PI * 3.5;
          const r = t * (CR - 18) * 1.5; // Slightly larger spread
          // Use wand position (w.x, w.y) as the center of the vortex
          const x = w.x + r * Math.cos(a);
          const y = w.y + r * Math.sin(a);
          
          // Clamp to jug boundary visually
          const distFromCenter = Math.sqrt((x - CR)**2 + (y - CR)**2);
          if (distFromCenter < CR - 18) {
             if (i === 0) {
                ctx.moveTo(x, y);
             } else {
                ctx.lineTo(x, y);
             }
          } else {
             // Stop this arm when hitting wall to avoid artifacts
             break;
          }
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    if (active) {
      const gg = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, 36);
      gg.addColorStop(0, 'rgba(200,220,255,0.22)');
      gg.addColorStop(1, 'transparent');
      ctx.save();
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(w.x, w.y, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    const wx2 = w.x + 26, wy2 = w.y - 26;
    const wandGrad = ctx.createLinearGradient(w.x, w.y, wx2, wy2);
    wandGrad.addColorStop(0, '#6a8a9a');
    wandGrad.addColorStop(1, '#aac0cc');
    ctx.strokeStyle = wandGrad;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w.x, w.y);
    ctx.lineTo(wx2, wy2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(w.x, w.y, 6, 0, Math.PI * 2);
    const tipG = ctx.createRadialGradient(w.x - 1, w.y - 1, 0, w.x, w.y, 6);
    tipG.addColorStop(0, active ? '#d8eaf4' : '#8aa0ae');
    tipG.addColorStop(1, active ? '#6090a8' : '#5a7080');
    ctx.fillStyle = tipG;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Depth indicator
    const depthColor = w.depth < 0.45
      ? `rgba(80,180,255,${0.4 + w.depth * 0.5})`
      : `rgba(255,140,60,${0.4 + (w.depth - 0.45) * 0.8})`;
    ctx.beginPath();
    ctx.arc(w.x, w.y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = depthColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Rim
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(CR, CR, CR - 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

  }, []);

  // ── UPDATE LOOP ──
  const update = useCallback((dt: number) => {
    const s = S.current;
    if (!s.running) return;

    s.time += dt;

    const nd = s.depth / 100;
    const na = s.angle / 70;
    const nt = (s.temp - 20) / 80;
    const wand = getWandPos();

    // Physics (Simplified from original for brevity but keeping key logic)
    const angleEffect = Math.pow(Math.sin(na * Math.PI / 2), 1.3);
    const depthEffect = nd < 0.6 ? Math.pow(Math.sin(nd * Math.PI / 0.6), 0.7) : Math.max(0, 1 - (nd - 0.6) * 3);
    const targetVortex = angleEffect * depthEffect * 4.2;
    s.vortexSpeed += (targetVortex - s.vortexSpeed) * Math.min(dt * 1.8, 1);
    s.vortexAngle += s.vortexSpeed * dt;

    const surfaceProximity = nd < 0.45 ? Math.pow(1 - nd / 0.45, 1.5) : 0;
    const airRate = surfaceProximity * (0.25 + na * 0.75) * 0.018;
    const maxAir = nd < 0.12 ? 100 : nd < 0.30 ? 65 + (0.30 - nd) / 0.18 * 35 : nd < 0.50 ? 25 + (0.50 - nd) / 0.20 * 40 : 5;
    s.airPct = Math.min(s.airPct + airRate * 60, maxAir);

    const homoRate = s.vortexSpeed * 0.02;
    s.homoPct = Math.min(s.homoPct + homoRate, 100);

    const heatRate = nt * 3.0 + 0.3;
    s.currentTemp = Math.min(s.currentTemp + heatRate * dt, s.temp);

    // Score calculation
    const tScore = s.currentTemp >= 60 && s.currentTemp <= 68 ? 100
      : s.currentTemp < 60 ? Math.max(0, (s.currentTemp - 20) / 40 * 100)
      : Math.max(0, 100 - (s.currentTemp - 68) * 9);
    const aScore = s.airPct >= 25 && s.airPct <= 60 ? 100
      : s.airPct < 25 ? s.airPct / 25 * 100
      : Math.max(0, 100 - (s.airPct - 60) * 2.8);
    const hScore = s.homoPct;
    s.score = Math.round(tScore * 0.35 + aScore * 0.35 + hScore * 0.30);

    // Particles update (Simplified)
    s.particles.forEach(p => {
        // Just minimal movement for visual effect if vortex speed > 0
        if (s.vortexSpeed > 0) {
            const dx = p.x - CR;
            const dy = p.y - CR;
            const dist = Math.sqrt(dx*dx + dy*dy) + 0.1;
            const vf = s.vortexSpeed * 22 / (dist + 8);
            p.vx += (-dy / dist) * vf * dt;
            p.vy += (dx / dist) * vf * dt;
        }
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.x += p.vx;
        p.y += p.vy;
        
        // Foam logic
        if (surfaceProximity > 0.15 && !p.isFoam && Math.random() < 0.0015) {
            p.isFoam = true;
        }
    });

    // Auto-stop
    if (s.time >= s.MAX_TIME) {
      s.running = false;
      showToast('Tiempo completado — pulsa Guardar');
    }
  }, [showToast]);

  const loop = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = time;

    update(dt);
    drawMainCanvas();
    
    // Throttle UI updates to every 10 frames roughly (not strictly implemented here, but simple check)
    if (S.current.running || Math.random() < 0.1) {
        const s = S.current;
        // Determine texture text
        let tex = '—';
        let tip = '';
        if (!s.running && s.time === 0) {
            tex = 'Configura y comienza'; tip = 'Ajusta profundidad, ángulo y temperatura. Pulsa Iniciar.';
        } else if (s.airPct < 5) {
            tex = 'Leche sin textura'; tip = 'El wand está muy profundo. Súbelo hacia la superficie para incorporar aire.';
        } else if (s.airPct < 20 && s.homoPct < 30) {
            tex = 'Leche caliente'; tip = 'Muy poca incorporación de aire. Sube el wand y ajusta el ángulo para crear vórtice.';
        } else if (s.airPct >= 25 && s.airPct <= 60 && s.homoPct > 65 && s.currentTemp >= 60 && s.currentTemp <= 68) {
            tex = '✨ Microespuma sedosa'; tip = '¡Perfecto! Textura ideal para latte art. Mantén el vórtice constante.';
        } else if (s.airPct > 65) {
            tex = 'Espuma gruesa y seca'; tip = 'Exceso de aire. Baja el wand para que el vórtice integre la espuma existente.';
        } else if (s.currentTemp > 72) {
            tex = 'Leche sobrecocinada'; tip = 'Temperatura demasiado alta. Las proteínas se desnaturalizan, textura irrecuperable.';
        } else if (s.homoPct < 35) {
            tex = 'Sin integrar aún'; tip = 'El vórtice es débil. Ajusta el ángulo lateral para generar más rotación.';
        } else {
            tex = 'Texturización en curso…'; tip = 'Va bien. Mantén parámetros estables y deja que el vórtice integre.';
        }

        setUiState(prev => ({
            ...prev,
            running: s.running,
            currentTemp: s.currentTemp,
            airPct: s.airPct,
            homoPct: s.homoPct,
            vortexSpeed: s.vortexSpeed,
            time: s.time,
            score: s.score,
            texBadge: tex,
            tipBox: tip
        }));
    }

    requestRef.current = requestAnimationFrame(loop);
  }, [drawMainCanvas, update]);

  useEffect(() => {
    initParticles();
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [initParticles, loop]);

  // ── HANDLERS ──
  const toggleSim = () => {
    S.current.running = !S.current.running;
    setUiState(prev => ({ ...prev, running: S.current.running }));
  };

  const resetSim = () => {
    initParticles();
    drawWandViz(); // Redraw static viz
  };

  const saveAttempt = () => {
    if (S.current.time < 1) {
      showToast('Inicia la simulación primero');
      return;
    }
    const s = S.current;
    const score = s.score;
    const grade = score >= 85 ? 'S' : score >= 70 ? 'A' : score >= 50 ? 'B' : 'C';
    const newHistory: HistoryEntry = {
      n: uiState.history.length + 1,
      score,
      grade,
      tex: uiState.texBadge,
      depth: s.depth,
      angle: s.angle,
      temp: s.temp,
      air: Math.round(s.airPct),
      homo: Math.round(s.homoPct),
      ctemp: Math.round(s.currentTemp),
      ts: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
    };
    setUiState(prev => ({ ...prev, history: [newHistory, ...prev.history] }));
    showToast(`Intento guardado — ${grade} (${score}pts)`);
    initParticles();
  };

  const clearHistory = () => {
    if (window.confirm('¿Limpiar todo el historial?')) {
      setUiState(prev => ({ ...prev, history: [] }));
      showToast('Historial eliminado');
    }
  };

  // ── RENDER UI ──
  return (
    <div className="w-full max-w-5xl mx-auto p-4 pb-24 space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-stone-900 dark:text-stone-100">
            Texturización <span className="text-brand dark:text-brand-light">de Leche</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mt-1">
            Simulador · Vista semicenital
          </p>
        </div>
        <div className="px-3 py-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-500">
          Sesión · {uiState.history.length} intentos
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CONTROLS (Left) */}
        <div className="space-y-6 bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-stone-100 flex items-center gap-2">
            ⚙ Controles
          </h2>

          {/* Graphic Reference */}
          <div className="w-full">
             <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2 block">Referencia Gráfica</label>
             <canvas ref={wandVizRef} width={180} height={44} className="w-full h-11 block bg-stone-50 dark:bg-stone-950/50 rounded border border-stone-100 dark:border-stone-800" />
          </div>

          {/* Depth */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Profundidad</label>
              <span className="text-xs font-mono font-bold text-stone-900 dark:text-stone-100">{uiState.depth}%</span>
            </div>
            <input 
              type="range" min="5" max="95" 
              value={uiState.depth}
              onChange={(e) => {
                const v = +e.target.value;
                S.current.depth = v;
                setUiState(prev => ({ ...prev, depth: v }));
                drawWandViz();
              }}
              className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-brand"
            />
            <p className="text-[9px] text-stone-400 leading-tight">Boquilla cerca de superficie → aire. Profundo → solo calienta.</p>
          </div>

          {/* Angle */}
          <div className="space-y-2">
             <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Ángulo</label>
              <span className="text-xs font-mono font-bold text-stone-900 dark:text-stone-100">{uiState.angle}°</span>
            </div>
            {/* Canvas moved up */}
            <input 
              type="range" min="0" max="70" 
              value={uiState.angle}
              onChange={(e) => {
                const v = +e.target.value;
                S.current.angle = v;
                setUiState(prev => ({ ...prev, angle: v }));
                drawWandViz();
              }}
              className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-brand"
            />
             <p className="text-[9px] text-stone-400 leading-tight">Controla el vórtice. Lateral = mayor velocidad.</p>
          </div>

          {/* Temp */}
          <div className="space-y-2">
             <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Temperatura Obj.</label>
              <span className="text-xs font-mono font-bold text-stone-900 dark:text-stone-100">{uiState.targetTemp}°C</span>
            </div>
            <input 
              type="range" min="20" max="100" 
              value={uiState.targetTemp}
              onChange={(e) => {
                const v = +e.target.value;
                S.current.temp = v;
                setUiState(prev => ({ ...prev, targetTemp: v }));
              }}
              className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-brand"
            />
             <p className="text-[9px] text-stone-400 leading-tight">Ideal 60–68°C. &gt;70°C quema la leche.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button 
              onClick={toggleSim}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all ${
                uiState.running 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-brand text-white hover:bg-brand-dark'
              }`}
            >
              {uiState.running ? '⏹ Detener' : <><Play className="w-3 h-3" /> Iniciar</>}
            </button>
            <button 
              onClick={saveAttempt}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold uppercase tracking-wider text-[10px] hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
            >
              <Save className="w-3 h-3" /> Guardar
            </button>
          </div>
           <button 
              onClick={resetSim}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 font-bold uppercase tracking-wider text-[9px] transition-all"
            >
              <RotateCcw className="w-3 h-3" /> Reiniciar sin guardar
            </button>
        </div>

        {/* CANVAS (Center) */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
             <canvas 
                ref={canvasRef} 
                width={CW} height={CH} 
                className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] rounded-full shadow-2xl touch-none"
                onPointerDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    // Check if near wand
                    const w = getWandPos();
                    const dist = Math.sqrt((x - w.x)**2 + (y - w.y)**2);
                    if (dist < 40) {
                        e.currentTarget.setPointerCapture(e.pointerId);
                        // dragging logic could go here
                    }
                }}
                onPointerMove={(e) => {
                    if (e.buttons > 0 && S.current.running) {
                         const rect = e.currentTarget.getBoundingClientRect();
                         const y = e.clientY - rect.top;
                         const depth = Math.max(5, Math.min(95, (y / rect.height) * 100));
                         S.current.depth = depth;
                         setUiState(prev => ({...prev, depth: Math.round(depth)}));
                    }
                }}
             />
             {/* Overlay info */}
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-mono">
                {Math.round(uiState.time)}s
             </div>
          </div>
          
          <div className="w-full max-w-[340px] bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
             <div 
                className="h-full bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 transition-all duration-200 ease-linear"
                style={{ width: `${(uiState.time / S.current.MAX_TIME) * 100}%` }}
             />
          </div>
        </div>

        {/* METRICS (Right) */}
        <div className="space-y-6 bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
           <h2 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-stone-100 flex items-center gap-2">
            📊 Análisis en vivo
          </h2>

          <div className="bg-stone-100 dark:bg-stone-950 rounded-xl p-4 text-center space-y-1 relative overflow-hidden">
             <div className="text-4xl font-black text-stone-900 dark:text-stone-100">{uiState.score}</div>
             <div className="text-[9px] font-bold uppercase tracking-widest text-stone-500">Puntuación</div>
          </div>

          <div className="text-center font-serif text-lg italic text-brand dark:text-brand-light">
             {uiState.texBadge}
          </div>

          {/* Bars */}
          <div className="space-y-4">
             {[
                { label: 'Aire', val: uiState.airPct, color: 'bg-blue-500' },
                { label: 'Homogeneidad', val: uiState.homoPct, color: 'bg-yellow-500' },
                { label: 'Temperatura', val: ((uiState.currentTemp-20)/80)*100, color: uiState.currentTemp > 68 ? 'bg-red-500' : 'bg-green-500', text: Math.round(uiState.currentTemp)+'°C' }
             ].map((m, i) => (
                <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-stone-500">
                        <span>{m.label}</span>
                        <span>{m.text || Math.round(m.val)+'%'}</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div className={`h-full ${m.color} transition-all duration-300`} style={{ width: `${Math.min(100, Math.max(0, m.val))}%` }} />
                    </div>
                </div>
             ))}
          </div>

          <div className="bg-stone-50 dark:bg-stone-950/50 p-3 rounded-lg border-l-2 border-brand text-[10px] text-stone-600 dark:text-stone-400 leading-relaxed">
             {uiState.tipBox}
          </div>
        </div>

      </div>

      {/* HISTORY */}
      <div className="pt-8 border-t border-stone-200 dark:border-stone-800">
         <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black uppercase tracking-tight text-stone-900 dark:text-stone-100">Historial</h2>
            {uiState.history.length > 0 && (
                <button onClick={clearHistory} className="text-red-500 hover:text-red-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Limpiar
                </button>
            )}
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {uiState.history.length === 0 ? (
                <div className="col-span-full py-8 text-center text-stone-400 text-xs italic">
                    Completa una sesión para ver tu historial aquí.
                </div>
            ) : (
                uiState.history.map((h) => (
                    <div key={h.n} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 relative overflow-hidden group hover:border-brand transition-colors">
                        <div className={`absolute top-0 left-0 right-0 h-1 ${h.grade === 'S' ? 'bg-green-500' : h.grade === 'A' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                        <div className="flex justify-between items-start mb-2">
                             <span className="text-[9px] font-bold text-stone-400 uppercase">#{h.n}</span>
                             <span className={`text-xs font-black ${h.grade === 'S' ? 'text-green-500' : 'text-stone-900 dark:text-stone-100'}`}>{h.grade}</span>
                        </div>
                        <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mb-1">{h.score}</div>
                        <p className="text-[9px] text-stone-500 truncate mb-2">{h.tex}</p>
                        <div className="space-y-0.5">
                             <div className="flex justify-between text-[8px] text-stone-400"><span>Temp</span><span>{h.ctemp}°</span></div>
                             <div className="flex justify-between text-[8px] text-stone-400"><span>Aire</span><span>{h.air}%</span></div>
                        </div>
                    </div>
                ))
            )}
         </div>
      </div>

      {/* TOAST */}
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-xl transition-all duration-300 z-50 ${uiState.toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {uiState.toast.msg}
      </div>

    </div>
  );
};
