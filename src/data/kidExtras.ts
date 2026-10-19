export interface SpeciesKidMeta {
  photoUrl: string;
  emoji: string;
  superpowerSv: string;
  superpowerEn: string;
  questClueSv: string;
  questClueEn: string;
}

export const SPECIES_KID_META: Record<string, SpeciesKidMeta> = {
  'neon-tetra': {
    photoUrl: '/fish/neon-tetra.jpg',
    emoji: '⚡',
    superpowerSv: 'Lyser som ett blå-rött lasersvärd!',
    superpowerEn: 'Glows like a blue-and-red lightsaber!',
    questClueSv: 'Hitta den lilla fisken som lyser i blått och rött mitt i akvariet!',
    questClueEn: 'Find the little fish glowing bright blue and red in the middle!',
  },
  'cardinal-tetra': {
    photoUrl: '/fish/cardinal-tetra.jpg',
    emoji: '🚀',
    superpowerSv: 'Super-röd mage hela vägen till stjärten!',
    superpowerEn: 'Bright red belly all the way to its tail!',
    questClueSv: 'Hitta fisken med knallröd mage och lysande blå rygg!',
    questClueEn: 'Find the fish with a bright red belly and neon blue back!',
  },
  'harlequin-rasbora': {
    photoUrl: '/fish/harlequin-rasbora.jpg',
    emoji: '🔺',
    superpowerSv: 'Har en hemlig svart triangel på magen!',
    superpowerEn: 'Wears a secret black triangle on its side!',
    questClueSv: 'Hitta den koppar-orange fisken med en svart triangel på sidan!',
    questClueEn: 'Find the copper-orange fish with a black triangle on its side!',
  },
  'rummy-nose-tetra': {
    photoUrl: '/fish/rummy-nose-tetra.jpg',
    emoji: '🔴',
    superpowerSv: 'Röd nos som Rudolf med röda mulen!',
    superpowerEn: 'Bright red nose like Rudolph the Reindeer!',
    questClueSv: 'Hitta fisken med knallröd nos och svartvit-rutig stjärtfena!',
    questClueEn: 'Find the fish with a bright red nose and checkered tail!',
  },
  'zebra-danio': {
    photoUrl: '/fish/zebra-danio.jpg',
    emoji: '🦓',
    superpowerSv: 'Randig rymdfisk som varit uppe i rymden!',
    superpowerEn: 'Striped space-fish that has flown in space!',
    questClueSv: 'Hitta den snabba zebrarandiga fisken högt uppe vid ytan!',
    questClueEn: 'Find the speedy zebra-striped fish near the top!',
  },
  guppy: {
    photoUrl: '/fish/guppy.jpg',
    emoji: '🌈',
    superpowerSv: 'Regnbågs-stjärt som fladdrar i vattnet!',
    superpowerEn: 'Rainbow tail that flutters in the water!',
    questClueSv: 'Hitta den färgglada lilla fisken med stor vacker regnbågs-stjärt!',
    questClueEn: 'Find the colorful little fish with a big fancy rainbow tail!',
  },
  platy: {
    photoUrl: '/fish/platy.jpg',
    emoji: '🍊',
    superpowerSv: 'Rund och glad som en lysande mandarin!',
    superpowerEn: 'Round and happy like a bright tangerine!',
    questClueSv: 'Hitta den runda, sol-orange fisken som alltid letar efter mat!',
    questClueEn: 'Find the round, sunny-orange fish that is always looking for snacks!',
  },
  swordtail: {
    photoUrl: '/fish/swordtail.jpg',
    emoji: '⚔️',
    superpowerSv: 'Har ett coolt riddar-svärd på stjärtfenan!',
    superpowerEn: 'Has a cool knight’s sword on its tail fin!',
    questClueSv: 'Hitta den röda fisken med ett långt spetsigt svärd på stjärten!',
    questClueEn: 'Find the red fish with a long pointy sword on its tail!',
  },
  'cherry-barb': {
    photoUrl: '/fish/cherry-barb.jpg',
    emoji: '🍓',
    superpowerSv: 'Röd som en mogen sommar-jordgubbe!',
    superpowerEn: 'Bright red like a ripe summer strawberry!',
    questClueSv: 'Hitta den bär-röda fisken som simmar runt bland växterna!',
    questClueEn: 'Find the berry-red fish swimming among the plants!',
  },
  betta: {
    photoUrl: '/fish/betta.jpg',
    emoji: '👑',
    superpowerSv: 'Akvariets kung med gigantisk kungamantel!',
    superpowerEn: 'King of the tank with a giant royal cape!',
    questClueSv: 'Hitta kungsfisken med de allra största, fladdrande fenorna vid ytan!',
    questClueEn: 'Find the royal fish with the biggest flowing fins near the top!',
  },
  'honey-gourami': {
    photoUrl: '/fish/honey-gourami.jpg',
    emoji: '🍯',
    superpowerSv: 'Har två magiska känselspröt att vinka med!',
    superpowerEn: 'Has two magic feelers to wave hello!',
    questClueSv: 'Hitta den solgula honungs-fisken uppe vid ytan!',
    questClueEn: 'Find the sunny yellow honey-fish near the water surface!',
  },
  'dwarf-gourami': {
    photoUrl: '/fish/dwarf-gourami.jpg',
    emoji: '🎨',
    superpowerSv: 'Målad i glittrande turkos och eldröda ränder!',
    superpowerEn: 'Painted in sparkling turquoise and fiery red stripes!',
    questClueSv: 'Hitta guramin med turkosa och röda ränder på kroppen!',
    questClueEn: 'Find the gourami with turquoise and red stripes on its body!',
  },
  'german-blue-ram': {
    photoUrl: '/fish/german-blue-ram.jpg',
    emoji: '💎',
    superpowerSv: 'Glittrar som blå diamanter och har punk-frisyr!',
    superpowerEn: 'Sparkles like blue diamonds with a punk mohawk!',
    questClueSv: 'Hitta den gul-blå diamant-fisken med ståtlig ryggfena!',
    questClueEn: 'Find the yellow-and-blue diamond fish with a spiky top fin!',
  },
  angelfish: {
    photoUrl: '/fish/angelfish.jpg',
    emoji: '⛵',
    superpowerSv: 'Ser ut som en majestätisk segelbåt under vattnet!',
    superpowerEn: 'Looks like a majestic underwater sailboat!',
    questClueSv: 'Hitta den höga, trekantiga fisken med långa segel-fenor!',
    questClueEn: 'Find the tall triangle-shaped fish with long sail fins!',
  },
  'bronze-cory': {
    photoUrl: '/fish/bronze-cory.jpg',
    emoji: '🧹',
    superpowerSv: 'Söt botten-dammsugare som kan blinka med ögonen!',
    superpowerEn: 'Cute bottom vacuum that can wink its eyes!',
    questClueSv: 'Hitta den bronsfärgade pansarmalen som nosar i sanden på botten!',
    questClueEn: 'Find the bronze catfish sniffing the sand at the bottom!',
  },
  'panda-cory': {
    photoUrl: '/fish/panda-cory.jpg',
    emoji: '🐼',
    superpowerSv: 'Har svart bandit-mask precis som en pandabjörn!',
    superpowerEn: 'Wears a black mask just like a baby panda bear!',
    questClueSv: 'Hitta den lilla panda-fisken med svart fläck över ögat på botten!',
    questClueEn: 'Find the little panda fish with a black patch over its eye on the bottom!',
  },
  'bristlenose-pleco': {
    photoUrl: '/fish/bristlenose-pleco.jpg',
    emoji: '🧽',
    superpowerSv: 'Fönsterputsare med super-sugmun och skägg!',
    superpowerEn: 'Window cleaner with a super suction-cup mouth!',
    questClueSv: 'Hitta den prickiga sugmalen nere på botten!',
    questClueEn: 'Find the spotted suction-mouth catfish down at the bottom!',
  },
  'kuhli-loach': {
    photoUrl: '/fish/kuhli-loach.jpg',
    emoji: '🐍',
    superpowerSv: 'Snäll och kittlig randig spagetti-fisk!',
    superpowerEn: 'Friendly wiggly striped spaghetti fish!',
    questClueSv: 'Hitta den långa randiga Kuhlii-ålen som slingrar sig på botten!',
    questClueEn: 'Find the long striped Kuhli loach wiggling along the bottom!',
  },
  otocinclus: {
    photoUrl: '/fish/otocinclus.jpg',
    emoji: '🍃',
    superpowerSv: 'Liten blad-akrobat som putsar alla växter rena!',
    superpowerEn: 'Little leaf acrobat that polishes every plant clean!',
    questClueSv: 'Hitta den lilla silver-svarta algätaren nära botten!',
    questClueEn: 'Find the tiny silver-and-black algae eater near the bottom!',
  },
  'cherry-shrimp': {
    photoUrl: '/fish/cherry-shrimp.jpg',
    emoji: '🍒',
    superpowerSv: 'Knallröd mini-robot som städar med 10 små ben!',
    superpowerEn: 'Bright red mini-robot cleaning with 10 tiny legs!',
    questClueSv: 'Hitta den lilla knallröda körsbärsräkan nere på botten!',
    questClueEn: 'Find the tiny bright-red cherry shrimp down at the bottom!',
  },
  'nerite-snail': {
    photoUrl: '/fish/nerite-snail.jpg',
    emoji: '🐌',
    superpowerSv: 'Randig super-snäcka med eget hus på ryggen!',
    superpowerEn: 'Striped super-snail carrying its house on its back!',
    questClueSv: 'Hitta den gul-svart-randiga zebrasnäckan på botten!',
    questClueEn: 'Find the yellow-and-black striped zebra snail on the bottom!',
  },
};

export function getKidMeta(speciesId: string): SpeciesKidMeta {
  return (
    SPECIES_KID_META[speciesId] || {
      photoUrl: `/fish/${speciesId}.jpg`,
      emoji: '🐠',
      superpowerSv: 'Supercool akvariefisk!',
      superpowerEn: 'Super cool aquarium fish!',
      questClueSv: 'Hitta den här fisken i akvariet!',
      questClueEn: 'Find this fish in the aquarium!',
    }
  );
}
