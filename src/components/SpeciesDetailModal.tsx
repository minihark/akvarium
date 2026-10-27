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
  AlertTriangle,
  Plus,
  Minus,
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
      const text = `${species.nameSv}. ${kidMeta.superpowerSv} Visste du att: ${species.funFactSv}`;
      speakKidsText(text, 'sv');
    } else {
      const text = `${species.nameEn}. ${kidMeta.superpowerEn} Fun fact: ${species.funFactEn}`;
      speakKidsText(text, 'en');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#12262A]/65 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-xl w-full bg-[#FAF7F2] text-[#12262A] rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[#E6E0D5]"
      >
        {/* Top Real Photo Hero */}
        <div className="relative h-56 sm:h-64 w-full bg-[#12262A] overflow-hidden flex-shrink-0">
          <img
            src={kidMeta.photoUrl}
            alt={lang === 'sv' ? species.nameSv : species.nameEn}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

          {/* Read Aloud Speaker Button */}
          <button
            onClick={handleReadAloud}
            className="absolute top-4 left-4 px-4 py-2 rounded-full bg-[#F59E0B] hover:bg-[#FBBF24] active:scale-95 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer transition"
          >
            <Volume2 className="w-4 h-4" />
            <span>{lang === 'sv' ? 'Lyssna på fakta' : 'Listen'}</span>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title & Illustrated Badge at bottom of photo */}
          <div className="absolute bottom-4 inset-x-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs italic text-white/80 font-serif">
                {species.scientificName}
              </p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                {lang === 'sv' ? species.nameSv : species.nameEn}
              </h2>
            </div>
            <div className="bg-white/90 backdrop-blur-md rounded-2xl px-3 py-1.5 shadow-md">
              <FishIllustration visual={species.visual} className="w-12 h-8" />
            </div>
          </div>
        </div>

        {/* Scrollable Story Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Superpower Pill */}
          <div className="p-3.5 rounded-2xl bg-teal-900/5 border border-teal-800/15 flex items-center gap-3">
            <span className="text-2xl">{kidMeta.emoji}</span>
            <p className="text-sm sm:text-base font-bold text-[#12262A]">
              {lang === 'sv' ? kidMeta.superpowerSv : kidMeta.superpowerEn}
            </p>
          </div>

          {/* Summary */}
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            {lang === 'sv' ? species.summarySv : species.summaryEn}
          </p>

          {/* Fun Fact Box */}
          <div
            onClick={handleReadAloud}
            className="p-4 rounded-2xl bg-[#FFFBEB] border border-amber-300 flex items-start gap-3 cursor-pointer hover:bg-amber-50/80 transition"
          >
            <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                {lang === 'sv' ? 'Visste du att?' : 'Fun Fact'}
              </div>
              <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-medium">
                {lang === 'sv' ? species.funFactSv : species.funFactEn}
              </p>
            </div>
          </div>

          {/* Clean 4-Metric Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-white border border-[#E6E0D5]">
              <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-teal-600" />
                {lang === 'sv' ? 'Akvarium' : 'Min Tank'}
              </span>
              <div className="text-sm font-extrabold text-[#12262A] mt-0.5">
                {species.minTankLiters} L
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#E6E0D5]">
              <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                {lang === 'sv' ? 'Trivs bäst' : 'Group'}
              </span>
              <div className="text-sm font-extrabold text-[#12262A] mt-0.5">
                {species.solitaryOrPairOnly
                  ? lang === 'sv'
                    ? '1–2 st'
                    : '1–2'
                  : `${species.minGroupSize}+ st`}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#E6E0D5]">
              <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-emerald-600" />
                {lang === 'sv' ? 'Storlek' : 'Size'}
              </span>
              <div className="text-sm font-extrabold text-[#12262A] mt-0.5">
                {species.sizeCm} cm
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#E6E0D5]">
              <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                {lang === 'sv' ? 'Värme' : 'Temp'}
              </span>
              <div className="text-sm font-extrabold text-[#12262A] mt-0.5">
                {species.tempMinC}–{species.tempMaxC}°C
              </div>
            </div>
          </div>

          {/* Best Friends & Avoid Mixing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                {lang === 'sv' ? 'Trivs bra med' : 'Great Tankmates'}
              </h4>
              <div className="flex flex-wrap gap-1.5">
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
                      className="pl-1.5 pr-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 text-[#12262A] border border-[#E6E0D5] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <img
                        src={mateMeta.photoUrl}
                        alt={mate.nameSv}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span>{lang === 'sv' ? mate.nameSv : mate.nameEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {species.incompatibleWithIds.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{lang === 'sv' ? 'Undvik att blanda med' : 'Avoid Mixing With'}</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
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
                        className="pl-1.5 pr-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-950 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <img
                          src={badMeta.photoUrl}
                          alt={bad.nameSv}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span>{lang === 'sv' ? bad.nameSv : bad.nameEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#E6E0D5] flex items-center justify-between gap-3">
          {currentCount > 0 ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">
                {lang === 'sv' ? 'Antal i akvariet:' : 'In your tank:'}
              </span>
              <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#E6E0D5] rounded-full p-1">
                <button
                  onClick={() => {
                    playBubbleSound();
                    onChangeCount(species.id, Math.max(0, currentCount - 1));
                  }}
                  className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-[#12262A] border border-[#E6E0D5] flex items-center justify-center cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-extrabold text-base text-[#12262A]">
                  {currentCount}
                </span>
                <button
                  onClick={() => {
                    playBubbleSound();
                    onChangeCount(species.id, currentCount + 1);
                  }}
                  className="w-8 h-8 rounded-full bg-[#0D9488] hover:bg-[#0F766E] text-white flex items-center justify-center font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleQuickAddSchool}
              className="px-5 py-2.5 rounded-full bg-[#0D9488] hover:bg-[#0F766E] text-white font-extrabold text-sm flex items-center gap-1.5 shadow-md cursor-pointer transition"
            >
              <Plus className="w-4 h-4" />
              <span>
                {lang === 'sv'
                  ? `Lägg i akvariet (${species.recommendedGroupSize} st)`
                  : `Add to tank (${species.recommendedGroupSize})`}
              </span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-[#FAF7F2] hover:bg-[#EFECE6] text-[#12262A] font-bold text-xs border border-[#E6E0D5] cursor-pointer"
          >
            {lang === 'sv' ? 'Stäng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
