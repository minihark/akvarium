import React, { useState, useEffect, useMemo } from 'react';
import {
  Language,
  FishSpecies,
  TankFishEntry,
  AquascapeTheme,
  SavedTankPlan,
} from './types';
import { FISH_SPECIES, STARTER_PRESETS, EQUIPMENT_CHECKLIST } from './data/species';
import { getKidMeta } from './data/kidExtras';
import { analyzeTank } from './utils/compatibility';
import { InteractiveAquarium } from './components/InteractiveAquarium';
import { SpeciesDetailModal } from './components/SpeciesDetailModal';
import { playBubbleSound, playFeedSplashSound, speakKidsText } from './utils/audio';
import confetti from 'canvas-confetti';
import {
  Fish,
  Search,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShoppingBag,
  Bookmark,
  RotateCcw,
  Check,
  Volume2,
  ChevronDown,
} from 'lucide-react';

const STORAGE_KEY_TANK = 'fena_active_tank_v1';

type SimpleGroupFilter = 'all' | 'schooling' | 'centerpiece' | 'bottom';

export function App() {
  const [lang, setLang] = useState<Language>('sv');
  const [activeView, setActiveView] = useState<'explore' | 'checklist'>('explore');
  const [showHealthDetails, setShowHealthDetails] = useState(false);

  const [tankName, setTankName] = useState<string>('Vårt Akvarium');
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

  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<SimpleGroupFilter>('all');
  const [inspectedSpecies, setInspectedSpecies] = useState<FishSpecies | null>(null);
  const [savedTanks, setSavedTanks] = useState<SavedTankPlan[]>([]);
  const [copiedChecklist, setCopiedChecklist] = useState(false);

  useEffect(() => {
    fetch('/api/tanks')
      .then((r) => (r.ok ? r.json() : { tanks: [] }))
      .then((data) => {
        if (Array.isArray(data.tanks)) setSavedTanks(data.tanks);
      })
      .catch(() => {});
  }, []);

  const analysis = useMemo(
    () => analyzeTank(tankLiters, fishEntries),
    [tankLiters, fishEntries]
  );

  const getCountForSpecies = (speciesId: string): number => {
    return fishEntries.find((e) => e.speciesId === speciesId)?.count || 0;
  };

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

  const handleQuickAddSpecies = (sp: FishSpecies) => {
    playBubbleSound();
    const curr = getCountForSpecies(sp.id);
    if (curr === 0) {
      handleSetSpeciesCount(sp.id, sp.recommendedGroupSize);
    } else {
      handleSetSpeciesCount(sp.id, curr + 1);
    }
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = STARTER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    playFeedSplashSound();
    setTankLiters(preset.liters);
    setAquascape(preset.aquascape);
    setTankName(lang === 'sv' ? preset.nameSv : preset.nameEn);
    setFishEntries(preset.fish.map((f) => ({ ...f })));
  };

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
      confetti({ particleCount: 45, spread: 65, origin: { y: 0.7 } });
    } catch {}
  };

  const filteredSpecies = useMemo(() => {
    return FISH_SPECIES.filter((sp) => {
      if (groupFilter === 'schooling' && sp.category !== 'tetras_schooling') {
        return false;
      }
      if (
        groupFilter === 'centerpiece' &&
        sp.category !== 'centerpiece' &&
        sp.category !== 'livebearers' &&
        sp.category !== 'cichlids_special'
      ) {
        return false;
      }
      if (
        groupFilter === 'bottom' &&
        sp.category !== 'bottom_algae' &&
        sp.category !== 'shrimp_snails'
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          sp.nameSv.toLowerCase().includes(q) ||
          sp.nameEn.toLowerCase().includes(q) ||
          sp.scientificName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [groupFilter, searchQuery]);

  const hasConflictWithCurrentTank = (candidate: FishSpecies): string | null => {
    for (const entry of fishEntries) {
      if (entry.count <= 0 || entry.speciesId === candidate.id) continue;
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

  const copyShoppingList = () => {
    const fishLines = fishEntries
      .map((e) => {
        const sp = FISH_SPECIES.find((s) => s.id === e.speciesId);
        return sp ? `- ${e.count} st ${sp.nameSv} (${sp.scientificName})` : null;
      })
      .filter(Boolean)
      .join('\n');

    const equipLines = EQUIPMENT_CHECKLIST.map((item) => {
      const done = checkedEquipment.includes(item.id);
      return `${done ? '[x]' : '[ ]'} ${item.nameSv}`;
    }).join('\n');

    const text = `INKÖPSLISTA — ${tankName} (${tankLiters} Liter)\n\nFISKAR:\n${
      fishLines || '(Inga valda ännu)'
    }\n\nUTRUSTNING:\n${equipLines}`;

    navigator.clipboard?.writeText(text);
    setCopiedChecklist(true);
    setTimeout(() => setCopiedChecklist(false), 2500);
  };

  const tankSizes = [30, 45, 54, 60, 80, 110, 180, 240];
  const hasErrors = analysis.alerts.some((a) => a.severity === 'error');
  const hasWarnings = analysis.alerts.some((a) => a.severity === 'warning');

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#12262A]">
      {/* CLEAN, CALM EDITORIAL HEADER */}
      <header className="sticky top-0 z-30 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E6E0D5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0D9488] text-white flex items-center justify-center shadow-sm">
              <Fish className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-[#12262A] leading-none">
                Fena
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {lang === 'sv' ? 'Upptäck fiskar & bygg ert akvarium' : 'Aquarium Explorer'}
              </p>
            </div>
          </div>

          {/* Right Controls: Tank Size Select, Starter Select, and View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tank Size Select */}
            <div className="relative">
              <select
                value={tankLiters}
                onChange={(e) => {
                  playBubbleSound();
                  setTankLiters(Number(e.target.value));
                }}
                aria-label="Tank size"
                className="appearance-none pl-3.5 pr-8 py-2 rounded-full bg-white border border-[#E6E0D5] text-xs font-extrabold text-[#12262A] cursor-pointer hover:border-teal-600/40 focus:outline-none shadow-2xs"
              >
                {tankSizes.map((s) => (
                  <option key={s} value={s}>
                    {lang === 'sv' ? `Akvarium: ${s} L` : `Tank: ${s} L`}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Starter Preset Select */}
            <div className="relative">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) handleApplyPreset(e.target.value);
                }}
                aria-label="Starter presets"
                className="appearance-none pl-3.5 pr-8 py-2 rounded-full bg-white border border-[#E6E0D5] text-xs font-bold text-slate-700 cursor-pointer hover:border-teal-600/40 focus:outline-none shadow-2xs"
              >
                <option value="" disabled>
                  {lang === 'sv' ? 'Färdiga förslag…' : 'Starter tanks…'}
                </option>
                {STARTER_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {lang === 'sv' ? `${p.nameSv} (${p.liters}L)` : `${p.nameEn} (${p.liters}L)`}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 2-Tab Switcher: Fiskar vs Inköpslista */}
            <div className="flex items-center bg-[#EFECE6] p-1 rounded-full">
              <button
                onClick={() => setActiveView('explore')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer ${
                  activeView === 'explore'
                    ? 'bg-white text-[#12262A] shadow-xs'
                    : 'text-slate-600 hover:text-[#12262A]'
                }`}
              >
                {lang === 'sv' ? 'Fiskar' : 'Fish'}
              </button>
              <button
                onClick={() => setActiveView('checklist')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition flex items-center gap-1 cursor-pointer ${
                  activeView === 'checklist'
                    ? 'bg-white text-[#12262A] shadow-xs'
                    : 'text-slate-600 hover:text-[#12262A]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{lang === 'sv' ? 'Inköpslista' : 'Checklist'}</span>
              </button>
            </div>

            <button
              onClick={() => setLang(lang === 'sv' ? 'en' : 'sv')}
              className="px-2.5 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:text-[#12262A] cursor-pointer"
            >
              {lang === 'sv' ? 'EN' : 'SV'}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* 1. LIVE INTERACTIVE AQUARIUM */}
        <section className="space-y-3">
          <InteractiveAquarium
            liters={tankLiters}
            fishEntries={fishEntries}
            aquascape={aquascape}
            onAquascapeChange={setAquascape}
            onInspectSpecies={(sp) => setInspectedSpecies(sp)}
            lang={lang}
          />

          {/* Calm Single-Row Active Fish & Compatibility Strip */}
          {fishEntries.length > 0 && (
            <div className="bg-white border border-[#E6E0D5] rounded-2xl p-3 sm:px-4 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Fish Avatars in Tank */}
                <div className="flex flex-wrap items-center gap-2">
                  {fishEntries.map((entry) => {
                    const sp = FISH_SPECIES.find((s) => s.id === entry.speciesId);
                    if (!sp) return null;
                    const meta = getKidMeta(sp.id);
                    return (
                      <div
                        key={sp.id}
                        className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full bg-[#FAF7F2] border border-[#E6E0D5] text-xs"
                      >
                        <img
                          src={meta.photoUrl}
                          alt={sp.nameSv}
                          onClick={() => setInspectedSpecies(sp)}
                          className="w-6 h-6 rounded-full object-cover cursor-pointer"
                        />
                        <button
                          onClick={() => setInspectedSpecies(sp)}
                          className="font-bold text-[#12262A] hover:text-teal-700 cursor-pointer"
                        >
                          {entry.count}× {lang === 'sv' ? sp.nameSv : sp.nameEn}
                        </button>
                        <button
                          onClick={() => handleSetSpeciesCount(sp.id, entry.count - 1)}
                          className="w-5 h-5 rounded-full bg-white hover:bg-slate-100 border border-[#E6E0D5] text-slate-600 flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleSetSpeciesCount(sp.id, entry.count + 1)}
                          className="w-5 h-5 rounded-full bg-white hover:bg-teal-50 border border-[#E6E0D5] text-teal-700 flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    );
                  })}

                  <button
                    onClick={() => {
                      playBubbleSound();
                      setFishEntries([]);
                    }}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{lang === 'sv' ? 'Töm' : 'Clear'}</span>
                  </button>
                </div>

                {/* Single Compatibility Pill (Click to expand details if needed) */}
                <button
                  onClick={() => setShowHealthDetails(!showHealthDetails)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition ${
                    hasErrors
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : hasWarnings
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  }`}
                >
                  {hasErrors ? (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>
                        {lang === 'sv' ? 'Fiskar krockar — visa varför' : 'Conflict — view'}
                      </span>
                    </>
                  ) : hasWarnings ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>
                        {lang === 'sv' ? 'Tips om stimstorlek — visa' : 'Group tip — view'}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        {lang === 'sv'
                          ? `Alla ${analysis.totalFishCount} fiskar trivs ihop (${analysis.bioloadPercent}% plats)`
                          : `All ${analysis.totalFishCount} fish compatible (${analysis.bioloadPercent}% full)`}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Expandable Alerts Drawer */}
              {showHealthDetails && analysis.alerts.length > 0 && (
                <div className="pt-3 border-t border-[#E6E0D5] space-y-2">
                  {analysis.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E6E0D5] flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-extrabold text-[#12262A]">
                          {lang === 'sv' ? alert.titleSv : alert.titleEn}:{' '}
                        </span>
                        <span className="text-slate-600">
                          {lang === 'sv' ? alert.detailSv : alert.detailEn}
                        </span>
                      </div>

                      {alert.id.startsWith('school-size-') && alert.speciesIds?.[0] && (
                        <button
                          onClick={() => {
                            const sp = FISH_SPECIES.find((s) => s.id === alert.speciesIds![0]);
                            if (sp) {
                              playBubbleSound();
                              handleSetSpeciesCount(sp.id, sp.minGroupSize);
                            }
                          }}
                          className="px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-white font-extrabold text-xs cursor-pointer"
                        >
                          {lang === 'sv' ? 'Fyll upp stimmet' : 'Fix group size'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 2A. PICTURE-BOOK SPECIES EXPLORER */}
        {activeView === 'explore' && (
          <section className="space-y-6">
            {/* Simple 4-Tab Bar + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E0D5] pb-4">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(
                  [
                    { id: 'all', sv: 'Alla arter (21)', en: 'All Species (21)' },
                    { id: 'schooling', sv: 'Stimfiskar', en: 'Schooling Fish' },
                    { id: 'centerpiece', sv: 'Färgklickar & Kungar', en: 'Centerpiece & Color' },
                    { id: 'bottom', sv: 'Botten & Städpatrull', en: 'Bottom & Cleaners' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      playBubbleSound();
                      setGroupFilter(tab.id);
                    }}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold whitespace-nowrap transition cursor-pointer ${
                      groupFilter === tab.id
                        ? 'bg-[#12262A] text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-[#12262A] border border-[#E6E0D5]'
                    }`}
                  >
                    {lang === 'sv' ? tab.sv : tab.en}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === 'sv' ? 'Sök fisk (t.ex. Guppy, Räka)…' : 'Search fish…'}
                  className="w-full pl-9 pr-4 py-2 rounded-full bg-white border border-[#E6E0D5] focus:border-teal-600 text-xs sm:text-sm text-[#12262A] placeholder-slate-400 outline-none"
                />
              </div>
            </div>

            {/* Clean Picture-Book Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSpecies.map((sp) => {
                const count = getCountForSpecies(sp.id);
                const conflictName = hasConflictWithCurrentTank(sp);
                const tooSmallTank = sp.minTankLiters > tankLiters;
                const kidMeta = getKidMeta(sp.id);

                return (
                  <div
                    key={sp.id}
                    onClick={() => setInspectedSpecies(sp)}
                    className={`group bg-white rounded-[24px] overflow-hidden border transition-all flex flex-col justify-between cursor-pointer ${
                      count > 0
                        ? 'border-[#0D9488] ring-2 ring-[#0D9488]/20 shadow-md'
                        : 'border-[#E6E0D5] hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Clean Edge-to-Edge Real Photograph */}
                      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={kidMeta.photoUrl}
                          alt={lang === 'sv' ? sp.nameSv : sp.nameEn}
                          loading="lazy"
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Read Aloud Speaker Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playBubbleSound();
                            if (lang === 'sv') {
                              speakKidsText(
                                `${sp.nameSv}. ${kidMeta.superpowerSv} Visste du att: ${sp.funFactSv}`,
                                'sv'
                              );
                            } else {
                              speakKidsText(
                                `${sp.nameEn}. ${kidMeta.superpowerEn} Fun fact: ${sp.funFactEn}`,
                                'en'
                              );
                            }
                          }}
                          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#12262A] flex items-center justify-center shadow-md cursor-pointer transition active:scale-95"
                          title={lang === 'sv' ? 'Lyssna på fisken' : 'Listen'}
                        >
                          <Volume2 className="w-4 h-4 text-amber-600" />
                        </button>

                        {/* Warning Pill ONLY if there is an actual conflict or tank too small */}
                        {(conflictName || tooSmallTank) && (
                          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-rose-600/95 text-white text-[11px] font-bold shadow-sm flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>
                              {conflictName
                                ? lang === 'sv'
                                  ? `Krockar med ${conflictName}`
                                  : `Clashes with ${conflictName}`
                                : lang === 'sv'
                                ? `Behöver ${sp.minTankLiters} L`
                                : `Needs ${sp.minTankLiters} L`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Clean Editorial Card Body */}
                      <div className="p-5 space-y-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="text-xl font-display font-bold text-[#12262A] group-hover:text-[#0D9488] transition-colors">
                            {lang === 'sv' ? sp.nameSv : sp.nameEn}
                          </h3>
                          <span className="text-xs text-slate-400 font-medium">
                            {sp.sizeCm} cm
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm font-semibold text-teal-800">
                          {kidMeta.emoji} {lang === 'sv' ? kidMeta.superpowerSv : kidMeta.superpowerEn}
                        </p>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 pt-0.5">
                          {lang === 'sv' ? sp.funFactSv : sp.funFactEn}
                        </p>
                      </div>
                    </div>

                    {/* Single Primary Action Footer */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="px-5 pb-5 pt-1 flex items-center justify-between"
                    >
                      <span className="text-xs font-semibold text-slate-400">
                        {lang === 'sv' ? 'Läs mer →' : 'Read more →'}
                      </span>

                      {count === 0 ? (
                        <button
                          onClick={() => handleQuickAddSpecies(sp)}
                          className="px-4 py-2 rounded-full bg-[#0D9488] hover:bg-[#0F766E] active:scale-95 text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>
                            {lang === 'sv'
                              ? sp.minGroupSize > 1
                                ? `Lägg i (${sp.recommendedGroupSize} st)`
                                : 'Lägg i'
                              : 'Add to tank'}
                          </span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#0D9488]/40 rounded-full p-1">
                          <button
                            onClick={() => {
                              playBubbleSound();
                              handleSetSpeciesCount(sp.id, count - 1);
                            }}
                            className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 text-[#12262A] border border-[#E6E0D5] flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 font-extrabold text-xs text-[#0D9488]">
                            {count} st
                          </span>
                          <button
                            onClick={() => {
                              playBubbleSound();
                              handleSetSpeciesCount(sp.id, count + 1);
                            }}
                            className="w-7 h-7 rounded-full bg-[#0D9488] hover:bg-[#0F766E] text-white flex items-center justify-center font-bold cursor-pointer"
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

        {/* 2B. SHOPPING CHECKLIST & SAVED TANKS */}
        {activeView === 'checklist' && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-[#E6E0D5] rounded-[24px] p-6 space-y-5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-display font-bold text-[#12262A]">
                    {lang === 'sv' ? 'Inköpslista till djuraffären' : 'Pet Store Shopping List'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === 'sv'
                      ? 'Bocka av det ni redan har hemma och kopiera listan inför besöket.'
                      : 'Check off what you already have at home.'}
                  </p>
                </div>

                <button
                  onClick={copyShoppingList}
                  className="px-4 py-2 rounded-full bg-[#12262A] hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-teal-400" />
                  <span>
                    {copiedChecklist
                      ? lang === 'sv'
                        ? 'Kopierad!'
                        : 'Copied!'
                      : lang === 'sv'
                      ? 'Kopiera inköpslista'
                      : 'Copy list'}
                  </span>
                </button>
              </div>

              <div className="space-y-2">
                {EQUIPMENT_CHECKLIST.map((item) => {
                  const checked = checkedEquipment.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        playBubbleSound();
                        setCheckedEquipment((prev) =>
                          prev.includes(item.id)
                            ? prev.filter((i) => i !== item.id)
                            : [...prev, item.id]
                        );
                      }}
                      className={`p-4 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition ${
                        checked
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-[#FAF7F2] border-[#E6E0D5] hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          checked
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-slate-300'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div
                          className={`text-sm font-bold ${
                            checked ? 'line-through text-slate-400' : 'text-[#12262A]'
                          }`}
                        >
                          {lang === 'sv' ? item.nameSv : item.nameEn}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {lang === 'sv' ? item.whySv : item.whyEn}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save & Load Family Tank Plans */}
            <div className="bg-white border border-[#E6E0D5] rounded-[24px] p-6 space-y-4 h-fit shadow-2xs">
              <h3 className="text-lg font-display font-bold text-[#12262A]">
                {lang === 'sv' ? 'Spara er plan' : 'Save Tank Plan'}
              </h3>
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={tankName}
                  onChange={(e) => setTankName(e.target.value)}
                  placeholder="Namn på akvariet…"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E6E0D5] text-sm font-bold text-[#12262A] outline-none"
                />
                <button
                  onClick={handleSaveTankToCloud}
                  className="w-full py-2.5 rounded-full bg-[#0D9488] hover:bg-[#0F766E] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>{lang === 'sv' ? 'Spara akvarium' : 'Save aquarium'}</span>
                </button>
              </div>

              {savedTanks.length > 0 && (
                <div className="pt-3 border-t border-[#E6E0D5] space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {lang === 'sv' ? 'Sparade akvarier' : 'Saved tanks'}
                  </div>
                  {savedTanks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTankName(t.name);
                        setTankLiters(t.liters);
                        setAquascape(t.aquascape);
                        setFishEntries(t.fish || []);
                        setActiveView('explore');
                      }}
                      className="w-full text-left p-3 rounded-xl bg-[#FAF7F2] hover:bg-[#EFECE6] border border-[#E6E0D5] text-xs flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-bold text-[#12262A]">{t.name}</span>
                      <span className="text-slate-500">{t.liters} L</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* SPECIES STORY MODAL */}
      <SpeciesDetailModal
        species={inspectedSpecies}
        currentCount={inspectedSpecies ? getCountForSpecies(inspectedSpecies.id) : 0}
        onClose={() => setInspectedSpecies(null)}
        onChangeCount={handleSetSpeciesCount}
        onSelectOtherSpecies={(other) => setInspectedSpecies(other)}
        lang={lang}
      />
    </div>
  );
}
