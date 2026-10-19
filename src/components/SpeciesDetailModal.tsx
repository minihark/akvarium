import React from 'react';
import { FishSpecies, Language } from '../types';
import { FISH_SPECIES } from '../data/species';
import { getKidMeta } from '../data/kidExtras';
import { FishIllustration } from './FishIllustration';
import { playBubbleSound, speakKidsText } from '../utils/audio';
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
  Volume2,
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

  const kidMeta = getKidMeta(species.id);

  const zoneLabel = () => {
    if (species.zone === 'top') return lang === 'sv' ? 'Ytskiktet (Uppe vid ytan)' : 'Top / Surface';
    if (species.zone === 'middle') return lang === 'sv' ? 'Mellanskiktet (Mitten)' : 'Mid-water';
    if (species.zone === 'bottom') return lang === 'sv' ? 'Bottenskiktet (På botten)' : 'Bottom Dweller';
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

  const handleReadAloud = () => {
    playBubbleSound();
    if (lang === 'sv') {
      const text = `${species.nameSv}. Superkraft: ${kidMeta.superpowerSv} Visste du att: ${species.funFactSv}`;
      speakKidsText(text, 'sv');
    } else {
      const text = `${species.nameEn}. Superpower: ${kidMeta.superpowerEn} Fun fact: ${species.funFactEn}`;
      speakKidsText(text, 'en');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-2xl w-full bg-abyss-900 border-2 border-cyan-400/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Real Photo Hero Header */}
        <div className="relative h-52 sm:h-64 w-full bg-abyss-950 overflow-hidden flex-shrink-0">
          <img
            src={kidMeta.photoUrl}
            alt={lang === 'sv' ? species.nameSv : species.nameEn}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-abyss-900 via-abyss-950/35 to-transparent" />

          {/* Floating Animated Vector Fish Badge */}
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-2xl bg-abyss-950/85 backdrop-blur-md border border-cyan-400/40 flex items-center gap-2 shadow-lg">
            <FishIllustration visual={species.visual} className="w-12 h-8" />
            <span className="text-[11px] font-extrabold text-cyan-200">
              {kidMeta.emoji} {lang === 'sv' ? 'Så simmar jag!' : 'In the tank!'}
            </span>
          </div>

          {/* Read Aloud Speaker Button for 5-year-olds */}
          <button
            onClick={handleReadAloud}
            className="absolute top-3 right-14 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xl cursor-pointer transition"
          >
            <Volume2 className="w-4 h-4" />
            <span>{lang === 'sv' ? '🔊 Lyssna!' : '🔊 Read Aloud!'}</span>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-2xl bg-abyss-950/85 text-slate-200 hover:text-white hover:bg-abyss-800 border border-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title overlay at bottom of photo */}
          <div className="absolute bottom-3 inset-x-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/30 backdrop-blur-md text-cyan-200 border border-cyan-300/40 text-[11px] font-extrabold">
                  {species.careLevel === 'easy'
                    ? lang === 'sv'
                      ? '⭐ Enkel nybörjarfisk'
                      : '⭐ Easy Beginner Fish'
                    : lang === 'sv'
                    ? 'Medelsvår'
                    : 'Intermediate'}
                </span>
                <span className="text-xs italic text-slate-200/90 font-serif bg-abyss-950/60 px-2 py-0.5 rounded-full">
                  {species.scientificName}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">
                {kidMeta.emoji} {lang === 'sv' ? species.nameSv : species.nameEn}
              </h2>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Kid Superpower Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-teal-500/15 to-cyan-500/20 border border-cyan-400/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{kidMeta.emoji}</span>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                  {lang === 'sv' ? 'Superkraft i akvariet' : 'Aquarium Superpower'}
                </div>
                <div className="text-sm sm:text-base font-black text-white">
                  {lang === 'sv' ? kidMeta.superpowerSv : kidMeta.superpowerEn}
                </div>
              </div>
            </div>
          </div>

          {/* Kid-Friendly Fun Fact Box */}
          <div
            onClick={handleReadAloud}
            className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-2 border-amber-400/40 flex items-start gap-3.5 cursor-pointer hover:border-amber-300 transition"
            title={lang === 'sv' ? 'Tryck för att lyssna!' : 'Tap to listen!'}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  {lang === 'sv' ? '🌟 Visste du att? (Tryck för att lyssna)' : '🌟 Fun Fact! (Tap to listen)'}
                </span>
                <Volume2 className="w-4 h-4 text-amber-300" />
              </div>
              <p className="text-xs sm:text-sm text-amber-100 leading-relaxed font-semibold">
                {lang === 'sv' ? species.funFactSv : species.funFactEn}
              </p>
            </div>
          </div>

          {/* Summary */}
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            {lang === 'sv' ? species.summarySv : species.summaryEn}
          </p>

          {/* Great Tankmates & Incompatible Species with Visual Photo Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                {lang === 'sv' ? '💚 Bästa kompisar i akvariet:' : '💚 Best Friends in the Tank:'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {species.greatTankmatesIds.map((mateId) => {
                  const mate = FISH_SPECIES.find((s) => s.id === mateId);
                  if (!mate) return null;
                  const mateMeta = getKidMeta(mate.id);
                  return (
                    <button
                      key={mate.id}
                      onClick={() => {
                        playBubbleSound();
                        onSelectOtherSpecies(mate);
                      }}
                      className="pl-1.5 pr-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-100 border border-emerald-500/35 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                    >
                      <img
                        src={mateMeta.photoUrl}
                        alt={mate.nameSv}
                        className="w-6 h-6 rounded-lg object-cover border border-emerald-400/40"
                      />
                      <span>{lang === 'sv' ? mate.nameSv : mate.nameEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {species.incompatibleWithIds.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>{lang === 'sv' ? '⛔ Passar inte ihop med:' : '⛔ Avoid Mixing With:'}</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {species.incompatibleWithIds.map((badId) => {
                    const bad = FISH_SPECIES.find((s) => s.id === badId);
                    if (!bad) return null;
                    const badMeta = getKidMeta(bad.id);
                    return (
                      <button
                        key={bad.id}
                        onClick={() => {
                          playBubbleSound();
                          onSelectOtherSpecies(bad);
                        }}
                        className="pl-1.5 pr-3 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-100 border border-rose-500/35 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                      >
                        <img
                          src={badMeta.photoUrl}
                          alt={bad.nameSv}
                          className="w-6 h-6 rounded-lg object-cover border border-rose-400/40"
                        />
                        <span>{lang === 'sv' ? bad.nameSv : bad.nameEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
                {lang === 'sv' ? 'Hur många kompisar?' : 'Social Group'}
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
                {lang === 'sv' ? 'Var bor den i naturen?' : 'Natural Habitat'}
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
              <span>{lang === 'sv' ? 'Viktiga skötselråd för föräldrar & barn' : 'Essential Care Tips'}</span>
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
        </div>

        {/* Bottom Action Footer: Add / Adjust in Tank */}
        <div className="px-6 py-4 bg-abyss-950 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">
              {lang === 'sv' ? 'I ert akvarium:' : 'In your tank:'}
            </span>
            <div className="flex items-center gap-2 bg-abyss-900 border border-slate-700 rounded-xl p-1">
              <button
                onClick={() => {
                  playBubbleSound();
                  onChangeCount(species.id, Math.max(0, currentCount - 1));
                }}
                disabled={currentCount === 0}
                className="w-9 h-9 rounded-lg bg-abyss-800 hover:bg-abyss-700 disabled:opacity-30 text-white flex items-center justify-center cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-9 text-center font-mono font-black text-lg text-cyan-300">
                {currentCount}
              </span>
              <button
                onClick={() => {
                  playBubbleSound();
                  onChangeCount(species.id, currentCount + 1);
                }}
                className="w-9 h-9 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentCount === 0 && (
              <button
                onClick={handleQuickAddSchool}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {lang === 'sv'
                    ? `Plums i akvariet! (${species.recommendedGroupSize} st)`
                    : `Splash into tank! (${species.recommendedGroupSize})`}
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
