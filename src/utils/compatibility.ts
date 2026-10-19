import { FishSpecies, TankFishEntry, CompatibilityAlert } from '../types';
import { FISH_SPECIES } from '../data/species';

export interface TankAnalysis {
  totalFishCount: number;
  bioloadPercent: number;
  tempOverlap: { min: number; max: number; valid: boolean } | null;
  phOverlap: { min: number; max: number; valid: boolean } | null;
  zoneCounts: { top: number; middle: number; bottom: number };
  alerts: CompatibilityAlert[];
  needsSand: boolean;
  needsDriftwood: boolean;
}

export function analyzeTank(liters: number, entries: TankFishEntry[]): TankAnalysis {
  const activeEntries = entries.filter((e) => e.count > 0);
  const populated = activeEntries
    .map((e) => {
      const sp = FISH_SPECIES.find((s) => s.id === e.speciesId);
      return sp ? { species: sp, count: e.count } : null;
    })
    .filter(Boolean) as { species: FishSpecies; count: number }[];

  if (populated.length === 0) {
    return {
      totalFishCount: 0,
      bioloadPercent: 0,
      tempOverlap: null,
      phOverlap: null,
      zoneCounts: { top: 0, middle: 0, bottom: 0 },
      alerts: [],
      needsSand: false,
      needsDriftwood: false,
    };
  }

  const totalFishCount = populated.reduce((sum, item) => sum + item.count, 0);

  // Bioload capacity: roughly 0.42 bioload units per liter (e.g. 60L = 25 units)
  const capacityUnits = Math.max(10, liters * 0.42);
  const usedUnits = populated.reduce(
    (sum, item) => sum + item.species.bioloadScore * item.count,
    0
  );
  const bioloadPercent = Math.round((usedUnits / capacityUnits) * 100);

  // Temperature & pH overlap
  const maxMinTemp = Math.max(...populated.map((p) => p.species.tempMinC));
  const minMaxTemp = Math.min(...populated.map((p) => p.species.tempMaxC));
  const tempValid = maxMinTemp <= minMaxTemp;

  const maxMinPh = Math.max(...populated.map((p) => p.species.phMin));
  const minMaxPh = Math.min(...populated.map((p) => p.species.phMax));
  const phValid = maxMinPh <= minMaxPh;

  // Water zone counts
  const zoneCounts = { top: 0, middle: 0, bottom: 0 };
  populated.forEach(({ species, count }) => {
    if (species.zone === 'top') zoneCounts.top += count;
    else if (species.zone === 'middle') zoneCounts.middle += count;
    else if (species.zone === 'bottom') zoneCounts.bottom += count;
    else {
      zoneCounts.bottom += count;
    }
  });

  const alerts: CompatibilityAlert[] = [];

  // 1. Check tank size requirements
  populated.forEach(({ species }) => {
    if (species.minTankLiters > liters) {
      alerts.push({
        id: `tank-size-${species.id}`,
        severity: 'error',
        titleSv: `${species.nameSv} behöver minst ${species.minTankLiters} liter`,
        titleEn: `${species.nameEn} requires at least ${species.minTankLiters}L`,
        detailSv: `Ditt valda akvarium är ${liters}L. Välj ett större akvarium eller en mindre art som passar volymen.`,
        detailEn: `Your selected tank is ${liters}L. Choose a larger tank or a smaller species.`,
        speciesIds: [species.id],
      });
    }
  });

  // 2. Check Betta solitary rule
  const bettaEntry = populated.find((p) => p.species.id === 'betta-splendens');
  if (bettaEntry && bettaEntry.count > 1) {
    alerts.push({
      id: 'betta-multi-error',
      severity: 'error',
      titleSv: 'Endast 1 Kampfisk per akvarium!',
      titleEn: 'Only 1 Betta fish per aquarium!',
      detailSv: `Du har valt ${bettaEntry.count} st Kampfiskar. Kampfiskhanar är starkt revirhävdande och slåss med varandra — ha alltid bara 1 st!`,
      detailEn: `You have ${bettaEntry.count} Bettas. Male Bettas are fiercely territorial toward each other — always keep just 1!`,
      speciesIds: ['betta-splendens'],
    });
  }

  // 3. Check species-to-species incompatibilities
  const seenPairs = new Set<string>();
  for (let i = 0; i < populated.length; i++) {
    for (let j = i + 1; j < populated.length; j++) {
      const a = populated[i].species;
      const b = populated[j].species;
      if (
        a.incompatibleWithIds.includes(b.id) ||
        b.incompatibleWithIds.includes(a.id)
      ) {
        const pairKey = [a.id, b.id].sort().join('--');
        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey);

          let reasonSv = `${a.nameSv} och ${b.nameSv} trivs inte ihop i samma akvarium.`;
          let reasonEn = `${a.nameEn} and ${b.nameEn} are not compatible in the same tank.`;

          if (
            (a.id === 'betta-splendens' && b.id === 'guppy') ||
            (b.id === 'betta-splendens' && a.id === 'guppy')
          ) {
            reasonSv =
              'Kampfisken kan uppfatta Guppyns långa, färggranna stjärtfena som en rivaliserande kampfisk och gå till attack!';
            reasonEn =
              'Bettas often mistake the long, colorful tails of Guppies for rival Bettas and nip their fins!';
          } else if (a.finNipper || b.finNipper) {
            reasonSv =
              'Praktbarber är busiga fenbitare som gärna nafsar i långa fenor på lugnare fiskar.';
            reasonEn =
              'Tiger Barbs are notorious fin-nippers that will harass slower, long-finned tankmates.';
          } else if (
            (a.id === 'angelfish' && (b.id === 'neon-tetra' || b.id === 'cherry-shrimp')) ||
            (b.id === 'angelfish' && (a.id === 'neon-tetra' || a.id === 'cherry-shrimp'))
          ) {
            reasonSv =
              'När Skalarer växer sig stora är små neontetror och körsbärsräkor deras naturliga bytesdjur i Amazonas!';
            reasonEn =
              'Full-grown Angelfish view tiny Neon Tetras and Cherry Shrimp as natural bite-sized snacks!';
          }

          alerts.push({
            id: `incompat-${pairKey}`,
            severity: 'error',
            titleSv: `Krock: ${a.nameSv} + ${b.nameSv}`,
            titleEn: `Conflict: ${a.nameEn} + ${b.nameEn}`,
            detailSv: reasonSv,
            detailEn: reasonEn,
            speciesIds: [a.id, b.id],
          });
        }
      }
    }
  }

  // 4. Check minimum schooling sizes
  populated.forEach(({ species, count }) => {
    if (count < species.minGroupSize) {
      alerts.push({
        id: `school-size-${species.id}`,
        severity: 'warning',
        titleSv: `${species.nameSv} vill ha fler kompisar (${count}/${species.minGroupSize} st)`,
        titleEn: `${species.nameEn} needs a larger group (${count}/${species.minGroupSize})`,
        detailSv: `${species.nameSv} är en flock-/stimfisk som blir blyg och stressad om de är för få. Rekommenderat antal: minst ${species.minGroupSize}–${species.recommendedGroupSize} st.`,
        detailEn: `${species.nameEn} is a social schooling species that feels safest in groups of ${species.minGroupSize}–${species.recommendedGroupSize}+.`,
        speciesIds: [species.id],
      });
    }
  });

  // 5. Check temperature mismatch
  if (!tempValid) {
    alerts.push({
      id: 'temp-mismatch',
      severity: 'warning',
      titleSv: 'Temperaturkrock mellan arterna',
      titleEn: 'Temperature range mismatch',
      detailSv:
        'Några av dina valda arter föredrar svalare vatten medan andra kräver riktigt varmt vatten (25°C+). Kontrollera temperaturintervallen!',
      detailEn:
        'Some chosen species prefer cooler water while others require warm tropical water (25°C+).',
    });
  }

  // 6. Check Bioload
  if (bioloadPercent > 115) {
    alerts.push({
      id: 'bioload-over',
      severity: 'error',
      titleSv: `Fullt i akvariet (${bioloadPercent}% belastning)`,
      titleEn: `Overstocked Tank (${bioloadPercent}% bioload)`,
      detailSv:
        'Det är lite för många (eller för stora) fiskar för den här vattenvolymen. Dra ner lite på antalet eller välj ett större akvarium!',
      detailEn:
        'Too many fish for this water volume. Reduce counts slightly or step up to a larger tank!',
    });
  } else if (bioloadPercent > 90) {
    alerts.push({
      id: 'bioload-high',
      severity: 'warning',
      titleSv: `Ganska hög belastning (${bioloadPercent}%)`,
      titleEn: `High Bioload (${bioloadPercent}%)`,
      detailSv:
        'Akvariet är välfyllt! Se till att ha ett bra filter, levande växter och byt 25–30% vatten varje vecka.',
      detailEn:
        'Tank is well-stocked! Ensure good filtration, live plants, and weekly 25–30% water changes.',
    });
  }

  const needsSand = populated.some((p) => p.species.needsSandSubstrate);
  const needsDriftwood = populated.some((p) => p.species.needsDriftwood);

  if (needsSand) {
    alerts.push({
      id: 'tip-sand',
      severity: 'tip',
      titleSv: 'Tips: Välj finkornig sand på botten',
      titleEn: 'Tip: Use soft sand substrate',
      detailSv:
        'Du har valt bottenfiskar (t.ex. Pansarmal eller Kuhlii-ål) som älskar att böka med nosen i mjuk sand utan vassa stenar.',
      detailEn:
        'Your bottom dwellers (Corydoras / Loaches) love sifting soft sand to protect their delicate barbels.',
    });
  }

  if (needsDriftwood) {
    alerts.push({
      id: 'tip-wood',
      severity: 'tip',
      titleSv: 'Tips: Lägg i en äkta trärot (Mangrove/Redmoor)',
      titleEn: 'Tip: Add real driftwood',
      detailSv:
        'Ancistrus-malen behöver gnaga på äkta trärot för sin matsmältning och gillar att gömma sig på undersidan.',
      detailEn:
        'Bristlenose Plecos rasp on natural driftwood fibers for healthy digestion.',
    });
  }

  const hasErrorOrWarning = alerts.some(
    (a) => a.severity === 'error' || a.severity === 'warning'
  );

  if (!hasErrorOrWarning && populated.length >= 2) {
    alerts.unshift({
      id: 'harmony-success',
      severity: 'success',
      titleSv: 'Drömkombination! Alla fiskar trivs ihop',
      titleEn: 'Dream Combination! All species are in harmony',
      detailSv: `Utmärkt balans! Rekommenderad temperatur: ${Math.round(
        (maxMinTemp + minMaxTemp) / 2
      )}°C och pH runt ${((maxMinPh + minMaxPh) / 2).toFixed(1)}.`,
      detailEn: `Great balance! Target temperature: ${Math.round(
        (maxMinTemp + minMaxTemp) / 2
      )}°C and pH around ${((maxMinPh + minMaxPh) / 2).toFixed(1)}.`,
    });
  }

  return {
    totalFishCount,
    bioloadPercent,
    tempOverlap: { min: maxMinTemp, max: minMaxTemp, valid: tempValid },
    phOverlap: { min: maxMinPh, max: minMaxPh, valid: phValid },
    zoneCounts,
    alerts,
    needsSand,
    needsDriftwood,
  };
}
