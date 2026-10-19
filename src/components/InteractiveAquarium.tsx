import React, { useState, useEffect, useRef } from 'react';
import {
  TankFishEntry,
  FishSpecies,
  AquascapeTheme,
  Language,
} from '../types';
import { FISH_SPECIES } from '../data/species';
import { FishIllustration } from './FishIllustration';
import { playBubbleSound, playFeedSplashSound } from '../utils/audio';
import {
  Sparkles,
  Sun,
  Moon,
  Palette,
  Info,
  Droplets,
  Layers,
} from 'lucide-react';

interface InteractiveAquariumProps {
  liters: number;
  fishEntries: TankFishEntry[];
  aquascape: AquascapeTheme;
  onAquascapeChange: (theme: AquascapeTheme) => void;
  onInspectSpecies: (species: FishSpecies) => void;
  lang: Language;
}

interface SimFish {
  uid: string;
  species: FishSpecies;
  x: number; // 5..95 percentage
  y: number; // 10..88 percentage
  vx: number;
  vy: number;
  facingRight: boolean;
  scale: number;
  phase: number;
}

interface FoodPellet {
  id: string;
  x: number;
  y: number;
}

interface BubbleParticle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
}

const BUBBLES: BubbleParticle[] = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: 8 + ((i * 7) % 84),
  size: 4 + (i % 4) * 3,
  duration: 4 + (i % 5),
  delay: (i * 0.7) % 4,
}));

export const InteractiveAquarium: React.FC<InteractiveAquariumProps> = ({
  liters,
  fishEntries,
  aquascape,
  onAquascapeChange,
  onInspectSpecies,
  lang,
}) => {
  const [nightMode, setNightMode] = useState(false);
  const [showZoneOverlay, setShowZoneOverlay] = useState(false);
  const [foodPellets, setFoodPellets] = useState<FoodPellet[]>([]);
  const [simFish, setSimFish] = useState<SimFish[]>([]);
  const tankRef = useRef<HTMLDivElement>(null);

  // Build simulated fish instances whenever fishEntries change
  useEffect(() => {
    const nextSim: SimFish[] = [];

    fishEntries.forEach(({ speciesId, count }) => {
      if (count <= 0) return;
      const species = FISH_SPECIES.find((s) => s.id === speciesId);
      if (!species) return;

      // Cap visual instances per species at 16 so screen stays smooth even with 30 tetras
      const visualCount = Math.min(count, 16);

      // Zone vertical range
      let yMin = 32;
      let yMax = 66;
      if (species.zone === 'top') {
        yMin = 13;
        yMax = 32;
      } else if (species.zone === 'bottom') {
        yMin = 72;
        yMax = 87;
      } else if (species.zone === 'all') {
        yMin = 25;
        yMax = 84;
      }

      // Base size scaling from species cm
      const baseScale = Math.max(0.65, Math.min(1.45, species.sizeCm / 5.5));

      for (let i = 0; i < visualCount; i++) {
        const startX = 12 + ((i * 19 + species.nameSv.length * 7) % 76);
        const startY = yMin + ((i * 13) % Math.max(1, yMax - yMin));
        const speed =
          species.visual.shape === 'snail'
            ? 0.03
            : species.visual.shape === 'shrimp'
            ? 0.1
            : species.zone === 'bottom'
            ? 0.12
            : 0.18 + (i % 3) * 0.04;

        nextSim.push({
          uid: `${species.id}-${i}`,
          species,
          x: startX,
          y: startY,
          vx: (i % 2 === 0 ? 1 : -1) * speed,
          vy: ((i % 3) - 1) * 0.03,
          facingRight: i % 2 === 0,
          scale: baseScale * (0.92 + (i % 3) * 0.06),
          phase: i * 1.1,
        });
      }
    });

    setSimFish(nextSim);
  }, [fishEntries]);

  // Animation loop for fish and food pellets
  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(50, now - lastTime) / 16.67;
      lastTime = now;

      setFoodPellets((prevPellets) => {
        if (prevPellets.length === 0) return prevPellets;
        return prevPellets
          .map((p) => ({
            ...p,
            y: p.y + 0.35 * dt,
            x: p.x + Math.sin(now * 0.004 + p.y) * 0.08,
          }))
          .filter((p) => p.y < 89);
      });

      setSimFish((prevFish) => {
        if (prevFish.length === 0) return prevFish;

        // Track group centroids for schooling species
        const centroids: Record<string, { x: number; y: number; count: number }> = {};
        prevFish.forEach((f) => {
          if (f.species.minGroupSize >= 6) {
            if (!centroids[f.species.id]) {
              centroids[f.species.id] = { x: 0, y: 0, count: 0 };
            }
            centroids[f.species.id].x += f.x;
            centroids[f.species.id].y += f.y;
            centroids[f.species.id].count += 1;
          }
        });

        Object.keys(centroids).forEach((k) => {
          centroids[k].x /= centroids[k].count;
          centroids[k].y /= centroids[k].count;
        });

        return prevFish.map((f) => {
          let { x, y, vx, vy, facingRight } = f;
          const sp = f.species;

          // Zone limits
          let yMin = 30;
          let yMax = 68;
          if (sp.zone === 'top') {
            yMin = 12;
            yMax = 33;
          } else if (sp.zone === 'bottom') {
            yMin = 73;
            yMax = 88;
          } else if (sp.zone === 'all') {
            yMin = 22;
            yMax = 86;
          }

          // Check if food is nearby
          let chasingFood = false;
          if (foodPellets.length > 0 && sp.visual.shape !== 'snail') {
            let nearest: FoodPellet | null = null;
            let bestDist = 999;
            for (const p of foodPellets) {
              const dist = Math.hypot(p.x - x, p.y - y);
              if (dist < bestDist && dist < 38) {
                bestDist = dist;
                nearest = p;
              }
            }
            if (nearest) {
              chasingFood = true;
              const dx = nearest.x - x;
              const dy = nearest.y - y;
              vx += Math.sign(dx) * 0.025 * dt;
              vy += Math.sign(dy) * 0.025 * dt;

              // Eat pellet if very close
              if (bestDist < 4.5) {
                const eatenId = nearest.id;
                setFoodPellets((curr) => curr.filter((item) => item.id !== eatenId));
              }
            }
          }

          // Gentle schooling pull if not chasing food
          if (!chasingFood && centroids[sp.id] && centroids[sp.id].count > 2) {
            const c = centroids[sp.id];
            vx += (c.x - x) * 0.0005 * dt;
            vy += (c.y - y) * 0.0006 * dt;
          }

          // Gentle vertical wave motion
          vy += Math.sin(now * 0.002 + f.phase) * 0.002 * dt;

          // Clamp speeds
          const maxVx = chasingFood ? 0.48 : sp.visual.shape === 'snail' ? 0.04 : 0.25;
          const maxVy = chasingFood ? 0.35 : 0.12;
          vx = Math.max(-maxVx, Math.min(maxVx, vx));
          vy = Math.max(-maxVy, Math.min(maxVy, vy));

          // Ensure horizontal movement doesn't stall
          if (Math.abs(vx) < 0.04 && sp.visual.shape !== 'snail') {
            vx = (facingRight ? 1 : -1) * 0.14;
          }

          x += vx * dt;
          y += vy * dt;

          // Wall turnarounds
          if (x < 6) {
            x = 6;
            vx = Math.abs(vx);
          } else if (x > 92) {
            x = 92;
            vx = -Math.abs(vx);
          }

          if (!chasingFood) {
            if (y < yMin) {
              y = yMin;
              vy = Math.abs(vy) * 0.6;
            } else if (y > yMax) {
              y = yMax;
              vy = -Math.abs(vy) * 0.6;
            }
          } else {
            y = Math.max(10, Math.min(88, y));
          }

          facingRight = vx >= 0;

          return {
            ...f,
            x,
            y,
            vx,
            vy,
            facingRight,
          };
        });
      });

      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [foodPellets]);

  const handleDropFood = (clientX?: number, clientY?: number) => {
    playFeedSplashSound();
    let baseX = 50;
    let baseY = 12;

    if (clientX !== undefined && clientY !== undefined && tankRef.current) {
      const rect = tankRef.current.getBoundingClientRect();
      baseX = Math.max(10, Math.min(90, ((clientX - rect.left) / rect.width) * 100));
      baseY = Math.max(8, Math.min(40, ((clientY - rect.top) / rect.height) * 100));
    }

    const newPellets: FoodPellet[] = Array.from({ length: 7 }, (_, i) => ({
      id: `food-${Date.now()}-${i}-${Math.random()}`,
      x: Math.max(8, Math.min(92, baseX + (i - 3) * 4)),
      y: baseY + (i % 3) * 2.5,
    }));

    setFoodPellets((prev) => [...prev.slice(-20), ...newPellets]);
  };

  // Background gradient per theme + day/night
  const getWaterGradient = () => {
    if (nightMode) {
      return 'from-[#040b24] via-[#071638] to-[#030918]';
    }
    switch (aquascape) {
      case 'amazonas':
        return 'from-[#083344] via-[#0e4158] to-[#082638]';
      case 'nature_planted':
        return 'from-[#064e3b] via-[#0f5257] to-[#062c30]';
      case 'treasure_reef':
        return 'from-[#0369a1] via-[#075985] to-[#0c4a6e]';
      case 'blackwater':
        return 'from-[#451a03] via-[#3b1c0a] to-[#1c0f06]';
    }
  };

  const themes: { id: AquascapeTheme; labelSv: string; labelEn: string }[] = [
    { id: 'nature_planted', labelSv: 'Grön Växt-Oas', labelEn: 'Lush Planted' },
    { id: 'amazonas', labelSv: 'Amazonas Flod', labelEn: 'Amazon River' },
    { id: 'treasure_reef', labelSv: 'Skattkista & Äventyr', labelEn: 'Kids’ Treasure' },
    { id: 'blackwater', labelSv: 'Rio Negro (Bärnsten)', labelEn: 'Blackwater' },
  ];

  return (
    <div className="bg-abyss-900/90 border border-cyan-500/25 rounded-3xl overflow-hidden shadow-2xl">
      {/* Top Control Bar (LED bar of the aquarium) */}
      <div className="px-4 sm:px-6 py-3 bg-abyss-950/90 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-extrabold">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>{liters} Liter</span>
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-300">
            {lang === 'sv'
              ? 'Levande Akvariesimulator — klicka på en fisk eller mata dem!'
              : 'Live Tank Simulator — tap any fish or drop food!'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Feed the fish button */}
          <button
            onClick={() => handleDropFood()}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 active:scale-95 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'sv' ? 'Mata fiskarna!' : 'Feed the Fish!'}</span>
          </button>

          {/* Show water zones overlay */}
          <button
            onClick={() => {
              playBubbleSound();
              setShowZoneOverlay(!showZoneOverlay);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              showZoneOverlay
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                : 'bg-abyss-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={lang === 'sv' ? 'Visa vattenskikt (Yta, Mitten, Botten)' : 'Show Water Zones'}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">
              {lang === 'sv' ? 'Vattenzoner' : 'Water Zones'}
            </span>
          </button>

          {/* Day / Night Moonlight toggle */}
          <button
            onClick={() => {
              playBubbleSound();
              setNightMode(!nightMode);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              nightMode
                ? 'bg-indigo-500/25 border-indigo-400 text-indigo-200'
                : 'bg-abyss-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {nightMode ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
                <span>{lang === 'sv' ? 'Natt-LED' : 'Moonlight'}</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span>{lang === 'sv' ? 'Dagsljus' : 'Daylight'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Glass Aquarium Viewport */}
      <div
        ref={tankRef}
        onClick={(e) => handleDropFood(e.clientX, e.clientY)}
        className={`relative w-full h-[300px] sm:h-[370px] bg-gradient-to-b ${getWaterGradient()} overflow-hidden cursor-pointer select-none transition-colors duration-700`}
      >
        {/* Top Water Surface Shimmer & Light Rays */}
        <div className="absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-cyan-200/25 to-transparent border-b border-cyan-200/20 pointer-events-none" />
        {!nightMode && (
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              background:
                'repeating-linear-gradient(108deg, transparent 0%, rgba(255,255,255,0.08) 6%, transparent 14%)',
            }}
          />
        )}

        {/* Water Zone Guide Overlay (Top / Middle / Bottom) */}
        {showZoneOverlay && (
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col">
            <div className="h-[33%] border-b border-dashed border-cyan-300/40 flex items-start justify-end p-2">
              <span className="px-2.5 py-0.5 rounded-full bg-abyss-950/80 text-cyan-200 text-[11px] font-bold border border-cyan-400/30">
                {lang === 'sv' ? 'Ytskikt (Guppy, Kampfisk, Gurami, Sebrafisk)' : 'Top Zone (Surface Swimmers)'}
              </span>
            </div>
            <div className="h-[38%] border-b border-dashed border-cyan-300/40 flex items-start justify-end p-2">
              <span className="px-2.5 py-0.5 rounded-full bg-abyss-950/80 text-emerald-200 text-[11px] font-bold border border-emerald-400/30">
                {lang === 'sv' ? 'Mellanskikt (Tetror, Rasboror, Platy, Skalar)' : 'Mid Zone (Schooling Fish)'}
              </span>
            </div>
            <div className="flex-1 flex items-start justify-end p-2">
              <span className="px-2.5 py-0.5 rounded-full bg-abyss-950/80 text-amber-200 text-[11px] font-bold border border-amber-400/30">
                {lang === 'sv' ? 'Bottenskikt (Pansarmal, Kuhlii-ål, Ancistrus, Räkor)' : 'Bottom Zone (Clean-up Crew)'}
              </span>
            </div>
          </div>
        )}

        {/* Rising Air Bubbles */}
        {BUBBLES.map((b) => (
          <div
            key={b.id}
            className="absolute bottom-8 rounded-full bg-cyan-200/30 border border-white/30 pointer-events-none animate-pulse"
            style={{
              left: `${b.x}%`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              animation: `floatBubble ${b.duration}s linear ${b.delay}s infinite`,
            }}
          />
        ))}

        {/* Background Aquascape Plants, Driftwood & Decor SVG */}
        <svg
          viewBox="0 0 1000 360"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* Driftwood Root */}
          {(aquascape === 'amazonas' || aquascape === 'blackwater' || aquascape === 'nature_planted') && (
            <path
              d="M120,335 Q180,220 340,180 Q240,245 260,335 Z M210,250 Q280,190 420,235 Q300,235 245,280 Z"
              fill="#5c3a21"
              opacity="0.75"
            />
          )}

          {/* Treasure Chest & Castle in Kids' Theme */}
          {aquascape === 'treasure_reef' && (
            <g transform="translate(680, 245)">
              <rect x="0" y="30" width="76" height="45" rx="6" fill="#92400e" stroke="#f59e0b" strokeWidth="3" />
              <path d="M-4,30 Q38,-5 80,30 Z" fill="#b45309" stroke="#f59e0b" strokeWidth="3" />
              <circle cx="38" cy="32" r="7" fill="#fde047" />
              <circle cx="24" cy="24" r="4" fill="#fef08a" />
              <circle cx="52" cy="25" r="4" fill="#38bdf8" />
            </g>
          )}

          {/* Lush Background Vallisneria & Amazon Sword Plants */}
          <g opacity={nightMode ? 0.45 : 0.82}>
            {/* Left tall plants */}
            <path d="M40,335 Q20,210 55,95 Q65,210 58,335 Z" fill="#15803d" />
            <path d="M65,335 Q95,190 70,80 Q50,200 78,335 Z" fill="#16a34a" />
            <path d="M95,335 Q120,230 105,135 Q85,230 110,335 Z" fill="#22c55e" />

            {/* Center-left Anubias bush */}
            <ellipse cx="290" cy="305" rx="45" ry="22" fill="#15803d" />
            <ellipse cx="325" cy="312" rx="38" ry="18" fill="#16a34a" />

            {/* Right tall plants */}
            <path d="M850,335 Q825,200 865,90 Q885,210 870,335 Z" fill="#15803d" />
            <path d="M890,335 Q930,175 900,65 Q870,195 910,335 Z" fill="#16a34a" />
            <path d="M935,335 Q960,220 945,115 Q920,220 950,335 Z" fill="#22c55e" />
          </g>

          {/* Smooth River Stones */}
          <ellipse cx="180" cy="328" rx="42" ry="14" fill="#475569" />
          <ellipse cx="220" cy="332" rx="28" ry="11" fill="#64748b" />
          <ellipse cx="780" cy="328" rx="48" ry="15" fill="#475569" />

          {/* Fine Golden Sand Substrate */}
          <path
            d="M0,322 Q250,308 500,320 T1000,316 L1000,360 L0,360 Z"
            fill={nightMode ? '#473c28' : '#d6b37c'}
          />
          <path
            d="M0,334 Q350,324 700,334 T1000,330 L1000,360 L0,360 Z"
            fill={nightMode ? '#332b1c' : '#c29b61'}
          />
        </svg>

        {/* Sinking Food Pellets */}
        {foodPellets.map((pellet) => (
          <div
            key={pellet.id}
            className="absolute w-2.5 h-2.5 rounded-full bg-amber-300 border border-orange-500 shadow-sm pointer-events-none"
            style={{
              left: `${pellet.x}%`,
              top: `${pellet.y}%`,
            }}
          />
        ))}

        {/* Swimming Fish Instances */}
        {simFish.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
            <div className="bg-abyss-950/80 backdrop-blur-md border border-cyan-400/30 rounded-3xl p-6 max-w-md space-y-2 shadow-2xl">
              <p className="text-base sm:text-lg font-extrabold text-white">
                {lang === 'sv'
                  ? 'Akvariet väntar på sina första fiskar!'
                  : 'The aquarium is waiting for its first fish!'}
              </p>
              <p className="text-xs sm:text-sm text-slate-300">
                {lang === 'sv'
                  ? 'Välj ett färdigt akvarieförslag nedan eller klicka på "+ Lägg i akvariet" på valfri fiskart för att se dem simma här!'
                  : 'Pick a starter tank preset below or click "+ Add to Tank" on any species card to watch them swim!'}
              </p>
            </div>
          </div>
        ) : (
          simFish.map((f) => (
            <div
              key={f.uid}
              onClick={(e) => {
                e.stopPropagation();
                playBubbleSound();
                onInspectSpecies(f.species);
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform hover:scale-125 z-10"
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
              }}
              title={`${lang === 'sv' ? f.species.nameSv : f.species.nameEn} — ${
                lang === 'sv' ? 'Klicka för fakta' : 'Click for info'
              }`}
            >
              <div style={{ transform: `scale(${f.scale})` }}>
                <FishIllustration
                  visual={f.species.visual}
                  className="w-16 h-10 sm:w-20 sm:h-12"
                  flipHorizontal={!f.facingRight}
                />
              </div>

              {/* Hover name tooltip */}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-abyss-950/90 text-cyan-200 text-[10px] font-bold whitespace-nowrap border border-cyan-500/30 shadow-lg">
                {lang === 'sv' ? f.species.nameSv : f.species.nameEn}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Bottom Aquascape Selector Bar */}
      <div className="px-4 sm:px-6 py-2.5 bg-abyss-950/90 border-t border-cyan-500/15 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <span className="text-slate-400 font-bold flex items-center gap-1 flex-shrink-0">
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lang === 'sv' ? 'Miljö:' : 'Theme:'}</span>
          </span>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                playBubbleSound();
                onAquascapeChange(t.id);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                aquascape === t.id
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-abyss-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {lang === 'sv' ? t.labelSv : t.labelEn}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-slate-400 hidden md:flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {lang === 'sv'
              ? 'Klicka i vattnet för att släppa ner mat eller klicka på en fisk för att läsa mer!'
              : 'Click the water to drop food or click any fish to inspect!'}
          </span>
        </span>
      </div>
    </div>
  );
};
