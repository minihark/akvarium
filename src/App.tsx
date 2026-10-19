import React, { useState, useEffect, useMemo } from 'react';
import {
  Language,
  FishSpecies,
  TankFishEntry,
  AquascapeTheme,
  SavedTankPlan,
  FishCategory,
  WaterZone,
} from './types';
import { FISH_SPECIES, STARTER_PRESETS, EQUIPMENT_CHECKLIST } from './data/species';
import { analyzeTank } from './utils/compatibility';
import { InteractiveAquarium } from './components/InteractiveAquarium';
import { FishIllustration } from './components/FishIllustration';
import { SpeciesDetailModal } from './components/SpeciesDetailModal';
import { playBubbleSound, playFeedSplashSound } from './utils/audio';
import confetti from 'canvas-confetti';
import {
  Fish,
  Search,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Droplets,
  Thermometer,
  Layers,
  ShoppingBag,
  Bookmark,
  RotateCcw,
  Globe,
  Check,
  BookOpen,
} from 'lucide-react';

const STORAGE_KEY_TANK = 'fena_active_tank_v1';

export function App() {
  const [lang, setLang] = useState<Language>('sv');
  const [activeTab, setActiveTab] = useState<'explore' | 'planner' | 'checklist'>('explore');

  // Tank configuration state (initialized with Classic 60L starter preset so it's alive right away!)
  const [tankName, setTankName] = useState<string>('Vårt Första Akvarium');
  const [tankLiters, setTankLiters] = useState<number>(60);
  const [aquascape, setAquascape] = useState<AquascapeTheme>('nature_planted');
  const [fishEntries, setFishEntries] = useState<TankFishEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TANK);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.fish)) return parsed.fish;
      }
    } catch {}
    return STARTER_PRESETS[0].fish;
  });

  const [checkedEquipment, setCheckedEquipment] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TANK);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.checkedEquipment)) return parsed.checkedEquipment;
      }
    } catch {}
    return ['tank-and-lid', 'filter', 'heater-thermometer'];
  });

  // Load liters & theme from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TANK);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.liters) setTankLiters(parsed.liters);
        if (parsed.aquascape) setAquascape(parsed.aquascape);
        if (parsed.name) setTankName(parsed.name);
      }
    } catch {}
  }, []);

  // Persist current tank to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_TANK,
        JSON.stringify({
          name: tankName,
          liters: tankLiters,
          aquascape,
          fish: fishEntries,
          checkedEquipment,
        })
      );
    } catch {}
  }, [tankName, tankLiters, aquascape, fishEntries, checkedEquipment]);

  // Species explorer filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FishCategory | 'all'>('all');
  const [selectedZone, setSelectedZone] = useState<WaterZone | 'all'>('all');
  const [onlyCompatibleWithTankSize, setOnlyCompatibleWithTankSize] = useState(false);

  // Selected species for detail modal
  const [inspectedSpecies, setInspectedSpecies] = useState<FishSpecies | null>(null);

  // Saved family tanks from SQLite server
  const [savedTanks, setSavedTanks] = useState<SavedTankPlan[]>([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tanks')
      .then((r) => (r.ok ? r.json() : { tanks: [] }))
      .then((data) => {
        if (Array.isArray(data.tanks)) setSavedTanks(data.tanks);
      })
      .catch(() => {});
  }, []);

  // Analyze tank compatibility & bioload
  const analysis = useMemo(
    () => analyzeTank(tankLiters, fishEntries),
    [tankLiters, fishEntries]
  );

  // Helper to get count of a species in current tank
  const getCountForSpecies = (speciesId: string): number => {
    return fishEntries.find((e) => e.speciesId === speciesId)?.count || 0;
  };

  // Update count of a species
  const handleSetSpeciesCount = (speciesId: string, nextCount: number) => {
    const clamped = Math.max(0, Math.min(50, nextCount));
    setFishEntries((prev) => {
      const existing = prev.find((e) => e.speciesId === speciesId);
      if (!existing && clamped > 0) {
        return [...prev, { speciesId, count: clamped }];
      }
      return prev
        .map((e) => (e.speciesId === speciesId ? { ...e, count: clamped } : e))
        .filter((e) => e.count > 0);
    });
  };

  // Add recommended group size (or +1 if already in tank)
  const handleQuickAddSpecies = (sp: FishSpecies) => {
    playBubbleSound();
    const curr = getCountForSpecies(sp.id);
    if (curr === 0) {
      handleSetSpeciesCount(sp.id, sp.recommendedGroupSize);
    } else {
      handleSetSpeciesCount(sp.id, curr + 1);
    }
  };

  // Load a starter preset
  const handleApplyPreset = (presetId: string) => {
    const preset = STARTER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    playFeedSplashSound();
    setTankLiters(preset.liters);
    setAquascape(preset.aquascape);
    setTankName(lang === 'sv' ? preset.nameSv : preset.nameEn);
    setFishEntries(preset.fish.map((f) => ({ ...f })));
  };

  // Save current tank to SQLite server
  const handleSaveTankToCloud = async () => {
    playFeedSplashSound();
    const id = `tank-${tankName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'familjen'}`;
    const payload: SavedTankPlan = {
      id,
      name: tankName || 'Vårt Akvarium',
      creator: 'Familjen',
      liters: tankLiters,
      aquascape,
      fish: fishEntries,
      checkedEquipment,
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/tanks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const listRes = await fetch('/api/tanks');
        if (listRes.ok) {
          const data = await listRes.json();
          if (Array.isArray(data.tanks)) setSavedTanks(data.tanks);
        }
      }
    } catch {}

    try {
      confetti({
        particleCount: 55,
        spread: 70,
        origin: { y: 0.7 },
      });
    } catch {}

    setSaveSuccessMessage(
      lang === 'sv' ? 'Akvariet sparat!' : 'Aquarium plan saved!'
    );
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Filtered species list
  const filteredSpecies = useMemo(() => {
    return FISH_SPECIES.filter((sp) => {
      if (selectedCategory !== 'all' && sp.category !== selectedCategory) {
        return false;
      }
      if (selectedZone !== 'all' && sp.zone !== selectedZone && sp.zone !== 'all') {
        return false;
      }
      if (onlyCompatibleWithTankSize && sp.minTankLiters > tankLiters) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          sp.nameSv.toLowerCase().includes(q) ||
          sp.nameEn.toLowerCase().includes(q) ||
          sp.scientificName.toLowerCase().includes(q) ||
          sp.summarySv.toLowerCase().includes(q) ||
          sp.summaryEn.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [selectedCategory, selectedZone, onlyCompatibleWithTankSize, tankLiters, searchQuery]);

  const categories: { id: FishCategory | 'all'; labelSv: string; labelEn: string }[] = [
    { id: 'all', labelSv: 'Alla arter (15)', labelEn: 'All Species (15)' },
    { id: 'tetras_schooling', labelSv: 'Stimfiskar & Tetror', labelEn: 'Schooling & Tetras' },
    { id: 'livebearers', labelSv: 'Guppy, Platy & Färg', labelEn: 'Livebearers (Guppy/Platy)' },
    { id: 'centerpiece', labelSv: 'Kampfisk & Gurami', labelEn: 'Centerpiece (Betta/Gourami)' },
    { id: 'cichlids_special', labelSv: 'Snälla Ciklider & Skalar', labelEn: 'Cichlids & Angelfish' },
    { id: 'bottom_algae', labelSv: 'Bottenfiskar & Algätare', labelEn: 'Bottom & Algae Crew' },
    { id: 'shrimp_snails', labelSv: 'Räkor & Snäckor', labelEn: 'Shrimp & Snails' },
  ];

  const tankSizes = [30, 45, 54, 60, 80, 110, 180, 240];

  const hasConflictWithCurrentTank = (candidate: FishSpecies): string | null => {
    for (const entry of fishEntries) {
      if (entry.count <= 0) continue;
      if (entry.speciesId === candidate.id) continue;
      const existing = FISH_SPECIES.find((s) => s.id === entry.speciesId);
      if (!existing) continue;
      if (
        candidate.incompatibleWithIds.includes(existing.id) ||
        existing.incompatibleWithIds.includes(candidate.id)
      ) {
        return lang === 'sv' ? existing.nameSv : existing.nameEn;
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-abyss-950 text-slate-100">
      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-30 bg-abyss-950/90 backdrop-blur-md border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Fish className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Fena
                </span>
                <span className="text-[10px] font-mono uppercase font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {lang === 'sv' ? 'Akvariebyggaren' : 'Aquarium Explorer'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {lang === 'sv'
                  ? 'Utforska akvariefiskar, testa vilka som trivs ihop och se dem simma direkt'
                  : 'Explore freshwater species, test compatibility & watch them swim'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-abyss-900 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                playBubbleSound();
                setActiveTab('explore');
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-cyan-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Fish className="w-3.5 h-3.5" />
              <span>{lang === 'sv' ? 'Utforska Fiskar' : 'Explore Fish'}</span>
            </button>

            <button
              onClick={() => {
                playBubbleSound();
                setActiveTab('planner');
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'planner'
                  ? 'bg-cyan-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>
                {lang === 'sv' ? 'Akvarie-Kollen' : 'Tank Check'} ({analysis.totalFishCount})
              </span>
              {analysis.alerts.some((a) => a.severity === 'error') && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>

            <button
              onClick={() => {
                playBubbleSound();
                setActiveTab('checklist');
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'checklist'
                  ? 'bg-cyan-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{lang === 'sv' ? 'Inköpslista & Guide' : 'Shopping List'}</span>
            </button>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'sv' ? 'en' : 'sv')}
            className="px-3 py-1.5 rounded-xl bg-abyss-900 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lang === 'sv' ? 'SV / EN' : 'EN / SV'}</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-5 space-y-6">
        {/* LIVE AQUARIUM SIMULATOR + QUICK TANK BAR */}
        <section className="space-y-3">
          <InteractiveAquarium
            liters={tankLiters}
            fishEntries={fishEntries}
            aquascape={aquascape}
            onAquascapeChange={setAquascape}
            onInspectSpecies={(sp) => setInspectedSpecies(sp)}
            lang={lang}
          />

          {/* Quick Tank Size, Starter Presets & Status Strip */}
          <div className="bg-abyss-900/90 border border-cyan-500/20 rounded-2xl p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Tank Size Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider mr-1">
                {lang === 'sv' ? 'Akvariestorlek:' : 'Tank Size:'}
              </span>
              {tankSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    playBubbleSound();
                    setTankLiters(size);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                    tankLiters === size
                      ? 'bg-cyan-400 text-slate-950 font-black shadow-sm'
                      : 'bg-abyss-950 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {size}L
                </button>
              ))}
            </div>

            {/* Starter Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {lang === 'sv' ? 'Färdiga förslag:' : 'Starter Tanks:'}
              </span>
              {STARTER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.id)}
                  className="px-3 py-1 rounded-xl bg-abyss-950 hover:bg-abyss-800 border border-amber-500/30 hover:border-amber-400 text-amber-200 text-xs font-bold transition cursor-pointer"
                >
                  {lang === 'sv' ? preset.nameSv : preset.nameEn}
                </button>
              ))}
              {fishEntries.length > 0 && (
                <button
                  onClick={() => {
                    playBubbleSound();
                    setFishEntries([]);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-abyss-950 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  title={lang === 'sv' ? 'Töm akvariet och börja från noll' : 'Empty tank'}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{lang === 'sv' ? 'Töm' : 'Clear'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Current Fish Pill Bar + Instant Compatibility Summary */}
          {fishEntries.length > 0 && (
            <div className="bg-abyss-900/70 border border-slate-800 rounded-2xl p-3 sm:px-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400">
                  {lang === 'sv' ? 'I akvariet just nu:' : 'Currently in tank:'}
                </span>
                {fishEntries.map((entry) => {
                  const sp = FISH_SPECIES.find((s) => s.id === entry.speciesId);
                  if (!sp) return null;
                  return (
                    <div
                      key={sp.id}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-xl bg-abyss-950 border border-cyan-500/30 text-xs"
                    >
                      <button
                        onClick={() => setInspectedSpecies(sp)}
                        className="font-bold text-white hover:text-cyan-300 cursor-pointer"
                      >
                        {entry.count}× {lang === 'sv' ? sp.nameSv : sp.nameEn}
                      </button>
                      <button
                        onClick={() => handleSetSpeciesCount(sp.id, entry.count - 1)}
                        className="w-5 h-5 rounded-md bg-abyss-800 hover:bg-abyss-700 text-slate-300 flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleSetSpeciesCount(sp.id, entry.count + 1)}
                        className="w-5 h-5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Quick Health Badge */}
              <div className="flex items-center gap-3">
                <div className="text-xs font-mono">
                  <span className="text-slate-400">
                    {lang === 'sv' ? 'Belastning: ' : 'Bioload: '}
                  </span>
                  <span
                    className={`font-black ${
                      analysis.bioloadPercent > 105
                        ? 'text-rose-400'
                        : analysis.bioloadPercent > 85
                        ? 'text-amber-300'
                        : 'text-emerald-400'
                    }`}
                  >
                    {analysis.bioloadPercent}%
                  </span>
                </div>

                {analysis.alerts.some((a) => a.severity === 'error') ? (
                  <button
                    onClick={() => setActiveTab('planner')}
                    className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>
                      {lang === 'sv' ? 'Krock upptäckt — visa detaljer' : 'Conflict found — view'}
                    </span>
                  </button>
                ) : analysis.alerts.some((a) => a.severity === 'warning') ? (
                  <button
                    onClick={() => setActiveTab('planner')}
                    className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {lang === 'sv' ? 'Stim-tips finns' : 'Group size tip'}
                    </span>
                  </button>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === 'sv' ? 'Alla fiskar trivs ihop!' : 'All fish compatible!'}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ==================== TAB 1: EXPLORE SPECIES ==================== */}
        {activeTab === 'explore' && (
          <section className="space-y-5">
            {/* Search & Filter Controls */}
            <div className="bg-abyss-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      lang === 'sv'
                        ? 'Sök efter fiskart (t.ex. Neontetra, Guppy, Kampfisk, Pansarmal, Räka)...'
                        : 'Search species (e.g. Neon Tetra, Guppy, Betta, Corydoras, Shrimp)...'
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-abyss-950 border border-slate-800 focus:border-cyan-400 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>

                {/* Water Zone & Tank Fit Toggles */}
                <div className="flex flex-wrap items-center gap-2">
                  {(['all', 'top', 'middle', 'bottom'] as const).map((z) => (
                    <button
                      key={z}
                      onClick={() => {
                        playBubbleSound();
                        setSelectedZone(z);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        selectedZone === z
                          ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50'
                          : 'bg-abyss-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {z === 'all'
                        ? lang === 'sv'
                          ? 'Alla skikt'
                          : 'All Zones'
                        : z === 'top'
                        ? lang === 'sv'
                          ? 'Yta'
                          : 'Top'
                        : z === 'middle'
                        ? lang === 'sv'
                          ? 'Mitten'
                          : 'Middle'
                        : lang === 'sv'
                        ? 'Botten'
                        : 'Bottom'}
                    </button>
                  ))}

                  <button
                    onClick={() => setOnlyCompatibleWithTankSize(!onlyCompatibleWithTankSize)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      onlyCompatibleWithTankSize
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                        : 'bg-abyss-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang === 'sv' ? `Passar ${tankLiters}L` : `Fits ${tankLiters}L`}
                  </button>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      playBubbleSound();
                      setSelectedCategory(cat.id);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-cyan-400 text-slate-950 shadow-md'
                        : 'bg-abyss-950 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {lang === 'sv' ? cat.labelSv : cat.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Species Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredSpecies.map((sp) => {
                const count = getCountForSpecies(sp.id);
                const conflictName = hasConflictWithCurrentTank(sp);
                const tooSmallTank = sp.minTankLiters > tankLiters;

                return (
                  <div
                    key={sp.id}
                    onClick={() => setInspectedSpecies(sp)}
                    className={`rounded-3xl border p-5 transition-all flex flex-col justify-between gap-4 cursor-pointer group ${
                      count > 0
                        ? 'bg-abyss-900/95 border-cyan-400/60 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-400/30'
                        : 'bg-abyss-900/75 border-slate-800/90 hover:border-cyan-500/40 hover:bg-abyss-900'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top row: Illustration & Title */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-abyss-950 border border-slate-700 text-[10px] font-bold text-cyan-300">
                              {sp.zone === 'top'
                                ? lang === 'sv'
                                  ? 'Yta'
                                  : 'Top'
                                : sp.zone === 'middle'
                                ? lang === 'sv'
                                  ? 'Mitten'
                                  : 'Middle'
                                : sp.zone === 'bottom'
                                ? lang === 'sv'
                                  ? 'Botten'
                                  : 'Bottom'
                                : lang === 'sv'
                                ? 'Hela'
                                : 'All'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                sp.temperament === 'peaceful'
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {sp.temperament === 'peaceful'
                                ? lang === 'sv'
                                  ? 'Fredlig'
                                  : 'Peaceful'
                                : sp.temperament === 'territorial'
                                ? lang === 'sv'
                                  ? 'Revir/Ensam'
                                  : 'Territorial'
                                : lang === 'sv'
                                ? 'Livlig'
                                : 'Active'}
                            </span>
                          </div>

                          <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-cyan-300 transition-colors">
                            {lang === 'sv' ? sp.nameSv : sp.nameEn}
                          </h3>
                          <p className="text-[11px] italic text-slate-400">
                            {sp.scientificName} • {sp.sizeCm} cm
                          </p>
                        </div>

                        {/* Fish SVG Preview */}
                        <div className="w-24 h-16 rounded-2xl bg-abyss-950/90 border border-slate-800 flex items-center justify-center p-2 group-hover:scale-105 transition-transform flex-shrink-0">
                          <FishIllustration visual={sp.visual} className="w-20 h-12" />
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {lang === 'sv' ? sp.summarySv : sp.summaryEn}
                      </p>

                      {/* Kid Fun Fact Teaser */}
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {lang === 'sv' ? sp.funFactSv : sp.funFactEn}
                        </span>
                      </div>

                      {/* Compatibility / Tank Size Alerts on Card */}
                      {(conflictName || tooSmallTank) && (
                        <div className="flex flex-wrap gap-1.5">
                          {tooSmallTank && (
                            <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {lang === 'sv'
                                ? `Kräver minst ${sp.minTankLiters}L`
                                : `Needs ${sp.minTankLiters}L+`}
                            </span>
                          )}
                          {conflictName && (
                            <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {lang === 'sv'
                                ? `Passar ej med ${conflictName}`
                                : `Clashes with ${conflictName}`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Bottom Bar: Specs & Add Controls */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2"
                    >
                      <div className="text-[11px] text-slate-400 font-mono">
                        <span>Minst {sp.minTankLiters}L</span> •{' '}
                        <span>
                          {sp.tempMinC}–{sp.tempMaxC}°C
                        </span>
                      </div>

                      {count === 0 ? (
                        <button
                          onClick={() => handleQuickAddSpecies(sp)}
                          className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-400 text-cyan-200 hover:text-slate-950 border border-cyan-400/40 font-extrabold text-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {lang === 'sv'
                              ? sp.minGroupSize > 1
                                ? `Lägg till stim (${sp.recommendedGroupSize} st)`
                                : 'Lägg i akvariet'
                              : sp.minGroupSize > 1
                              ? `Add school (${sp.recommendedGroupSize})`
                              : 'Add to tank'}
                          </span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-abyss-950 border border-cyan-400/50 rounded-xl p-1">
                          <button
                            onClick={() => {
                              playBubbleSound();
                              handleSetSpeciesCount(sp.id, count - 1);
                            }}
                            className="w-7 h-7 rounded-lg bg-abyss-800 hover:bg-abyss-700 text-white flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 font-mono font-black text-sm text-cyan-300">
                            {count} st
                          </span>
                          <button
                            onClick={() => {
                              playBubbleSound();
                              handleSetSpeciesCount(sp.id, count + 1);
                            }}
                            className="w-7 h-7 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center font-bold cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ==================== TAB 2: TANK PLANNER & COMPATIBILITY ==================== */}
        {activeTab === 'planner' && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Compatibility Report & Species List */}
            <div className="lg:col-span-2 space-y-5">
              {/* Alerts & Recommendations */}
              <div className="bg-abyss-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <span>
                      {lang === 'sv'
                        ? 'Kompatibilitet & Vattenvärden'
                        : 'Compatibility & Water Parameters'}
                    </span>
                  </h2>
                </div>

                {analysis.alerts.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    {lang === 'sv'
                      ? 'Lägg till fiskar i akvariet för att se hur de passar ihop!'
                      : 'Add fish to your tank to analyze compatibility!'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analysis.alerts.map((alert) => {
                      const isError = alert.severity === 'error';
                      const isWarn = alert.severity === 'warning';
                      const isSuccess = alert.severity === 'success';

                      return (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                            isError
                              ? 'bg-rose-500/10 border-rose-500/40 text-rose-100'
                              : isWarn
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-100'
                              : isSuccess
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-100'
                              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-100'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {isError ? (
                              <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                            ) : isWarn ? (
                              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            ) : isSuccess ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-1">
                              <h4 className="text-sm font-extrabold">
                                {lang === 'sv' ? alert.titleSv : alert.titleEn}
                              </h4>
                              <p className="text-xs opacity-90 leading-relaxed">
                                {lang === 'sv' ? alert.detailSv : alert.detailEn}
                              </p>
                            </div>
                          </div>

                          {/* 1-Tap Auto-fix for Schooling Size Warning */}
                          {alert.id.startsWith('school-size-') && alert.speciesIds?.[0] && (
                            <button
                              onClick={() => {
                                const spId = alert.speciesIds![0];
                                const sp = FISH_SPECIES.find((s) => s.id === spId);
                                if (sp) {
                                  playBubbleSound();
                                  handleSetSpeciesCount(sp.id, sp.minGroupSize);
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs whitespace-nowrap cursor-pointer flex-shrink-0"
                            >
                              {lang === 'sv' ? 'Fyll upp stimmet' : 'Fix school size'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Detailed List of Selected Species */}
              <div className="bg-abyss-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <h3 className="text-base font-black text-white">
                  {lang === 'sv'
                    ? `Valda arter i akvariet (${analysis.totalFishCount} individer)`
                    : `Selected Species (${analysis.totalFishCount} total)`}
                </h3>

                {fishEntries.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    {lang === 'sv' ? 'Inga fiskar valda ännu.' : 'No fish selected yet.'}
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {fishEntries.map((entry) => {
                      const sp = FISH_SPECIES.find((s) => s.id === entry.speciesId);
                      if (!sp) return null;
                      return (
                        <div
                          key={sp.id}
                          className="p-3.5 rounded-2xl bg-abyss-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div
                            onClick={() => setInspectedSpecies(sp)}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <FishIllustration visual={sp.visual} className="w-16 h-10" />
                            <div>
                              <h4 className="text-sm font-extrabold text-white hover:text-cyan-300">
                                {lang === 'sv' ? sp.nameSv : sp.nameEn}
                              </h4>
                              <p className="text-[11px] text-slate-400">
                                {sp.tempMinC}–{sp.tempMaxC}°C • pH {sp.phMin}–{sp.phMax} •{' '}
                                {sp.sizeCm} cm
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSetSpeciesCount(sp.id, entry.count - 1)}
                              className="w-8 h-8 rounded-xl bg-abyss-800 hover:bg-abyss-700 text-white flex items-center justify-center cursor-pointer"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-10 text-center font-mono font-black text-sm text-cyan-300">
                              {entry.count} st
                            </span>
                            <button
                              onClick={() => handleSetSpeciesCount(sp.id, entry.count + 1)}
                              className="w-8 h-8 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center font-bold cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSetSpeciesCount(sp.id, 0)}
                              className="p-2 rounded-xl text-slate-500 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Water Parameters, Zone Distribution & Cloud Save */}
            <div className="space-y-5">
              {/* Bioload & Parameters Card */}
              <div className="bg-abyss-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                <h3 className="text-base font-black text-white">
                  {lang === 'sv' ? 'Balans & Vattenskikt' : 'Tank Balance & Zones'}
                </h3>

                {/* Bioload Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">
                      {lang === 'sv' ? 'Biologisk belastning' : 'Bioload Capacity'}
                    </span>
                    <span className="font-mono text-cyan-300">{analysis.bioloadPercent}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-abyss-950 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        analysis.bioloadPercent > 105
                          ? 'bg-rose-500'
                          : analysis.bioloadPercent > 85
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, analysis.bioloadPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Water Parameters Sweet Spot */}
                {analysis.tempOverlap && (
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="p-3 rounded-2xl bg-abyss-950 border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                        {lang === 'sv' ? 'Måltemperatur' : 'Target Temp'}
                      </span>
                      <div className="text-base font-black font-mono text-white mt-0.5">
                        {analysis.tempOverlap.valid
                          ? `${analysis.tempOverlap.min}–${analysis.tempOverlap.max}°C`
                          : 'Krock!'}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-abyss-950 border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                        {lang === 'sv' ? 'Gemensamt pH' : 'Target pH'}
                      </span>
                      <div className="text-base font-black font-mono text-white mt-0.5">
                        {analysis.phOverlap?.valid
                          ? `${analysis.phOverlap.min.toFixed(1)}–${analysis.phOverlap.max.toFixed(1)}`
                          : 'Krock!'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Water Zone Breakdown */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold text-slate-400 block">
                    {lang === 'sv' ? 'Fördelning i vattenskikten:' : 'Water Zone Distribution:'}
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-abyss-950">
                      <span className="text-cyan-300 font-bold">
                        {lang === 'sv' ? 'Ytskiktet (Top)' : 'Top Zone'}
                      </span>
                      <span className="font-mono font-bold">{analysis.zoneCounts.top} st</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-abyss-950">
                      <span className="text-emerald-300 font-bold">
                        {lang === 'sv' ? 'Mellanskiktet (Mitten)' : 'Mid Zone'}
                      </span>
                      <span className="font-mono font-bold">{analysis.zoneCounts.middle} st</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-abyss-950">
                      <span className="text-amber-300 font-bold">
                        {lang === 'sv' ? 'Bottenskiktet (Botten)' : 'Bottom Zone'}
                      </span>
                      <span className="font-mono font-bold">{analysis.zoneCounts.bottom} st</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save / Load Family Tank Plans (SQLite Persistence) */}
              <div className="bg-abyss-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-cyan-400" />
                  <span>{lang === 'sv' ? 'Spara Ert Akvarium' : 'Save Tank Plan'}</span>
                </h3>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={tankName}
                    onChange={(e) => setTankName(e.target.value)}
                    placeholder={lang === 'sv' ? 'Namn på akvariet...' : 'Tank name...'}
                    className="w-full px-3.5 py-2 rounded-xl bg-abyss-950 border border-slate-700 text-sm text-white outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleSaveTankToCloud}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    {lang === 'sv' ? 'Spara i databasen' : 'Save to Database'}
                  </button>
                  {saveSuccessMessage && (
                    <p className="text-xs text-emerald-400 font-bold text-center">
                      {saveSuccessMessage}
                    </p>
                  )}
                </div>

                {savedTanks.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-xs font-bold text-slate-400 block">
                      {lang === 'sv' ? 'Sparade akvarier:' : 'Saved Tanks:'}
                    </span>
                    {savedTanks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          playBubbleSound();
                          setTankName(t.name);
                          setTankLiters(t.liters);
                          setAquascape(t.aquascape);
                          setFishEntries(t.fish);
                        }}
                        className="p-2.5 rounded-xl bg-abyss-950 hover:bg-abyss-850 border border-slate-800 flex items-center justify-between cursor-pointer text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{t.name}</div>
                          <div className="text-[10px] text-slate-400">{t.liters}L</div>
                        </div>
                        <span className="text-cyan-400 font-bold">
                          {lang === 'sv' ? 'Öppna' : 'Load'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ==================== TAB 3: SHOPPING LIST & STARTER GUIDE ==================== */}
        {activeTab === 'checklist' && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fish Shopping List for the Pet Store */}
            <div className="bg-abyss-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-cyan-400" />
                  <span>
                    {lang === 'sv'
                      ? `Inköpslista till Djuraffären (${tankLiters}L)`
                      : `Fish Store Shopping List (${tankLiters}L)`}
                  </span>
                </h2>
              </div>

              {fishEntries.length === 0 ? (
                <p className="text-sm text-slate-400">
                  {lang === 'sv'
                    ? 'Ni har inte lagt till några fiskar i akvariet än.'
                    : 'No fish added to the list yet.'}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {fishEntries.map((entry) => {
                    const sp = FISH_SPECIES.find((s) => s.id === entry.speciesId);
                    if (!sp) return null;
                    return (
                      <div
                        key={sp.id}
                        className="p-3.5 rounded-2xl bg-abyss-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <FishIllustration visual={sp.visual} className="w-14 h-9" />
                          <div>
                            <div className="text-sm font-extrabold text-white">
                              {entry.count} st {lang === 'sv' ? sp.nameSv : sp.nameEn}
                            </div>
                            <div className="text-[11px] italic text-slate-400">
                              {sp.scientificName}
                            </div>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 font-mono text-xs font-bold">
                          {sp.dietSv.split('—')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Kid-Friendly 3-Step Startup Guide */}
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-2.5 mt-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>
                    {lang === 'sv'
                      ? 'Så här startar ni ert akvarium steg för steg:'
                      : 'How to start your aquarium step-by-step:'}
                  </span>
                </h3>
                <ol className="text-xs text-slate-200 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    <strong>{lang === 'sv' ? 'Dag 1 — Inred & fyll vatten:' : 'Day 1 — Setup:'}</strong>{' '}
                    {lang === 'sv'
                      ? 'Skölj sanden i en hink, lägg i sand, rötter och växter. Fyll på vatten, tillsätt vattenberedningsmedel och starta filter + doppvärmare (25°C).'
                      : 'Rinse sand, place driftwood and live plants, fill with conditioned water, and turn on filter & heater.'}
                  </li>
                  <li>
                    <strong>
                      {lang === 'sv' ? 'Vecka 1 — Nyttobakterier & tåliga pionjärer:' : 'Week 1 — Cycle:'}
                    </strong>{' '}
                    {lang === 'sv'
                      ? 'Tillsätt bakteriekultur på flaska. Börja med den första fiskgruppen (t.ex. 6 pansarmalar eller tetror) och mata pyttelite första veckan!'
                      : 'Add beneficial starter bacteria and introduce your first hardy group instead of all fish on day one.'}
                  </li>
                  <li>
                    <strong>
                      {lang === 'sv' ? 'Vecka 3+ — Fyll på resten av invånarna:' : 'Week 3+ — Full crew:'}
                    </strong>{' '}
                    {lang === 'sv'
                      ? 'När filtret är inkört kan ni skaffa resten av fiskarna! Byt ca 25% av vattnet en gång i veckan.'
                      : 'Once the filter matures, add the remaining fish and do a 25% weekly water change.'}
                  </li>
                </ol>
              </div>
            </div>

            {/* Equipment Checklist */}
            <div className="bg-abyss-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <h2 className="text-lg font-black text-white">
                {lang === 'sv' ? 'Checklista för Utrustning' : 'Equipment Checklist'}
              </h2>
              <div className="space-y-2.5">
                {EQUIPMENT_CHECKLIST.map((item) => {
                  const isChecked = checkedEquipment.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        playBubbleSound();
                        setCheckedEquipment((prev) =>
                          prev.includes(item.id)
                            ? prev.filter((id) => id !== item.id)
                            : [...prev, item.id]
                        );
                      }}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : 'bg-abyss-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isChecked
                            ? 'bg-emerald-400 text-slate-950'
                            : 'border border-slate-600 bg-abyss-900'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-sm font-extrabold text-white">
                          {lang === 'sv' ? item.nameSv : item.nameEn}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {lang === 'sv' ? item.whySv : item.whyEn}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* SPECIES DETAIL MODAL */}
      <SpeciesDetailModal
        species={inspectedSpecies}
        currentCount={inspectedSpecies ? getCountForSpecies(inspectedSpecies.id) : 0}
        onClose={() => setInspectedSpecies(null)}
        onChangeCount={handleSetSpeciesCount}
        onSelectOtherSpecies={(sp) => setInspectedSpecies(sp)}
        lang={lang}
      />
    </div>
  );
}
