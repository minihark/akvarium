import React, { useState } from 'react';
import { FishSpecies, Language } from '../types';
import { FISH_SPECIES } from '../data/species';
import { getKidMeta } from '../data/kidExtras';
import {
  playBubbleSound,
  playSuccessChime,
  speakKidsText,
} from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Award,
  BookOpen,
  Check,
  Lock,
  Printer,
  Share2,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  X,
} from 'lucide-react';

interface StickerDiplomaModalProps {
  isOpen: boolean;
  onClose: () => void;
  starsEarned: number;
  unlockedStickers: string[];
  onUnlockSticker: (speciesId: string) => void;
  onAddBonusStar: () => void;
  onInspectSpecies: (species: FishSpecies) => void;
  liters: number;
  lang: Language;
  initialTab?: 'stickers' | 'diploma';
}

export const StickerDiplomaModal: React.FC<StickerDiplomaModalProps> = ({
  isOpen,
  onClose,
  starsEarned,
  unlockedStickers,
  onUnlockSticker,
  onAddBonusStar,
  onInspectSpecies,
  liters,
  lang,
  initialTab = 'stickers',
}) => {
  const [activeTab, setActiveTab] = useState<'stickers' | 'diploma'>(initialTab);
  const [kidName, setKidName] = useState<string>(() => {
    try {
      return localStorage.getItem('fena_kid_name') || '';
    } catch {
      return '';
    }
  });
  const [tankTitle, setTankTitle] = useState<string>(() => {
    try {
      return localStorage.getItem('fena_tank_title') || '';
    } catch {
      return '';
    }
  });
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const unlockedSpeciesObjects = FISH_SPECIES.filter((s) =>
    unlockedStickers.includes(s.id)
  );
  const diplomaUnlocked = starsEarned >= 3;
  const totalSpecies = FISH_SPECIES.length;
  const unlockedCount = unlockedSpeciesObjects.length;
  const progressPct = Math.round((unlockedCount / totalSpecies) * 100);

  const handleKidNameChange = (val: string) => {
    setKidName(val);
    try {
      localStorage.setItem('fena_kid_name', val);
    } catch {}
  };

  const handleTankTitleChange = (val: string) => {
    setTankTitle(val);
    try {
      localStorage.setItem('fena_tank_title', val);
    } catch {}
  };

  const displayKidName =
    kidName.trim() ||
    (lang === 'sv' ? 'Mäster-Akvaristen' : 'Junior Aquarist');
  const displayTankTitle =
    tankTitle.trim() ||
    (lang === 'sv' ? 'Mitt Drömakvarium' : 'My Dream Aquarium');

  const rankTitle =
    starsEarned >= 10 || unlockedCount >= 12
      ? lang === 'sv'
        ? '👑 Kunglig Djuphavs-Professor'
        : '👑 Royal Deep-Sea Professor'
      : starsEarned >= 5 || unlockedCount >= 6
      ? lang === 'sv'
        ? '🌟 Guld-Kapten & Fisk-Viskare'
        : '🌟 Gold Captain & Fish Whisperer'
      : lang === 'sv'
      ? '🕵️‍♂️ Certifierad Akvarie-Detektiv'
      : '🕵️‍♂️ Certified Aquarium Detective';

  const handleReadDiploma = () => {
    playSuccessChime();
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {}
    const speech =
      lang === 'sv'
        ? `Stort grattis ${displayKidName}! Härmed tilldelas du Mitt Akvarium-Diplom som ${rankTitle.replace(
            /^[^\s]+\s/,
            ''
          )} för ${displayTankTitle} på ${liters} liter! Du har samlat ${starsEarned} stjärnor och ${unlockedCount} klistermärken!`
        : `Congratulations ${displayKidName}! You are officially awarded the Aquarium Diploma for ${displayTankTitle} with ${starsEarned} stars and ${unlockedCount} fish stickers!`;
    speakKidsText(speech, lang);
  };

  const handleShareDiploma = async () => {
    const shareText =
      lang === 'sv'
        ? `🎓✨ MITT AKVARIUM-DIPLOM ✨🎓\n🏅 ${displayKidName} är nu ${rankTitle}!\n🐠 Akvarium: "${displayTankTitle}" (${liters} L)\n⭐ Stjärnor i Fisk-Jakten: ${starsEarned}\n📒 Klistermärken: ${unlockedCount}/${totalSpecies} arter\nUpptäck på: https://akvarium.apps.harkco.se`
        : `🎓✨ MY AQUARIUM DIPLOMA ✨🎓\n🏅 ${displayKidName} is now ${rankTitle}!\n🐠 Tank: "${displayTankTitle}" (${liters} L)\n⭐ Stars earned: ${starsEarned}\n📒 Stickers: ${unlockedCount}/${totalSpecies}\nExplore at: https://akvarium.apps.harkco.se`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      playBubbleSound();
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handlePrintDiploma = () => {
    playSuccessChime();
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto print:bg-white print:p-0"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-abyss-900 border-2 border-amber-400/40 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col print:max-h-none print:border-none print:shadow-none print:bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header (Hidden when printing) */}
        <div className="px-5 py-4 bg-gradient-to-r from-abyss-950 via-abyss-900 to-abyss-950 border-b border-amber-400/30 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/25">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>
                  {lang === 'sv'
                    ? 'Klistermärkes-Album & Akvarium-Diplom'
                    : 'Sticker Album & Aquarium Diploma'}
                </span>
              </h2>
              <p className="text-xs text-amber-200/90 font-bold">
                {lang === 'sv'
                  ? `⭐ ${starsEarned} Stjärnor i Fisk-Jakten • 📒 ${unlockedCount}/${totalSpecies} Fisk-Klistermärken`
                  : `⭐ ${starsEarned} Stars Earned • 📒 ${unlockedCount}/${totalSpecies} Fish Stickers`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="flex bg-abyss-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => {
                  playBubbleSound();
                  setActiveTab('stickers');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'stickers'
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {lang === 'sv' ? '📒 Klistermärken' : '📒 Sticker Album'} (
                  {unlockedCount}/{totalSpecies})
                </span>
              </button>
              <button
                onClick={() => {
                  playBubbleSound();
                  setActiveTab('diploma');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'diploma'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow'
                    : 'text-amber-200 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>
                  {lang === 'sv' ? '🎓 Mitt Diplom' : '🎓 My Diploma'}
                </span>
                {diplomaUnlocked && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-abyss-950 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 print:p-0 print:overflow-visible">
          {activeTab === 'stickers' ? (
            <div className="space-y-5 print:hidden">
              {/* Progress Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-amber-500/10 to-pink-500/15 border border-cyan-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-black uppercase tracking-wider text-cyan-300">
                    {lang === 'sv'
                      ? '✨ DIN KLISTERMÄRKES-SAMLING'
                      : '✨ YOUR STICKER COLLECTION'}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200">
                    {lang === 'sv'
                      ? 'Du får nya klistermärken automatiskt när du hittar rätt fisk i Fisk-Jakten eller lägger dem i ditt akvarium! Du kan också trycka "Stämpla!" om du sett fisken i verkligheten.'
                      : 'Unlock stickers by finding fish in the Fish Hunt mini-game, adding them to your tank, or stamping them when you spot them in real life!'}
                  </p>
                </div>

                <div className="flex flex-col items-end min-w-[160px]">
                  <span className="text-sm font-black text-amber-300">
                    {unlockedCount} / {totalSpecies} ({progressPct}%)
                  </span>
                  <div className="w-full h-3 bg-abyss-950 rounded-full overflow-hidden border border-slate-700 mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 via-amber-300 to-pink-400 transition-all duration-500"
                      style={{ width: `${Math.max(5, progressPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Sticker Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {FISH_SPECIES.map((sp) => {
                  const isUnlocked = unlockedStickers.includes(sp.id);
                  const meta = getKidMeta(sp.id);

                  return (
                    <div
                      key={sp.id}
                      className={`relative rounded-2xl p-3 border-2 transition flex flex-col justify-between ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-abyss-800/95 via-abyss-900 to-cyan-950/80 border-amber-300/70 shadow-lg shadow-amber-500/10 hover:-translate-y-0.5'
                          : 'bg-abyss-950/60 border-slate-800/80 opacity-80'
                      }`}
                    >
                      <div>
                        {/* Sticker Photo Circle */}
                        <div className="relative mx-auto w-20 h-20 mb-2.5 flex items-center justify-center">
                          <img
                            src={meta.photoUrl}
                            alt={sp.nameSv}
                            className={`w-20 h-20 rounded-full object-cover border-4 transition ${
                              isUnlocked
                                ? 'border-white shadow-md rotate-[-2deg]'
                                : 'border-slate-700 grayscale contrast-125 brightness-50'
                            }`}
                          />
                          <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-abyss-950 border border-amber-300/60 flex items-center justify-center text-sm shadow">
                            {isUnlocked ? meta.emoji : '❓'}
                          </span>
                          {isUnlocked && (
                            <span className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase shadow">
                              ★ Klart
                            </span>
                          )}
                        </div>

                        <div className="text-center space-y-1">
                          <h4 className="text-xs sm:text-sm font-black text-white truncate">
                            {lang === 'sv' ? sp.nameSv : sp.nameEn}
                          </h4>
                          <p className="text-[11px] text-amber-200/90 font-medium line-clamp-2 min-h-[2.2rem]">
                            {isUnlocked
                              ? lang === 'sv'
                                ? meta.superpowerSv
                                : meta.superpowerEn
                              : lang === 'sv'
                              ? meta.questClueSv
                              : meta.questClueEn}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                        {isUnlocked ? (
                          <>
                            <button
                              onClick={() => {
                                speakKidsText(
                                  lang === 'sv'
                                    ? `${sp.nameSv}. Superkraft: ${meta.superpowerSv}`
                                    : `${sp.nameEn}. Superpower: ${meta.superpowerEn}`,
                                  lang
                                );
                              }}
                              className="flex-1 py-1 px-2 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40 text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>{lang === 'sv' ? 'Lyssna' : 'Listen'}</span>
                            </button>
                            <button
                              onClick={() => {
                                onClose();
                                onInspectSpecies(sp);
                              }}
                              className="py-1 px-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 text-[11px] font-bold cursor-pointer"
                            >
                              {lang === 'sv' ? 'Kort' : 'Card'}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              playSuccessChime();
                              onUnlockSticker(sp.id);
                              try {
                                confetti({
                                  particleCount: 40,
                                  spread: 60,
                                  origin: { y: 0.7 },
                                });
                              } catch {}
                            }}
                            className="w-full py-1 px-2 rounded-lg bg-abyss-900 hover:bg-amber-400 hover:text-slate-950 text-amber-300 border border-amber-400/40 text-[11px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>
                              {lang === 'sv'
                                ? 'Stämpla märke!'
                                : 'Stamp Sticker!'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Unlock / Customization Controls (Hidden when printing) */}
              <div className="p-4 rounded-2xl bg-abyss-950 border border-amber-400/30 space-y-4 print:hidden">
                {!diplomaUnlocked && (
                  <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-400/40 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Lock className="w-5 h-5 text-amber-300 flex-shrink-0" />
                      <p className="text-xs sm:text-sm font-bold text-amber-100">
                        {lang === 'sv'
                          ? `Samla 3 stjärnor i Fisk-Jakten för att låsa upp Guld-Diplomet! (Du har ${starsEarned}/3 ⭐ just nu)`
                          : `Earn 3 stars in Fish Hunt to unlock the Gold Diploma! (${starsEarned}/3 ⭐ right now)`}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        playSuccessChime();
                        onAddBonusStar();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1 cursor-pointer shadow"
                    >
                      <Star className="w-3.5 h-3.5 fill-slate-950" />
                      <span>
                        {lang === 'sv'
                          ? '+1 Ge Bonus-Stjärna!'
                          : '+1 Award Bonus Star!'}
                      </span>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-cyan-300 mb-1">
                      {lang === 'sv'
                        ? '👧🧒 Barnets / Akvaristens Namn:'
                        : '👧🧒 Child / Aquarist Name:'}
                    </label>
                    <input
                      type="text"
                      value={kidName}
                      onChange={(e) => handleKidNameChange(e.target.value)}
                      placeholder={
                        lang === 'sv'
                          ? 'Skriv namn (t.ex. Sigrid & Kalle)...'
                          : 'Enter name...'
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-abyss-900 border border-cyan-500/40 text-white text-sm font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-cyan-300 mb-1">
                      {lang === 'sv'
                        ? '🐠 Namn på Akvariet:'
                        : '🐠 Aquarium Name:'}
                    </label>
                    <input
                      type="text"
                      value={tankTitle}
                      onChange={(e) => handleTankTitleChange(e.target.value)}
                      placeholder={
                        lang === 'sv'
                          ? 'T.ex. Äventyrs-Revet...'
                          : 'E.g. Rainbow Reef...'
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-abyss-900 border border-cyan-500/40 text-white text-sm font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleReadDiploma}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>
                        {lang === 'sv'
                          ? '🔊 Läs upp diplomet!'
                          : '🔊 Read Diploma Aloud!'}
                      </span>
                    </button>

                    <button
                      onClick={handlePrintDiploma}
                      className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>
                        {lang === 'sv'
                          ? '🖨️ Skriv ut / Spara PDF'
                          : '🖨️ Print / Save PDF'}
                      </span>
                    </button>

                    <button
                      onClick={handleShareDiploma}
                      className="px-3.5 py-2 rounded-xl bg-abyss-900 hover:bg-abyss-800 text-cyan-200 border border-cyan-400/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-300">
                            {lang === 'sv' ? 'Kopierat!' : 'Copied!'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" />
                          <span>
                            {lang === 'sv' ? 'Kopiera & Dela' : 'Copy & Share'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* PRINTABLE DIPLOMA CERTIFICATE CARD */}
              <div
                id="fena-printable-diploma"
                className="relative rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#071f36] via-[#0a2942] to-[#061829] text-white border-4 border-amber-300 shadow-2xl overflow-hidden print:bg-white print:text-slate-900 print:border-8 print:border-amber-500 print:shadow-none"
              >
                {/* Decorative Corner Stars */}
                <div className="absolute top-4 left-4 text-2xl opacity-75">
                  🌟
                </div>
                <div className="absolute top-4 right-4 text-2xl opacity-75">
                  🌟
                </div>
                <div className="absolute bottom-4 left-4 text-2xl opacity-75">
                  🐚
                </div>
                <div className="absolute bottom-4 right-4 text-2xl opacity-75">
                  🦀
                </div>

                <div className="text-center space-y-4 max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-400/20 border border-amber-300/60 text-amber-300 print:bg-amber-100 print:text-amber-900 print:border-amber-500 text-xs font-black uppercase tracking-widest">
                    <Trophy className="w-4 h-4" />
                    <span>
                      {lang === 'sv'
                        ? 'FENA AKVARIE-AKADEMI • HEDERSDIPLOM'
                        : 'FENA AQUARIUM ACADEMY • HONOR DIPLOMA'}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-amber-300 print:text-amber-700">
                    {lang === 'sv'
                      ? 'MITT AKVARIUM-DIPLOM'
                      : 'MY AQUARIUM DIPLOMA'}
                  </h1>

                  <p className="text-xs sm:text-sm uppercase tracking-wider text-cyan-200 print:text-slate-600 font-bold">
                    {lang === 'sv'
                      ? 'Detta diplom intygar stolt att'
                      : 'This certificate proudly recognizes that'}
                  </p>

                  <div className="py-2 px-6 inline-block border-b-2 border-amber-300/70 print:border-amber-600">
                    <span className="text-2xl sm:text-4xl font-black text-white print:text-slate-900">
                      {displayKidName}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base text-slate-200 print:text-slate-700 font-semibold">
                    {lang === 'sv'
                      ? `har klarat Fisk-Jakten med glans och utnämns härmed till`
                      : `has mastered the Fish Hunt and is officially named`}
                  </p>

                  <div className="inline-block px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black text-base sm:text-lg shadow-md">
                    {rankTitle}
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3 pt-3 max-w-lg mx-auto">
                    <div className="p-3 rounded-2xl bg-abyss-950/70 border border-cyan-400/30 print:bg-slate-100 print:border-slate-300">
                      <div className="text-[11px] font-bold text-cyan-300 print:text-slate-600 uppercase">
                        {lang === 'sv' ? 'Akvarium' : 'Aquarium'}
                      </div>
                      <div className="text-xs sm:text-sm font-black truncate mt-0.5">
                        {displayTankTitle} ({liters}L)
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-abyss-950/70 border border-amber-400/30 print:bg-slate-100 print:border-slate-300">
                      <div className="text-[11px] font-bold text-amber-300 print:text-slate-600 uppercase">
                        {lang === 'sv' ? 'Fisk-Jakten' : 'Fish Hunt'}
                      </div>
                      <div className="text-xs sm:text-sm font-black mt-0.5">
                        ⭐ {Math.max(starsEarned, 3)}{' '}
                        {lang === 'sv' ? 'Stjärnor' : 'Stars'}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-abyss-950/70 border border-emerald-400/30 print:bg-slate-100 print:border-slate-300">
                      <div className="text-[11px] font-bold text-emerald-300 print:text-slate-600 uppercase">
                        {lang === 'sv' ? 'Klistermärken' : 'Stickers'}
                      </div>
                      <div className="text-xs sm:text-sm font-black mt-0.5">
                        🐠 {unlockedCount} / {totalSpecies}
                      </div>
                    </div>
                  </div>

                  {/* Sticker Showcase on Diploma */}
                  {unlockedSpeciesObjects.length > 0 && (
                    <div className="pt-3">
                      <div className="text-[11px] font-black uppercase tracking-wider text-cyan-300 print:text-slate-600 mb-2">
                        {lang === 'sv'
                          ? 'Upptäckta Favorit-Fiskar & Klistermärken:'
                          : 'Discovered Fish Stickers:'}
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {unlockedSpeciesObjects.slice(0, 10).map((sp) => {
                          const meta = getKidMeta(sp.id);
                          return (
                            <div
                              key={sp.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-abyss-950/80 border border-amber-300/50 print:bg-amber-50 print:border-amber-400 text-xs font-bold"
                            >
                              <img
                                src={meta.photoUrl}
                                alt={sp.nameSv}
                                className="w-5 h-5 rounded-full object-cover border border-white"
                              />
                              <span>
                                {meta.emoji}{' '}
                                {lang === 'sv' ? sp.nameSv : sp.nameEn}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer Signature & Date */}
                  <div className="pt-6 mt-4 border-t border-cyan-500/25 print:border-slate-300 flex items-center justify-between text-xs text-slate-300 print:text-slate-600 font-bold">
                    <div>
                      📅 {new Date().toLocaleDateString('sv-SE')}
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-300 print:text-amber-700 font-black">
                      <span>🦭 Kapten Fena • akvarium.apps.harkco.se</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
