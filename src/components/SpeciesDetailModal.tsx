import React from 'react';
import { FishSpecies, Language } from '../types';
import { FISH_SPECIES } from '../data/species';
import { FishIllustration } from './FishIllustration';
import { playBubbleSound } from '../utils/audio';
import {
  X,
  Sparkles,
  Thermometer,
  Droplets,
  Ruler,
  Users,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Minus,
  Compass,
  Utensils,
  Layers,
} from 'lucide-react';

interface SpeciesDetailModalProps {
  species: FishSpecies | null;
  currentCount: number;
  onClose: () => void;
  onChangeCount: (speciesId: string, nextCount: number) => void;
  onSelectOtherSpecies: (species: FishSpecies) => void;
  lang: Language;
}

export const SpeciesDetailModal: React.FC<SpeciesDetailModalProps> = ({
  species,
  currentCount,
  onClose,
  onChangeCount,
  onSelectOtherSpecies,
  lang,
}) => {
  if (!species) return null;

  const zoneLabel = () => {
    if (species.zone === 'top') return lang === 'sv' ? 'Ytskiktet (Top)' : 'Top / Surface';
    if (species.zone === 'middle') return lang === 'sv' ? 'Mellanskiktet (Mitten)' : 'Mid-water';
    if (species.zone === 'bottom') return lang === 'sv' ? 'Bottenskiktet (Botten)' : 'Bottom Dweller';
    return lang === 'sv' ? 'Hela akvariet' : 'All Water Layers';
  };

  const handleQuickAddSchool = () => {
    playBubbleSound();
    if (currentCount === 0) {
      onChangeCount(species.id, species.recommendedGroupSize);
    } else {
      onChangeCount(species.id, currentCount + 1);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-2xl w-full bg-abyss-900 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Hero Banner */}
        <div className="relative px-6 py-6 bg-gradient-to-br from-abyss-950 via-abyss-850 to-abyss-900 border-b border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-28 h-20 rounded-2xl bg-abyss-950/90 border border-cyan-500/25 flex items-center justify-center p-2 shadow-inner">
              <FishIllustration visual={species.visual} className="w-24 h-16" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 text-[11px] font-bold">
                  {species.careLevel === 'easy'
                    ? lang === 'sv'
                      ? 'Nybörjarvänlig'
                      : 'Beginner Friendly'
                    : lang === 'sv'
                    ? 'Medelsvår'
                    : 'Intermediate'}
                </span>
                <span className="text-xs italic text-slate-400 font-serif">
                  {species.scientificName}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                {lang === 'sv' ? species.nameSv : species.nameEn}
              </h2>
              <p className="text-xs text-cyan-300/90 font-medium mt-0.5">
                {lang === 'sv' ? `Engelska: ${species.nameEn}` : `Swedish: ${species.nameSv}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-abyss-950/80 text-slate-400 hover:text-white hover:bg-abyss-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Summary */}
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            {lang === 'sv' ? species.summarySv : species.summaryEn}
          </p>

          {/* Kid-Friendly Fun Fact Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-400/35 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                {lang === 'sv' ? 'Visste du att?' : 'Fun Fact!'}
              </span>
              <p className="text-xs sm:text-sm text-amber-100 leading-relaxed font-medium">
                {lang === 'sv' ? species.funFactSv : species.funFactEn}
              </p>
            </div>
          </div>

          {/* Quick Spec Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-abyss-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                {lang === 'sv' ? 'Minsta akvarium' : 'Min Tank Size'}
              </span>
              <div className="text-base font-black text-white font-mono">
                {species.minTankLiters} Liter
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-abyss-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                {lang === 'sv' ? 'Temperatur' : 'Temperature'}
              </span>
              <div className="text-base font-black text-white font-mono">
                {species.tempMinC}–{species.tempMaxC} °C
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-abyss-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-emerald-400" />
                {lang === 'sv' ? 'Vuxen storlek' : 'Adult Size'}
              </span>
              <div className="text-base font-black text-white font-mono">
                {species.sizeCm} cm
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-abyss-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                {lang === 'sv' ? 'Trivs bäst i grupp' : 'Social Group'}
              </span>
              <div className="text-sm font-black text-white">
                {species.solitaryOrPairOnly
                  ? lang === 'sv'
                    ? species.minGroupSize === 1
                      ? '1 st (eller par)'
                      : 'Par (2 st)'
                    : species.minGroupSize === 1
                    ? 'Solitary or Pair'
                    : 'Pair (2)'
                  : lang === 'sv'
                  ? `Minst ${species.minGroupSize}–${species.recommendedGroupSize} st`
                  : `${species.minGroupSize}–${species.recommendedGroupSize}+ school`}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-abyss-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                {lang === 'sv' ? 'Simnivå i vattnet' : 'Swimming Zone'}
              </span>
              <div className="text-xs sm:text-sm font-bold text-white">{zoneLabel()}</div>
            </div>

            <div className="p-3 rounded-2xl bg-abyss-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-purple-400" />
                {lang === 'sv' ? 'pH-värde' : 'pH Range'}
              </span>
              <div className="text-base font-black text-white font-mono">
                pH {species.phMin.toFixed(1)}–{species.phMax.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Origin & Diet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-abyss-950/60 border border-slate-800/80 space-y-1">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                {lang === 'sv' ? 'Ursprung i naturen' : 'Natural Habitat'}
              </span>
              <p className="text-slate-300">{lang === 'sv' ? species.originSv : species.originEn}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-abyss-950/60 border border-slate-800/80 space-y-1">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5" />
                {lang === 'sv' ? 'Favoritmat' : 'Favorite Diet'}
              </span>
              <p className="text-slate-300">{lang === 'sv' ? species.dietSv : species.dietEn}</p>
            </div>
          </div>

          {/* Care Tips */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>{lang === 'sv' ? 'Viktiga skötselråd' : 'Essential Care Tips'}</span>
            </h3>
            <ul className="space-y-1.5">
              {(lang === 'sv' ? species.careTipsSv : species.careTipsEn).map((tip, idx) => (
                <li
                  key={idx}
                  className="text-xs sm:text-sm text-slate-300 flex items-start gap-2 bg-abyss-950/50 p-2.5 rounded-xl border border-slate-800/70"
                >
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Great Tankmates & Incompatible Species */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                {lang === 'sv' ? 'Passar utmärkt ihop med:' : 'Great Tankmates:'}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {species.greatTankmatesIds.map((mateId) => {
                  const mate = FISH_SPECIES.find((s) => s.id === mateId);
                  if (!mate) return null;
                  return (
                    <button
                      key={mate.id}
                      onClick={() => {
                        playBubbleSound();
                        onSelectOtherSpecies(mate);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
                    >
                      {lang === 'sv' ? mate.nameSv : mate.nameEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {species.incompatibleWithIds.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>{lang === 'sv' ? 'Undvik att blanda med:' : 'Avoid Mixing With:'}</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {species.incompatibleWithIds.map((badId) => {
                    const bad = FISH_SPECIES.find((s) => s.id === badId);
                    if (!bad) return null;
                    return (
                      <button
                        key={bad.id}
                        onClick={() => {
                          playBubbleSound();
                          onSelectOtherSpecies(bad);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
                      >
                        {lang === 'sv' ? bad.nameSv : bad.nameEn}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Footer: Add / Adjust in Tank */}
        <div className="px-6 py-4 bg-abyss-950 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">
              {lang === 'sv' ? 'Antal i ert akvarium:' : 'Count in your tank:'}
            </span>
            <div className="flex items-center gap-2 bg-abyss-900 border border-slate-700 rounded-xl p-1">
              <button
                onClick={() => {
                  playBubbleSound();
                  onChangeCount(species.id, Math.max(0, currentCount - 1));
                }}
                disabled={currentCount === 0}
                className="w-8 h-8 rounded-lg bg-abyss-800 hover:bg-abyss-700 disabled:opacity-30 text-white flex items-center justify-center cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-mono font-black text-base text-cyan-300">
                {currentCount}
              </span>
              <button
                onClick={() => {
                  playBubbleSound();
                  onChangeCount(species.id, currentCount + 1);
                }}
                className="w-8 h-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentCount === 0 && (
              <button
                onClick={handleQuickAddSchool}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {lang === 'sv'
                    ? `Lägg i rekommenderat antal (${species.recommendedGroupSize} st)`
                    : `Add recommended group (${species.recommendedGroupSize})`}
                </span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-abyss-800 hover:bg-abyss-700 text-white font-bold text-xs cursor-pointer"
            >
              {lang === 'sv' ? 'Stäng' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
