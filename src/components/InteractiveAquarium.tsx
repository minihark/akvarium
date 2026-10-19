import React, { useState, useEffect, useRef } from 'react';
import {
  TankFishEntry,
  FishSpecies,
  AquascapeTheme,
  Language,
} from '../types';
import { FISH_SPECIES } from '../data/species';
import { getKidMeta } from '../data/kidExtras';
import { FishIllustration } from './FishIllustration';
import {
  playBubbleSound,
  playFeedSplashSound,
  playPopSound,
  playSuccessChime,
  speakKidsText,
} from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Sun,
  Moon,
  Palette,
  Info,
  Droplets,
  Layers,
  Camera,
  Trophy,
  Volume2,
  ArrowRight,
  X,
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

type FoodKind = 'flakes' | 'wafer' | 'treat';

interface FoodPellet {
  id: string;
  x: number;
  y: number;
  kind: FoodKind;
}

interface HappyReaction {
  id: string;
  x: number;
  y: number;
  symbol: string;
}

interface BubbleParticle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
}

const BUBBLES: BubbleParticle[] = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  x: 7 + ((i * 6) % 86),
  size: 8 + (i % 4) * 4,
  duration: 4.5 + (i % 5),
  delay: (i * 0.6) % 4,
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
  const [photoMode, setPhotoMode] = useState(false);
  const [selectedFoodKind, setSelectedFoodKind] = useState<FoodKind>('flakes');
  const [foodPellets, setFoodPellets] = useState<FoodPellet[]>([]);
  const [reactions, setReactions] = useState<HappyReaction[]>([]);
  const [simFish, setSimFish] = useState<SimFish[]>([]);
  const [treasureOpen, setTreasureOpen] = useState(false);

  // Kids "Fisk-Jakten" Mini-Game State
  const [questActive, setQuestActive] = useState(false);
  const [questTarget, setQuestTarget] = useState<FishSpecies | null>(null);
  const [questSolved, setQuestSolved] = useState(false);
  const [starsEarned, setStarsEarned] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('fena_kids_stars') || '0');
    } catch {
      return 0;
    }
  });

  const tankRef = useRef<HTMLDivElement>(null);

  // Pick a target species from currently active fish in the tank
  const pickNextQuestTarget = (speakClue = true) => {
    const activeSpecies = fishEntries
      .filter((e) => e.count > 0)
      .map((e) => FISH_SPECIES.find((s) => s.id === e.speciesId))
      .filter((s): s is FishSpecies => Boolean(s));

    if (activeSpecies.length === 0) return;

    const candidates =
      activeSpecies.length > 1 && questTarget
        ? activeSpecies.filter((s) => s.id !== questTarget.id)
        : activeSpecies;

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    setQuestTarget(chosen);
    setQuestSolved(false);

    if (speakClue) {
      const meta = getKidMeta(chosen.id);
      speakKidsText(
        lang === 'sv' ? meta.questClueSv : meta.questClueEn,
        lang
      );
    }
  };

  // Keep quest target valid if fish change
  useEffect(() => {
    if (questActive) {
      const stillInTank =
        questTarget &&
        fishEntries.some((e) => e.speciesId === questTarget.id && e.count > 0);
      if (!stillInTank) {
        pickNextQuestTarget(false);
      }
    }
  }, [fishEntries, questActive]);

  // Build simulated fish instances whenever fishEntries change
  useEffect(() => {
    const nextSim: SimFish[] = [];

    fishEntries.forEach(({ speciesId, count }) => {
      if (count <= 0) return;
      const species = FISH_SPECIES.find((s) => s.id === speciesId);
      if (!species) return;

      const visualCount = Math.min(count, 16);

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

      const baseScale = Math.max(0.75, Math.min(1.45, species.sizeCm / 5.2));

      for (let i = 0; i < visualCount; i++) {
        const startX = 12 + ((i * 19 + species.nameSv.length * 7) % 76);
        const startY = yMin + ((i * 13) % Math.max(1, yMax - yMin));
        const speed =
          species.visual.shape === 'snail'
            ? 0.035
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
          scale: baseScale * (0.94 + (i % 3) * 0.06),
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
          .map((p) => {
            const sinkSpeed = p.kind === 'wafer' ? 0.65 : p.kind === 'treat' ? 0.28 : 0.35;
            const nextY = p.kind === 'wafer' ? Math.min(86, p.y + sinkSpeed * dt) : p.y + sinkSpeed * dt;
            return {
              ...p,
              y: nextY,
              x: p.x + Math.sin(now * 0.004 + p.y) * (p.kind === 'wafer' ? 0.02 : 0.08),
            };
          })
          .filter((p) => p.y < 89);
      });

      setSimFish((prevFish) => {
        if (prevFish.length === 0) return prevFish;

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

          let chasingFood = false;
          if (foodPellets.length > 0 && sp.visual.shape !== 'snail') {
            let nearest: FoodPellet | null = null;
            let bestDist = 999;
            for (const p of foodPellets) {
              const dist = Math.hypot(p.x - x, p.y - y);
              if (dist < bestDist && dist < 42) {
                bestDist = dist;
                nearest = p;
              }
            }
            if (nearest) {
              chasingFood = true;
              const dx = nearest.x - x;
              const dy = nearest.y - y;
              vx += Math.sign(dx) * 0.028 * dt;
              vy += Math.sign(dy) * 0.028 * dt;

              if (bestDist < 4.8) {
                const eatenId = nearest.id;
                const eatX = x;
                const eatY = y;
                setFoodPellets((curr) => curr.filter((item) => item.id !== eatenId));
                playPopSound();
                const reactId = `react-${Date.now()}-${Math.random()}`;
                setReactions((curr) => [
                  ...curr.slice(-8),
                  {
                    id: reactId,
                    x: eatX,
                    y: eatY - 4,
                    symbol: nearest?.kind === 'treat' ? '🤩' : '❤️',
                  },
                ]);
                setTimeout(() => {
                  setReactions((curr) => curr.filter((r) => r.id !== reactId));
                }, 900);
              }
            }
          }

          if (!chasingFood && centroids[sp.id] && centroids[sp.id].count > 2) {
            const c = centroids[sp.id];
            vx += (c.x - x) * 0.0005 * dt;
            vy += (c.y - y) * 0.0006 * dt;
          }

          vy += Math.sin(now * 0.002 + f.phase) * 0.002 * dt;

          const maxVx = chasingFood ? 0.52 : sp.visual.shape === 'snail' ? 0.04 : 0.25;
          const maxVy = chasingFood ? 0.38 : 0.12;
          vx = Math.max(-maxVx, Math.min(maxVx, vx));
          vy = Math.max(-maxVy, Math.min(maxVy, vy));

          if (Math.abs(vx) < 0.04 && sp.visual.shape !== 'snail') {
            vx = (facingRight ? 1 : -1) * 0.14;
          }

          x += vx * dt;
          y += vy * dt;

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
      baseY = Math.max(8, Math.min(45, ((clientY - rect.top) / rect.height) * 100));
    }

    const count = selectedFoodKind === 'wafer' ? 3 : 7;
    const newPellets: FoodPellet[] = Array.from({ length: count }, (_, i) => ({
      id: `food-${Date.now()}-${i}-${Math.random()}`,
      x: Math.max(8, Math.min(92, baseX + (i - Math.floor(count / 2)) * 4)),
      y: baseY + (i % 3) * 2.5,
      kind: selectedFoodKind,
    }));

    setFoodPellets((prev) => [...prev.slice(-20), ...newPellets]);
  };

  const handleFishClick = (e: React.MouseEvent, f: SimFish) => {
    e.stopPropagation();

    // If Kids Quest Mode is active, check if this is the target fish!
    if (questActive && questTarget && !questSolved) {
      if (f.species.id === questTarget.id) {
        playSuccessChime();
        setQuestSolved(true);
        const nextStars = starsEarned + 1;
        setStarsEarned(nextStars);
        try {
          localStorage.setItem('fena_kids_stars', String(nextStars));
        } catch {}
        try {
          confetti({
            particleCount: 70,
            spread: 80,
            origin: { y: 0.55 },
          });
        } catch {}
        speakKidsText(
          lang === 'sv'
            ? `Hurra! Rätt gissat! Du hittade ${f.species.nameSv}!`
            : `Hooray! You found the ${f.species.nameEn}!`,
          lang
        );
        return;
      } else {
        playPopSound();
        speakKidsText(
          lang === 'sv'
            ? `Nästan! Det där är en ${f.species.nameSv}. Fortsätt leta!`
            : `Almost! That is a ${f.species.nameEn}. Keep looking!`,
          lang
        );
        return;
      }
    }

    playBubbleSound();
    onInspectSpecies(f.species);
  };

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
    { id: 'nature_planted', labelSv: '🌿 Grön Växt-Oas', labelEn: '🌿 Lush Planted' },
    { id: 'treasure_reef', labelSv: '🏴‍☠️ Skattkista & Äventyr', labelEn: '🏴‍☠️ Kids’ Treasure' },
    { id: 'amazonas', labelSv: '🪵 Amazonas Flod', labelEn: '🪵 Amazon River' },
    { id: 'blackwater', labelSv: '🍂 Rio Negro', labelEn: '🍂 Blackwater' },
  ];

  const foodOptions: { id: FoodKind; labelSv: string; labelEn: string }[] = [
    { id: 'flakes', labelSv: '🥣 Flingor', labelEn: '🥣 Flakes' },
    { id: 'wafer', labelSv: '🥦 Alg-tablett', labelEn: '🥦 Algae Wafer' },
    { id: 'treat', labelSv: '🪱 Lyx-godis', labelEn: '🪱 Bloodworm Treat' },
  ];

  return (
    <div className="bg-abyss-900/90 border border-cyan-500/25 rounded-3xl overflow-hidden shadow-2xl">
      {/* Top Control Bar */}
      <div className="px-4 sm:px-6 py-3 bg-abyss-950/90 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-extrabold">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>{liters} Liter</span>
          </span>

          {/* Food Type Selector + Feed Button */}
          <div className="flex items-center gap-1 bg-abyss-900 p-1 rounded-xl border border-slate-800">
            {foodOptions.map((fo) => (
              <button
                key={fo.id}
                onClick={() => {
                  playBubbleSound();
                  setSelectedFoodKind(fo.id);
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                  selectedFoodKind === fo.id
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {lang === 'sv' ? fo.labelSv : fo.labelEn}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleDropFood()}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 active:scale-95 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'sv' ? 'Mata fiskarna!' : 'Feed the Fish!'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Kids "Fisk-Jakten" Mini-Game Toggle */}
          <button
            onClick={() => {
              if (!questActive) {
                setQuestActive(true);
                pickNextQuestTarget(true);
              } else {
                setQuestActive(false);
              }
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition flex items-center gap-1.5 cursor-pointer ${
              questActive
                ? 'bg-gradient-to-r from-pink-500 to-amber-500 border-amber-300 text-white shadow-lg shadow-pink-500/25'
                : 'bg-abyss-900 border-amber-400/40 text-amber-200 hover:border-amber-300'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {lang === 'sv' ? '🕵️‍♂️ Fisk-Jakten' : '🕵️‍♂️ Find the Fish'}
            </span>
            {starsEarned > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-amber-300 text-[10px] font-black">
                ⭐ {starsEarned}
              </span>
            )}
          </button>

          {/* Toggle Real Photos vs Illustrated Fish */}
          <button
            onClick={() => {
              playBubbleSound();
              setPhotoMode(!photoMode);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              photoMode
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                : 'bg-abyss-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {photoMode
                ? lang === 'sv'
                  ? '📸 Foto-fiskar'
                  : '📸 Photo Fish'
                : lang === 'sv'
                ? '🎨 Tecknade'
                : '🎨 Illustrated'}
            </span>
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
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">
              {lang === 'sv' ? 'Zoner' : 'Zones'}
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
                <span>{lang === 'sv' ? 'Natt' : 'Night'}</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span>{lang === 'sv' ? 'Dag' : 'Day'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KIDS QUEST BANNER ("Fisk-Jakten") */}
      {questActive && questTarget && (
        <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-amber-500/25 via-pink-500/20 to-cyan-500/25 border-b border-amber-400/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={getKidMeta(questTarget.id).photoUrl}
              alt={questTarget.nameSv}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-300 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                  {questSolved
                    ? lang === 'sv'
                      ? '🎉 HURRA! DU HITTADE RÄTT FISK!'
                      : '🎉 HOORAY! YOU FOUND IT!'
                    : lang === 'sv'
                    ? '🕵️‍♂️ FISK-JAKTEN — TRYCK PÅ RÄTT FISK I AKVARIET:'
                    : '🕵️‍♂️ FISH HUNT — TAP THIS FISH IN THE TANK:'}
                </span>
              </div>
              <p className="text-sm sm:text-base font-black text-white">
                {questSolved
                  ? lang === 'sv'
                    ? `Bra jobbat! Det var en ${questTarget.nameSv}! (${getKidMeta(questTarget.id).superpowerSv})`
                    : `Awesome job! That was a ${questTarget.nameEn}!`
                  : lang === 'sv'
                  ? getKidMeta(questTarget.id).questClueSv
                  : getKidMeta(questTarget.id).questClueEn}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const meta = getKidMeta(questTarget.id);
                speakKidsText(
                  lang === 'sv' ? meta.questClueSv : meta.questClueEn,
                  lang
                );
              }}
              className="px-3 py-1.5 rounded-xl bg-abyss-950/90 hover:bg-abyss-800 text-amber-200 border border-amber-400/40 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{lang === 'sv' ? 'Lyssna igen' : 'Hear Clue'}</span>
            </button>

            <button
              onClick={() => pickNextQuestTarget(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md cursor-pointer"
            >
              <span>{lang === 'sv' ? 'Nästa fisk' : 'Next Fish'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setQuestActive(false)}
              className="p-1.5 rounded-xl bg-abyss-950/80 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Glass Aquarium Viewport */}
      <div
        ref={tankRef}
        onClick={(e) => handleDropFood(e.clientX, e.clientY)}
        className={`relative w-full h-[320px] sm:h-[390px] bg-gradient-to-b ${getWaterGradient()} overflow-hidden cursor-pointer select-none transition-colors duration-700`}
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

        {/* Poppable Rising Air Bubbles */}
        {BUBBLES.map((b) => (
          <div
            key={b.id}
            onClick={(e) => {
              e.stopPropagation();
              playPopSound();
            }}
            className="absolute bottom-8 rounded-full bg-cyan-200/35 hover:bg-white/70 border border-white/40 cursor-pointer transition-transform hover:scale-150"
            style={{
              left: `${b.x}%`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              animation: `floatBubble ${b.duration}s linear ${b.delay}s infinite`,
            }}
            title={lang === 'sv' ? 'Plopp!' : 'Pop!'}
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

          {/* Lush Background Vallisneria & Amazon Sword Plants */}
          <g opacity={nightMode ? 0.45 : 0.82}>
            <path d="M40,335 Q20,210 55,95 Q65,210 58,335 Z" fill="#15803d" />
            <path d="M65,335 Q95,190 70,80 Q50,200 78,335 Z" fill="#16a34a" />
            <path d="M95,335 Q120,230 105,135 Q85,230 110,335 Z" fill="#22c55e" />

            <ellipse cx="290" cy="305" rx="45" ry="22" fill="#15803d" />
            <ellipse cx="325" cy="312" rx="38" ry="18" fill="#16a34a" />

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

        {/* Interactive Clickable Treasure Chest on the Bottom */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            playSuccessChime();
            setTreasureOpen((prev) => !prev);
          }}
          className="absolute bottom-5 right-[18%] z-10 group cursor-pointer transition-transform hover:scale-110"
          title={lang === 'sv' ? 'Klicka på skattkistan!' : 'Click the treasure chest!'}
        >
          <div className="relative flex flex-col items-center">
            {treasureOpen && (
              <span className="text-lg animate-bounce -mb-1">✨🪙💎✨</span>
            )}
            <span className="text-3xl sm:text-4xl drop-shadow-lg">
              {treasureOpen ? '👑' : '🧰'}
            </span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded bg-abyss-950/90 text-amber-300 text-[10px] font-bold whitespace-nowrap border border-amber-400/30">
              {lang === 'sv' ? 'Hemlig skattkista!' : 'Secret treasure!'}
            </span>
          </div>
        </button>

        {/* Sinking Food Pellets */}
        {foodPellets.map((pellet) => (
          <div
            key={pellet.id}
            className={`absolute rounded-full shadow-sm pointer-events-none ${
              pellet.kind === 'wafer'
                ? 'w-4 h-3 bg-emerald-500 border-2 border-emerald-800'
                : pellet.kind === 'treat'
                ? 'w-3.5 h-2 bg-rose-500 border border-rose-200 animate-pulse'
                : 'w-2.5 h-2.5 bg-amber-300 border border-orange-500'
            }`}
            style={{
              left: `${pellet.x}%`,
              top: `${pellet.y}%`,
            }}
          />
        ))}

        {/* Floating Happy Hearts when Fish Eat */}
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-base sm:text-lg pointer-events-none animate-bounce z-30"
            style={{
              left: `${r.x}%`,
              top: `${r.y}%`,
            }}
          >
            {r.symbol}
          </div>
        ))}

        {/* Swimming Fish Instances */}
        {simFish.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
            <div className="bg-abyss-950/80 backdrop-blur-md border border-cyan-400/30 rounded-3xl p-6 max-w-md space-y-2 shadow-2xl">
              <p className="text-base sm:text-lg font-extrabold text-white">
                {lang === 'sv'
                  ? 'Akvariet väntar på sina första fiskar! 🐠'
                  : 'The aquarium is waiting for its first fish! 🐠'}
              </p>
              <p className="text-xs sm:text-sm text-slate-300">
                {lang === 'sv'
                  ? 'Välj ett färdigt akvarieförslag nedan eller tryck på "+ Lägg i akvariet" på valfri fisk för att se dem simma här!'
                  : 'Pick a starter tank preset below or tap "+ Add to Tank" on any fish card to watch them swim!'}
              </p>
            </div>
          </div>
        ) : (
          simFish.map((f) => {
            const meta = getKidMeta(f.species.id);
            return (
              <div
                key={f.uid}
                onClick={(e) => handleFishClick(e, f)}
                className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform hover:scale-125 z-10"
                style={{
                  left: `${f.x}%`,
                  top: `${f.y}%`,
                }}
              >
                {photoMode ? (
                  <div
                    className={`relative rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 to-amber-300 shadow-lg transition-transform ${
                      !f.facingRight ? '-scale-x-100' : ''
                    }`}
                    style={{ transform: `scale(${Math.max(0.85, f.scale)})` }}
                  >
                    <img
                      src={meta.photoUrl}
                      alt={f.species.nameSv}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white"
                    />
                  </div>
                ) : (
                  <div style={{ transform: `scale(${f.scale})` }}>
                    <FishIllustration
                      visual={f.species.visual}
                      className="w-16 h-10 sm:w-20 sm:h-12"
                      flipHorizontal={!f.facingRight}
                    />
                  </div>
                )}

                {/* Hover Tooltip with Real Mini Photo & Name */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-2 py-1 rounded-xl bg-abyss-950/95 text-cyan-200 text-[11px] font-extrabold whitespace-nowrap border border-cyan-400/40 shadow-xl flex items-center gap-1.5 z-30">
                  <img
                    src={meta.photoUrl}
                    alt={f.species.nameSv}
                    className="w-6 h-6 rounded-lg object-cover border border-cyan-300/40"
                  />
                  <span>
                    {meta.emoji} {lang === 'sv' ? f.species.nameSv : f.species.nameEn}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Aquascape Selector Bar */}
      <div className="px-4 sm:px-6 py-2.5 bg-abyss-950/90 border-t border-cyan-500/15 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <span className="text-slate-400 font-bold flex items-center gap-1 flex-shrink-0">
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lang === 'sv' ? 'Välj värld:' : 'World:'}</span>
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
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
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
              ? 'Tryck i vattnet för att släppa mat, smäll bubblor eller klicka på en fisk!'
              : 'Tap water to drop food, pop bubbles, or tap any fish!'}
          </span>
        </span>
      </div>
    </div>
  );
};
