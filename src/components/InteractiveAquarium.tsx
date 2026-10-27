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
import { StickerDiplomaModal } from './StickerDiplomaModal';
import {
  playBubbleSound,
  playFeedSplashSound,
  playPopSound,
  playSuccessChime,
  speakKidsText,
} from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Award,
  Sparkles,
  Sun,
  Moon,
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
  x: number;
  y: number;
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

const BUBBLES: BubbleParticle[] = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: 8 + ((i * 6.5) % 84),
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
  const [foodPellets, setFoodPellets] = useState<FoodPellet[]>([]);
  const [reactions, setReactions] = useState<HappyReaction[]>([]);
  const [simFish, setSimFish] = useState<SimFish[]>([]);
  const [treasureOpen, setTreasureOpen] = useState(false);

  // Kids "Fisk-Jakten" Mini-Game & Sticker Album State
  const [questActive, setQuestActive] = useState(false);
  const [questTarget, setQuestTarget] = useState<FishSpecies | null>(null);
  const [questSolved, setQuestSolved] = useState(false);
  const [starsEarned, setStarsEarned] = useState<number>(() => {
    try {
      const val = Number(localStorage.getItem('fena_kids_stars') || '0');
      return Number.isFinite(val) && val >= 0 ? val : 0;
    } catch {
      return 0;
    }
  });
  const [unlockedStickers, setUnlockedStickers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fena_kids_stickers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [albumInitialTab, setAlbumInitialTab] = useState<'stickers' | 'diploma'>('stickers');

  const unlockSticker = (speciesId: string) => {
    setUnlockedStickers((prev) => {
      if (prev.includes(speciesId)) return prev;
      const next = [...prev, speciesId];
      try {
        localStorage.setItem('fena_kids_stickers', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const activeIds = fishEntries.filter((e) => e.count > 0).map((e) => e.speciesId);
    if (activeIds.length === 0) return;
    setUnlockedStickers((prev) => {
      const missing = activeIds.filter((id) => !prev.includes(id));
      if (missing.length === 0) return prev;
      const next = [...prev, ...missing];
      try {
        localStorage.setItem('fena_kids_stickers', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [fishEntries]);

  const tankRef = useRef<HTMLDivElement>(null);

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
      speakKidsText(lang === 'sv' ? meta.questClueSv : meta.questClueEn, lang);
    }
  };

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
        yMin = 14;
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
            yMin = 14;
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
                  { id: reactId, x: eatX, y: eatY - 4, symbol: '❤️' },
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
            y = Math.max(12, Math.min(88, y));
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
    let baseY = 14;

    if (clientX !== undefined && clientY !== undefined && tankRef.current) {
      const rect = tankRef.current.getBoundingClientRect();
      baseX = Math.max(10, Math.min(90, ((clientX - rect.left) / rect.width) * 100));
      baseY = Math.max(10, Math.min(45, ((clientY - rect.top) / rect.height) * 100));
    }

    const newPellets: FoodPellet[] = Array.from({ length: 7 }, (_, i) => ({
      id: `food-${Date.now()}-${i}-${Math.random()}`,
      x: Math.max(8, Math.min(92, baseX + (i - 3) * 4)),
      y: baseY + (i % 3) * 2.5,
    }));

    setFoodPellets((prev) => [...prev.slice(-20), ...newPellets]);
  };

  const handleFishClick = (e: React.MouseEvent, f: SimFish) => {
    e.stopPropagation();

    if (questActive && questTarget && !questSolved) {
      if (f.species.id === questTarget.id) {
        playSuccessChime();
        setQuestSolved(true);
        unlockSticker(f.species.id);
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
      return 'from-[#06152d] via-[#0b2246] to-[#040d1e]';
    }
    switch (aquascape) {
      case 'nature_planted':
        return 'from-[#0c6368] via-[#0e4f57] to-[#08323a]';
      case 'treasure_reef':
        return 'from-[#0776a0] via-[#0a5b82] to-[#073b58]';
      case 'amazonas':
        return 'from-[#0d5260] via-[#0c3f4d] to-[#072630]';
      case 'blackwater':
        return 'from-[#572c10] via-[#40200b] to-[#241106]';
    }
  };

  const themes: { id: AquascapeTheme; labelSv: string; labelEn: string }[] = [
    { id: 'nature_planted', labelSv: '🌿 Växtoas', labelEn: '🌿 Planted' },
    { id: 'treasure_reef', labelSv: '🏴‍☠️ Skattkista', labelEn: '🏴‍☠️ Treasure' },
    { id: 'amazonas', labelSv: '🪵 Amazonas', labelEn: '🪵 Amazon' },
  ];

  return (
    <div className="space-y-3">
      {/* KIDS QUEST CLUE CARD (Only visible when Fisk-Jakten is active) */}
      {questActive && questTarget && (
        <div className="p-4 rounded-2xl bg-[#FFFBEB] border-2 border-amber-400 shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={getKidMeta(questTarget.id).photoUrl}
              alt={questTarget.nameSv}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-sm"
            />
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                {questSolved
                  ? lang === 'sv'
                    ? '🎉 Rätt gissat!'
                    : '🎉 You found it!'
                  : lang === 'sv'
                  ? '🕵️‍♂️ Fisk-Jakten — Tryck på rätt fisk i vattnet:'
                  : '🕵️‍♂️ Fish Hunt — Tap this fish in the water:'}
              </span>
              <p className="text-base sm:text-lg font-extrabold text-[#12262A]">
                {questSolved
                  ? lang === 'sv'
                    ? `Hurra! Det var en ${questTarget.nameSv}!`
                    : `Hooray! That was a ${questTarget.nameEn}!`
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
                speakKidsText(lang === 'sv' ? meta.questClueSv : meta.questClueEn, lang);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>{lang === 'sv' ? 'Lyssna' : 'Listen'}</span>
            </button>

            <button
              onClick={() => pickNextQuestTarget(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>{lang === 'sv' ? 'Nästa fisk' : 'Next fish'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setQuestActive(false)}
              className="p-2 rounded-xl text-slate-500 hover:bg-amber-100 cursor-pointer"
              aria-label="Close game"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* THE GLASS AQUARIUM STAGE */}
      <div className="relative rounded-[28px] border-[6px] sm:border-[8px] border-[#182C30] bg-[#08323a] shadow-2xl overflow-hidden">
        {/* Clean Floating Top Overlay Controls */}
        <div className="absolute top-3 inset-x-3 sm:inset-x-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Primary Actions: Feed & Play */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => handleDropFood()}
              className="px-4 py-2 rounded-full bg-[#F59E0B] hover:bg-[#FBBF24] active:scale-95 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg cursor-pointer transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>{lang === 'sv' ? 'Mata fiskarna' : 'Feed fish'}</span>
            </button>

            <button
              onClick={() => {
                if (!questActive) {
                  setQuestActive(true);
                  pickNextQuestTarget(true);
                } else {
                  setQuestActive(false);
                }
              }}
              className={`px-3.5 py-2 rounded-full text-xs sm:text-sm font-extrabold transition flex items-center gap-1.5 shadow-lg cursor-pointer ${
                questActive
                  ? 'bg-white text-[#12262A]'
                  : 'bg-[#12262A]/80 hover:bg-[#12262A] text-white backdrop-blur-md border border-white/20'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{lang === 'sv' ? 'Fisk-Jakten' : 'Fish Hunt'}</span>
              {starsEarned > 0 && (
                <span className="ml-0.5 text-amber-300 font-black">★ {starsEarned}</span>
              )}
            </button>
          </div>

          {/* Quiet Right Utilities: Stickers/Diploma & Day/Night */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={() => {
                playBubbleSound();
                setAlbumInitialTab(starsEarned >= 3 ? 'diploma' : 'stickers');
                setAlbumModalOpen(true);
              }}
              className="px-3 py-2 rounded-full bg-[#12262A]/80 hover:bg-[#12262A] text-white backdrop-blur-md border border-white/20 text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition"
              title={lang === 'sv' ? 'Klistermärken & Diplom' : 'Stickers & Diploma'}
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">
                {lang === 'sv' ? 'Klistermärken' : 'Stickers'}
              </span>
              <span className="text-amber-300 font-extrabold">
                {unlockedStickers.length}/{FISH_SPECIES.length}
              </span>
            </button>

            <button
              onClick={() => {
                playBubbleSound();
                setNightMode(!nightMode);
              }}
              className="p-2 rounded-full bg-[#12262A]/80 hover:bg-[#12262A] text-white backdrop-blur-md border border-white/20 shadow-md cursor-pointer transition"
              title={lang === 'sv' ? 'Växla dag / natt' : 'Toggle day / night'}
            >
              {nightMode ? (
                <Moon className="w-4 h-4 text-indigo-300" />
              ) : (
                <Sun className="w-4 h-4 text-amber-300" />
              )}
            </button>
          </div>
        </div>

        {/* Main Water Viewport */}
        <div
          ref={tankRef}
          onClick={(e) => handleDropFood(e.clientX, e.clientY)}
          className={`relative w-full h-[310px] sm:h-[380px] bg-gradient-to-b ${getWaterGradient()} overflow-hidden cursor-pointer select-none transition-colors duration-700`}
        >
          {/* Water Surface Shimmer & Sunbeams */}
          <div className="absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-cyan-100/25 to-transparent pointer-events-none" />
          {!nightMode && (
            <div
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                background:
                  'repeating-linear-gradient(108deg, transparent 0%, rgba(255,255,255,0.09) 6%, transparent 14%)',
              }}
            />
          )}

          {/* Poppable Air Bubbles */}
          {BUBBLES.map((b) => (
            <div
              key={b.id}
              onClick={(e) => {
                e.stopPropagation();
                playPopSound();
              }}
              className="absolute bottom-8 rounded-full bg-white/30 hover:bg-white/70 border border-white/40 cursor-pointer transition-transform hover:scale-150"
              style={{
                left: `${b.x}%`,
                width: `${b.size}px`,
                height: `${b.size}px`,
                animation: `floatBubble ${b.duration}s linear ${b.delay}s infinite`,
              }}
            />
          ))}

          {/* Aquascape Scenery SVG */}
          <svg
            viewBox="0 0 1000 360"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            {(aquascape === 'amazonas' || aquascape === 'blackwater' || aquascape === 'nature_planted') && (
              <path
                d="M120,335 Q180,220 340,180 Q240,245 260,335 Z M210,250 Q280,190 420,235 Q300,235 245,280 Z"
                fill="#5c3a21"
                opacity="0.75"
              />
            )}

            <g opacity={nightMode ? 0.45 : 0.85}>
              <path d="M40,335 Q20,210 55,95 Q65,210 58,335 Z" fill="#15803d" />
              <path d="M65,335 Q95,190 70,80 Q50,200 78,335 Z" fill="#16a34a" />
              <path d="M95,335 Q120,230 105,135 Q85,230 110,335 Z" fill="#22c55e" />

              <ellipse cx="290" cy="305" rx="45" ry="22" fill="#15803d" />
              <ellipse cx="325" cy="312" rx="38" ry="18" fill="#16a34a" />

              <path d="M850,335 Q825,200 865,90 Q885,210 870,335 Z" fill="#15803d" />
              <path d="M890,335 Q930,175 900,65 Q870,195 910,335 Z" fill="#16a34a" />
              <path d="M935,335 Q960,220 945,115 Q920,220 950,335 Z" fill="#22c55e" />
            </g>

            <ellipse cx="180" cy="328" rx="42" ry="14" fill="#475569" />
            <ellipse cx="220" cy="332" rx="28" ry="11" fill="#64748b" />
            <ellipse cx="780" cy="328" rx="48" ry="15" fill="#475569" />

            <path
              d="M0,322 Q250,308 500,320 T1000,316 L1000,360 L0,360 Z"
              fill={nightMode ? '#473c28' : '#d6b37c'}
            />
            <path
              d="M0,334 Q350,324 700,334 T1000,330 L1000,360 L0,360 Z"
              fill={nightMode ? '#332b1c' : '#c29b61'}
            />
          </svg>

          {/* Clickable Secret Treasure Chest on the Sand */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playSuccessChime();
              setTreasureOpen((prev) => !prev);
            }}
            className="absolute bottom-5 right-[18%] z-10 cursor-pointer transition-transform hover:scale-110"
            title={lang === 'sv' ? 'Öppna skattkistan!' : 'Open treasure chest!'}
          >
            <div className="flex flex-col items-center">
              {treasureOpen && <span className="text-base animate-bounce -mb-1">✨🪙✨</span>}
              <span className="text-2xl sm:text-3xl drop-shadow-md">
                {treasureOpen ? '👑' : '🧰'}
              </span>
            </div>
          </button>

          {/* Subtle Bottom-Left Theme Switcher */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-3 left-3 z-20 flex items-center gap-1 bg-[#12262A]/75 backdrop-blur-md p-1 rounded-full border border-white/15"
          >
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  playBubbleSound();
                  onAquascapeChange(t.id);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                  aquascape === t.id
                    ? 'bg-white text-[#12262A] shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {lang === 'sv' ? t.labelSv : t.labelEn}
              </button>
            ))}
          </div>

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

          {/* Happy Hearts */}
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

          {/* Swimming Fish */}
          {simFish.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
              <div className="bg-[#12262A]/85 backdrop-blur-md border border-white/20 rounded-3xl p-6 max-w-sm space-y-1.5 shadow-xl text-white">
                <p className="text-lg font-display font-bold">
                  {lang === 'sv' ? 'Akvariet är tomt!' : 'The tank is empty!'}
                </p>
                <p className="text-xs text-white/80">
                  {lang === 'sv'
                    ? 'Välj en fisk nedan och tryck på "+ Lägg i" för att se den simma här.'
                    : 'Pick any fish below and tap "+ Add" to watch it swim here.'}
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
                  <div style={{ transform: `scale(${f.scale})` }}>
                    <FishIllustration
                      visual={f.species.visual}
                      className="w-16 h-10 sm:w-20 sm:h-12"
                      flipHorizontal={!f.facingRight}
                    />
                  </div>

                  {/* Hover Tooltip with Photo & Name */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-xl bg-[#12262A] text-white text-xs font-bold whitespace-nowrap shadow-xl flex items-center gap-1.5 z-30">
                    <img
                      src={meta.photoUrl}
                      alt={f.species.nameSv}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span>{lang === 'sv' ? f.species.nameSv : f.species.nameEn}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Kids Sticker Album & Printable Diploma Modal */}
      <StickerDiplomaModal
        isOpen={albumModalOpen}
        onClose={() => setAlbumModalOpen(false)}
        unlockedStickers={unlockedStickers}
        onUnlockSticker={(spId) => unlockSticker(spId)}
        onAddBonusStar={() => {
          setStarsEarned((prev) => {
            const next = prev + 1;
            try {
              localStorage.setItem('fena_kids_stars', String(next));
            } catch {}
            return next;
          });
        }}
        onInspectSpecies={onInspectSpecies}
        starsEarned={starsEarned}
        liters={liters}
        lang={lang}
        initialTab={albumInitialTab}
      />
    </div>
  );
};
