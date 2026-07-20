// Canonical editable source for the public catalog snapshot.
// Derived from tylercamp/palcalc 431b217b0f78bbef400baaa3aea20c8e99e9444c.

import type {
  PalworldGameData,
  PalworldPalDefinition,
  PalworldPassiveSkillDefinition,
} from "../game-data-contract";

type CompactPalDefinition = readonly [
  internalName: string,
  name: string,
  paldeckNumber: number | null,
  paldeckCode: string | null,
  paldeckVariant: boolean,
  rarity: number | null,
  minWildLevel: number | null,
  maxWildLevel: number | null,

];
type CompactPassiveSkillDefinition = readonly [
  internalName: string,
  name: string,

  description: string,

  rank: number,
  randomInheritanceAllowed: boolean,
  randomInheritanceWeight: number,
];

export const PALWORLD_V1_METADATA = {
  "sourceName": "tylercamp/palcalc",
  "sourceCommit": "431b217b0f78bbef400baaa3aea20c8e99e9444c",
  "sourceDataVersion": "v26",
  "sourceLicense": "MIT",
  "gameVersion": "1.0.0",
  "gameDataVersion": "palworld-1.0-v26-20260711",
  "compatibility": "Palworld 1.0.x",
  "verifiedAgainstGameVersion": "1.0.1",
  "supplementalLocalizationSource": {
    "sourceName": "PalDB",
    "sourceUrls": [
      "https://paldb.cc/json/iv_{locale}.json",
      "https://paldb.cc/{locale}/hover?s=PassiveSkills%2F{internalName}"
    ],
    "gameVersion": "v1.0.0",
    "capturedAt": "2026-07-10T16:26:43.431Z"
  },
  "excludedSpecies": [
    "PlantSlime_Flower"
  ],
  "selfOnlySpecies": [
    "KingWhale",
    "WorldTreeDragon"
  ],
  "correctionSources": [
    "https://paldb.cc/en/Breed",
    "https://paldb.cc/en/Panthalus",
    "https://paldb.cc/en/Astralym"
  ],
  "crossCheck": {
    "sourceName": "PalDB",
    "sourceCatalogUrl": "https://paldb.cc/en/Breed",
    "sourceFormulaUrlTemplate": "https://paldb.cc/en/api/pal_breed_3?child3={internalName}",
    "checkedAt": "2026-07-12",
    "checkedTargetCount": 299,
    "expectedFormulaCount": 44256,
    "actualFormulaCount": 44256,
    "missingFormulaCount": 0,
    "extraFormulaCount": 0,
    "duplicateFormulaCount": 55,
    "targetsWithDifferences": []
  },
  "palCount": 299,
  "normalBreedingSpeciesCount": 297,
  "passiveSkillCount": 115,
  "breedingRowCount": 44256,
  "formulaTargetCount": 299,
  "formulaLessPalCount": 0,
  "sourceBreedingRowCount": 44851,
  "removedExcludedSpeciesFormulaCount": 299,
  "removedSelfOnlyCrossFormulaCount": 297,
  "addedSelfOnlyFormulaCount": 1
} as const;

const PALWORLD_V1_PALS: readonly CompactPalDefinition[] = [
["SheepBall","Lamball",1,"1",false,1,1,20],
["PinkCat","Cattiva",2,"2",false,1,1,20],
["ChickenPal","Chikipi",3,"3",false,1,1,25],
["Carbunclo","Lifmunk",4,"4",false,1,1,14],
["BluePlatypus","Fuack",5,"5",false,1,6,20],
["BluePlatypus_Fire","Fuack Ignis",5,"5B",true,2,32,50],
["CuteFox","Vixy",6,"6",false,2,1,25],
["FlyingManta","Celaray",7,"7",false,3,2,20],
["FlyingManta_Thunder","Celaray Lux",7,"7B",true,4,26,55],
["WoolFox","Cremis",8,"8",false,1,1,13],
["KendoFrog","Croajiro",9,"9",false,4,4,65],
["KendoFrog_Dark","Croajiro Noct",9,"9B",true,5,61,80],
["LeafMomonga","Herbil",10,"10",false,3,1,50],
["Ganesha","Teafant",11,"11",false,1,2,25],
["PlantSlime","Gumoss",12,"12",false,1,2,13],
["SamuraiDog","Pupperai",13,"13",false,2,2,4],
["CloverFairy","Clovee",14,"14",false,2,3,13],
["Hedgehog","Jolthog",15,"15",false,1,4,13],
["Hedgehog_Ice","Jolthog Cryst",15,"15B",true,2,1,24],
["NegativeKoala","Depresso",16,"16",false,1,4,35],
["Penguin","Pengullet",17,"17",false,1,1,45],
["Penguin_Electric","Pengullet Lux",17,"17B",true,2,50,55],
["CaptainPenguin","Penking",18,"18",false,6,15,44],
["CaptainPenguin_Black","Penking Lux",18,"18B",true,7,null,null],
["WizardOwl","Hoocrates",19,"19",false,1,4,22],
["Alpaca","Melpaca",20,"20",false,3,5,17],
["KingAlpaca","Kingpaca",21,"21",false,8,23,80],
["KingAlpaca_Ice","Kingpaca Cryst",21,"21B",true,9,46,46],
["DreamDemon","Daedream",22,"22",false,1,4,16],
["Monkey","Tanzee",23,"23",false,1,4,20],
["Monkey_Fire","Tanzee Ignis",23,"23B",true,2,10,12],
["NightFox","Nox",24,"24",false,6,1,25],
["LavaGirl","Flambelle",25,"25",false,1,1,50],
["FlameBambi","Rooby",26,"26",false,2,4,30],
["Bastet","Mau",27,"27",false,1,5,25],
["Bastet_Ice","Mau Cryst",27,"27B",true,2,1,45],
["Boar","Rushoar",28,"28",false,1,5,25],
["Kitsunebi","Foxparks",29,"29",false,1,5,18],
["Kitsunebi_Ice","Foxparks Cryst",29,"29B",true,1,15,58],
["NegativeOctopus","Killamari",30,"30",false,1,5,62],
["NegativeOctopus_Neutral","Killamari Primo",30,"30B",true,2,24,55],
["CuteMole","Fuddler",31,"31",false,1,1,40],
["Deer","Eikthyrdeer",32,"32",false,5,6,80],
["Deer_Ground","Eikthyrdeer Terra",32,"32B",true,6,20,80],
["Garm","Direhowl",33,"33",false,2,6,14],
["BerryGoat","Caprity",34,"34",false,3,6,30],
["BerryGoat_Dark","Caprity Noct",34,"34B",true,3,23,58],
["MopBaby","Swee",35,"35",false,1,1,34],
["MopKing","Sweepa",36,"36",false,6,11,40],
["TentacleTurtle","Turtacle",37,"37",false,3,5,50],
["TentacleTurtle_Ground","Turtacle Terra",37,"37B",true,4,40,65],
["WindChimes","Hangyu",38,"38",false,1,9,40],
["WindChimes_Ice","Hangyu Cryst",38,"38B",true,2,25,60],
["SweetsSheep","Woolipop",39,"39",false,3,9,19],
["SweetsSheep_Ground","Woolipop Terra",39,"39B",true,4,55,60],
["CowPal","Mozzarina",40,"40",false,2,9,19],
["BlueDragon","Azurobe",41,"41",false,7,35,80],
["BlueDragon_Ice","Azurobe Cryst",41,"41B",true,8,50,80],
["ElecCat","Sparkit",42,"42",false,1,1,12],
["Kelpie","Kelpsea",43,"43",false,1,9,20],
["Kelpie_Fire","Kelpsea Ignis",43,"43B",true,2,20,38],
["PinkRabbit","Ribbuny",44,"44",false,1,1,35],
["PinkRabbit_Grass","Ribbuny Botan",44,"44B",true,1,18,58],
["JellyfishFairy","Jelliette",45,"45",false,3,6,80],
["JellyfishGhost","Jellroy",46,"46",false,3,14,80],
["ClioneTwins","Amione",47,"47",false,2,9,65],
["OctopusGirl","Gloopie",48,"48",false,5,10,80],
["OctopusGirl_Neutral","Gloopie Primo",48,"48B",true,6,65,66],
["Eagle","Galeclaw",49,"49",false,2,11,29],
["GhostBlackCat","Wispaw",50,"50",false,5,11,73],
["HawkBird","Nitewing",51,"51",false,3,12,40],
["CatBat","Tombat",52,"52",false,5,10,45],
["ColorfulBird","Tocotoco",53,"53",false,1,1,47],
["Kirin","Univolt",54,"54",false,5,14,80],
["Kirin_Ice","Univolt Cryst",54,"54B",true,6,75,77],
["SharkKid","Gobfin",55,"55",false,2,14,34],
["SharkKid_Fire","Gobfin Ignis",55,"55B",true,3,20,50],
["Werewolf","Loupmoon",56,"56",false,3,14,38],
["Werewolf_Ice","Loupmoon Cryst",56,"56B",true,3,30,66],
["DarkCrow","Cawgnito",57,"57",false,3,14,57],
["FlameBuffalo","Arsox",58,"58",false,4,1,34],
["FluffyBird","Muffly",59,"59",false,2,15,65],
["LittleBriarRose","Bristla",60,"60",false,1,1,29],
["CuteButterfly","Cinnamoth",61,"61",false,4,16,29],
["ElecPomeranian","Puffolt",62,"62",false,2,18,69],
["FairyDragon","Elphidran",63,"63",false,7,20,80],
["FairyDragon_Water","Elphidran Aqua",63,"63B",true,8,33,80],
["BirdDragon","Vanwyrm",64,"64",false,5,20,63],
["BirdDragon_Ice","Vanwyrm Cryst",64,"64B",true,5,23,67],
["CatVampire","Felbat",65,"65",false,6,20,66],
["VioletFairy","Vaelet",66,"66",false,8,20,57],
["SoldierBee","Beegarde",67,"67",false,4,20,34],
["QueenBee","Elizabee",68,"68",false,8,34,39],
["PinkLizard","Lovander",69,"69",false,5,30,42],
["NaughtyCat","Grintale",70,"70",false,6,17,48],
["PurpleSpider","Tarantriss",71,"71",false,3,20,58],
["IceSeal","Polapup",72,"72",false,5,33,60],
["IceSeal_Ground","Polapup Terra",72,"72B",true,6,55,60],
["LizardMan","Leezpunk",73,"73",false,2,21,40],
["LizardMan_Fire","Leezpunk Ignis",73,"73B",true,3,28,40],
["Gorilla","Gorirat",74,"74",false,5,22,80],
["Gorilla_Ground","Gorirat Terra",74,"74B",true,5,30,80],
["Serpent","Surfent",75,"75",false,4,12,35],
["Serpent_Ground","Surfent Terra",75,"75B",true,5,31,63],
["RobinHood","Robinquill",76,"76",false,5,22,34],
["RobinHood_Ground","Robinquill Terra",76,"76B",true,6,30,55],
["FlowerRabbit","Flopie",77,"77",false,1,1,35],
["FoxMage","Wixen",78,"78",false,6,20,38],
["FoxMage_Dark","Wixen Noct",78,"78B",true,6,30,55],
["CatMage","Katress",79,"79",false,6,20,46],
["CatMage_Fire","Katress Ignis",79,"79B",true,6,30,52],
["HadesBird","Helzephyr",80,"80",false,7,24,80],
["HadesBird_Electric","Helzephyr Lux",80,"80B",true,8,47,80],
["GrassMinotaur","Elgrove",81,"81",false,6,24,80],
["GrassMinotaur_Ice","Elgrove Cryst",81,"81B",true,7,75,77],
["Mutant","Lunaris",82,"82",false,6,25,49],
["FengyunDeeper","Fenglope",83,"83",false,3,25,80],
["FengyunDeeper_Electric","Fenglope Lux",83,"83B",true,3,57,80],
["FlowerDinosaur","Dinossom",84,"84",false,6,10,35],
["FlowerDinosaur_Electric","Dinossom Lux",84,"84B",true,7,15,47],
["Ronin","Bushi",85,"85",false,7,25,59],
["Ronin_Dark","Bushi Noct",85,"85B",true,7,46,67],
["IceCrocodile","Munchill",86,"86",false,3,10,60],
["GrassMammoth","Mammorest",87,"87",false,8,26,80],
["GrassMammoth_Ice","Mammorest Cryst",87,"87B",true,9,36,80],
["StuffedShark","Finsider",88,"88",false,3,1,40],
["StuffedShark_Fire","Finsider Ignis",88,"88B",true,4,null,null],
["FlowerDoll","Petallia",89,"89",false,8,28,57],
["FlowerDoll_Fire","Petallia Ignis",89,"89B",true,9,71,73],
["PandaGirl","Leafan",90,"90",false,7,28,69],
["Baphomet","Incineram",91,"91",false,4,30,44],
["Baphomet_Dark","Incineram Noct",91,"91B",true,5,37,39],
["RaijinDaughter","Dazzi",92,"92",false,2,1,55],
["RaijinDaughter_Water","Dazzi Noct",92,"92B",true,2,20,66],
["FireKirin","Pyrin",93,"93",false,6,29,80],
["FireKirin_Dark","Pyrin Noct",93,"93B",true,7,32,80],
["LazyDragon","Relaxaurus",94,"94",false,8,30,80],
["LazyDragon_Electric","Relaxaurus Lux",94,"94B",true,9,48,80],
["IceFox","Foxcicle",95,"95",false,5,15,37],
["ThunderBird","Beakon",96,"96",false,6,30,80],
["ThunderBird_Ice","Beakon Cryst",96,"96B",true,7,75,77],
["GhostAnglerfish","Ghangler",97,"97",false,5,30,80],
["GhostAnglerfish_Fire","Ghangler Ignis",97,"97B",true,6,null,null],
["ThunderDog","Rayhound",98,"98",false,5,20,58],
["ThunderDog_Ice","Rayhound Cryst",98,"98B",true,6,35,77],
["DarkScorpion","Menasting",99,"99",false,9,31,44],
["DarkScorpion_Ground","Menasting Terra",99,"99B",true,10,48,55],
["CactusDoll","Needoll",100,"100",false,2,31,40],
["CactusDoll_Dark","Needoll Noct",100,"100B",true,3,33,36],
["IceDeer","Reindrix",101,"101",false,4,32,80],
["GrassPanda","Mossanda",102,"102",false,6,27,80],
["GrassPanda_Electric","Mossanda Lux",102,"102B",true,7,15,80],
["WeaselDragon","Chillet",103,"103",false,4,11,80],
["WeaselDragon_Fire","Chillet Ignis",103,"103B",true,5,30,80],
["RedArmorBird","Ragnahawk",104,"104",false,7,32,80],
["VolcanoDragon","Moldron",105,"105",false,7,32,80],
["VolcanoDragon_Ice","Moldron Cryst",105,"105B",true,8,78,78],
["TropicalOstrich","Palumba",106,"106",false,6,32,50],
["DrillGame","Digtoise",107,"107",false,5,17,44],
["SakuraSaurus","Broncherry",108,"108",false,8,23,80],
["SakuraSaurus_Water","Broncherry Aqua",108,"108B",true,8,30,80],
["LazyCatfish","Dumud",109,"109",false,4,1,50],
["LazyCatfish_Gold","Dumud Gild",109,"109B",true,5,25,65],
["Plesiosaur","Braloha",110,"110",false,8,33,80],
["AmaterasuWolf","Kitsun",111,"111",false,6,34,38],
["AmaterasuWolf_Dark","Kitsun Noct",111,"111B",true,6,56,66],
["Manticore","Blazehowl",112,"112",false,7,30,80],
["Manticore_Dark","Blazehowl Noct",112,"112B",true,8,34,80],
["HerculesBeetle","Warsect",113,"113",false,8,34,80],
["HerculesBeetle_Ground","Warsect Terra",113,"113B",true,9,30,64],
["SnowPeafowl","Frostplume",114,"114",false,4,39,68],
["DarkFlameFox","Majex",115,"115",false,5,35,77],
["WhiteMoth","Sibelyx",116,"116",false,7,25,45],
["WhiteMoth_Neutral","Sibelyx Primo",116,"116B",true,8,75,78],
["GhostBeast","Maraith",117,"117",false,6,38,60],
["MushroomDragon","Shroomer",118,"118",false,4,30,77],
["MushroomDragon_Dark","Shroomer Noct",118,"118B",true,5,39,77],
["IceWitch","Icelyn",119,"119",false,4,null,null],
["MummyPal","Gildra",120,"120",false,5,39,80],
["Umihebi","Jormuntide",121,"121",false,8,55,80],
["Umihebi_Fire","Jormuntide Ignis",121,"121B",true,9,66,80],
["Suzaku","Suzaku",122,"122",false,8,40,80],
["Suzaku_Water","Suzaku Aqua",122,"122B",true,9,42,80],
["FeatherOstrich","Dazemu",123,"123",false,5,31,49],
["SkyDragon","Quivern",124,"124",false,7,40,80],
["SkyDragon_Grass","Quivern Botan",124,"124B",true,8,45,80],
["LeafPrincess","Lullu",125,"125",false,4,30,65],
["SmallArmadillo","Kikit",126,"126",false,4,30,49],
["GuardianDog","Yakumo",127,"127",false,4,30,65],
["SwordCutlassfish","Skutlass",128,"128",false,5,30,66],
["SwordCutlassfish_Fire","Skutlass Ignis",128,"128B",true,5,40,44],
["VolcanicMonster","Reptyro",129,"129",false,6,36,50],
["VolcanicMonster_Ice","Reptyro Cryst",129,"129B",true,7,42,67],
["NightBlueHorse","Starryon",130,"130",false,7,42,80],
["NightBlueHorse_Neutral","Starryon Primo",130,"130B",true,8,74,76],
["RockBeast","Pierdon",131,"131",false,6,42,50],
["RockBeast_Ice","Pierdon Cryst",131,"131B",true,7,68,69],
["WhiteTiger","Cryolinx",132,"132",false,7,42,49],
["WhiteTiger_Ground","Cryolinx Terra",132,"132B",true,7,56,64],
["SmallYeti","Snugloo",133,"133",false,3,32,34],
["Yeti","Wumpo",134,"134",false,7,42,80],
["Yeti_Grass","Wumpo Botan",134,"134B",true,8,38,80],
["CandleGhost","Sootseer",135,"135",false,7,45,67],
["VenusFlytrap","Carnibora",136,"136",false,6,45,48],
["KingBahamut","Blazamut",137,"137",false,9,46,80],
["KingBahamut_Dragon","Blazamut Ryu",137,"137B",true,10,null,null],
["GrassGolem","Dualith",138,"138",false,8,46,80],
["GrassGolem_Dark","Dualith Noct",138,"138B",true,8,70,77],
["Anubis","Anubis",139,"139",false,10,55,80],
["Sekhmet","Sekhmet",140,"140",false,5,37,80],
["ScorpionMan","Prixter",141,"141",false,5,48,49],
["ScorpionMan_Electric","Prixter Lux",141,"141B",true,6,65,70],
["CubeTurtle","Tetroise",142,"142",false,8,48,80],
["CubeTurtle_Neutral","Tetroise Primo",142,"142B",true,8,60,78],
["BadCatgirl","Nyafia",143,"143",false,4,30,60],
["MimicDog","Mimog",144,"144",false,7,5,80],
["DarkAlien","Xenovader",145,"145",false,7,25,30],
["WhiteAlienDragon","Xenogard",146,"146",false,9,null,null],
["BlueberryFairy","Prunelia",147,"147",false,5,30,66],
["GhostRabbit","Nitemary",148,"148",false,6,50,67],
["GhostRabbit_Grass","Nitemary Botan",148,"148B",true,7,50,54],
["BlackPuppy","Smokie",149,"149",false,2,30,66],
["BlackPuppy_Ice","Smokie Cryst",149,"149B",true,3,62,64],
["MysteryMask","Omascul",150,"150",false,4,50,66],
["IceNarwhal","Whalaska",151,"151",false,8,42,80],
["IceNarwhal_Fire","Whalaska Ignis",151,"151B",true,8,58,80],
["GrassRabbitMan","Verdash",152,"152",false,8,35,53],
["GrimGirl","Splatterina",153,"153",false,4,52,80],
["GoldenHorse","Gildane",154,"154",false,8,53,66],
["SifuDog","Dogen",155,"155",false,6,51,56],
["SumoDog","Bulldosu",156,"156",false,4,53,56],
["WhiteDeer","Celesdir",157,"157",false,6,54,80],
["WhiteDeer_Dark","Celesdir Noct",157,"157B",true,7,79,79],
["BlackMetalDragon","Astegon",158,"158",false,9,55,80],
["WingGolem","Knocklem",159,"159",false,9,55,80],
["WingGolem_Fire","Knocklem Ignis",159,"159B",true,10,65,73],
["WhiteShieldDragon","Silvegis",160,"160",false,8,59,80],
["BlueThunderHorse","Azurmane",161,"161",false,7,57,80],
["LongCat","Valentail",162,"162",false,2,63,69],
["ElecSnail","Snock",163,"163",false,2,63,69],
["ElecSnail_Ground","Snock Lux",163,"163B",true,3,74,76],
["DandelionGirl","Souffline",164,"164",false,3,63,69],
["BrownRabbit","Lapiron",165,"165",false,3,63,69],
["HoodGhost","Hoodle",166,"166",false,3,65,69],
["ElecLizard","Slowatt",167,"167",false,4,65,66],
["OniGhostGirl","Bakemi",168,"168",false,4,65,69],
["KingSunfish","Solmora",169,"169",false,4,66,67],
["KingSunfish_Thunder","Solmora Lux",169,"169B",true,5,76,78],
["SleeveRabbit","Lapure",170,"170",false,4,65,69],
["GhostDragon","Eidrolon",171,"171",false,7,65,80],
["GhostDragon_Fire","Eidrolon Ignis",171,"171B",true,8,75,77],
["ThunderFluffyBird","Dynamoff",172,"172",false,6,63,69],
["RedFlowerBird","Tropicaw",173,"173",false,5,63,69],
["FoxExorcist","Flaracle",174,"174",false,7,65,80],
["LotusDragon","Ophydia",175,"175",false,9,69,80],
["ClownRabbit","Dupin",176,"176",false,7,55,74],
["ThiefBird","Roujay",177,"177",false,5,74,78],
["SnakeGirl","Venusa",178,"178",false,5,75,77],
["MushroomLady","Mycora",179,"179",false,6,75,78],
["LanternButler","Loomen",180,"180",false,5,75,77],
["MoonChild","Wistella",181,"181",false,2,66,78],
["MonochromeQueen","Solenne",182,"182",false,7,76,78],
["KabukiMan","Renjishi",183,"183",false,7,78,80],
["DomeArmorDragon","Aegidron",184,"184",false,8,79,79],
["ElecPanda","Grizzbolt",185,"185",false,8,30,80],
["LilyQueen","Lyleen",186,"186",false,9,58,80],
["LilyQueen_Dark","Lyleen Noct",186,"186B",true,10,49,80],
["ThunderDragonMan","Orserk",187,"187",false,9,74,80],
["Horus","Faleris",188,"188",false,9,76,80],
["Horus_Water","Faleris Aqua",188,"188B",true,9,56,80],
["BlackGriffon","Shadowbeak",189,"189",false,10,50,80],
["MoonQueen","Selyne",190,"190",false,9,76,80],
["SnowTigerBeastman","Bastigor",191,"191",false,8,75,80],
["BlueSkyDragon","Shaolong",192,"192",false,9,76,78],
["Mothman","Silvance",193,"193",false,8,null,null],
["FlowerPrince","Dandilord",194,"194",false,8,null,null],
["NightLady","Bellanoir",195,"195",false,20,null,null],
["NightLady_Dark","Bellanoir Libero",195,"195B",true,20,null,null],
["DarkMechaDragon","Xenolord",196,"196",false,8,null,null],
["LegendDeer","Hartalis",197,"197",false,10,null,null],
["SaintCentaur","Paladius",198,"198",false,20,60,60],
["BlackCentaur","Necromus",199,"199",false,20,60,60],
["IceHorse","Frostallion",200,"200",false,20,60,60],
["IceHorse_Dark","Frostallion Noct",200,"200B",true,20,65,65],
["PoseidonOrca","Neptilius",201,"201",false,20,60,60],
["JetDragon","Jetragon",202,"202",false,20,60,70],
["KingWhale","Panthalus",203,"203",false,10,null,null],
["WorldTreeDragon","Astralym",204,"204",false,null,null,null],
["YakushimaBoss001","Eye of Cthulhu",null,null,false,6,45,45],
["YakushimaBoss001_Small","Demon Eye",null,null,false,3,33,35],
["YakushimaMonster001","Green Slime",null,null,false,3,33,35],
["YakushimaMonster001_Blue","Blue Slime",null,null,false,3,33,35],
["YakushimaMonster001_Pink","Illuminant Slime",null,null,false,4,42,44],
["YakushimaMonster001_Purple","Purple Slime",null,null,false,3,36,41],
["YakushimaMonster001_Rainbow","Rainbow Slime",null,null,false,4,42,44],
["YakushimaMonster001_Red","Red Slime",null,null,false,3,36,41],
["YakushimaMonster002","Enchanted Sword",null,null,false,3,42,44],
["YakushimaMonster003","Cave Bat",null,null,false,3,36,41],
["YakushimaMonster003_Purple","Illuminant Bat",null,null,false,4,42,44]
];

const PALWORLD_V1_PASSIVE_SKILLS: readonly CompactPassiveSkillDefinition[] = [
["CraftSpeed_up3","Remarkable Craftsmanship","Work Speed +75%",4,true,5],
["CraftSpeed_up2","Artisan","Work Speed +50%",3,true,100],
["CraftSpeed_up1","Serious","Work Speed +20%",1,true,100],
["CraftSpeed_down1","Clumsy","Work Speed -10%",-1,true,100],
["CraftSpeed_down2","Slacker","Work Speed -30%",-3,true,100],
["Deffence_up3","Diamond Body","Defense +30%\nImmune to Flinch\nImmune to Knockback",4,true,5],
["Deffence_up2","Burly Body","Defense +20%\nImmune to Flinch",3,true,100],
["Deffence_up1","Hard Skin","Defense +10%",1,true,100],
["Deffence_down1","Downtrodden","Defense -10%",-1,true,100],
["Deffence_down2","Brittle","Defense -20%",-3,true,100],
["Noukin","Musclehead","Attack +30%\nWork Speed -50%",2,true,100],
["Rare","Lucky","Attack +15%\nDefense +15%\nWork Speed +20%",4,false,100],
["Legend","Legend","Attack +20%\nDefense +20%\nMovement Speed increases 20%",4,false,100],
["Witch","Siren of the Void","30% increase in Dark attack damage.\n30% increase in Ice attack damage.",4,false,100],
["EternalFlame","Eternal Flame","30% increase to Fire attack damage.\n30% increase to Lightning attack damage.",4,false,100],
["Invader","Invader","30% increase in Dark attack damage.\n30% increase in Dragon attack damage.",4,false,100],
["PAL_ALLAttack_up3","Demon God","Attack +30%\nDefense +5%",4,true,5],
["PAL_ALLAttack_up2","Ferocious","Attack +20%",3,true,100],
["PAL_ALLAttack_up1","Brave","Attack +10%",1,true,100],
["PAL_ALLAttack_down1","Coward","Attack -10%",-1,true,100],
["PAL_ALLAttack_down2","Pacifist","Attack -20%",-3,true,100],
["PAL_rude","Hooligan","Attack +15%\nWork Speed -10%",1,true,100],
["PAL_conceited","Conceited","Work Speed +10%\nDefense -10%",1,true,100],
["PAL_sadist","Sadist","Attack +15%\nDefense -15%",1,true,100],
["PAL_masochist","Masochist","Defense +15%\nAttack -15%",1,true,100],
["PAL_CorporateSlave","Work Slave","Work Speed +30%\nAttack -30%",1,true,100],
["PAL_oraora","Aggressive","Attack +10%\nDefense -10%",1,true,100],
["TrainerATK_UP_1","Vanguard","10% increase in Player Attack.",3,true,100],
["TrainerDEF_UP_1","Stronghold Strategist","10% increase in Player Defense.",3,true,100],
["TrainerWorkSpeed_UP_1","Motivational Leader","25% increase in Player Work Speed.",3,true,100],
["TrainerMining_up1","Mine Foreman","25% increase in Player Mining Efficiency.",3,true,100],
["TrainerLogging_up1","Logging Foreman","25% increase in Player Logging Efficiency.",3,true,100],
["ElementResist_Normal_1_PAL","Abnormal","10% decrease in incoming Neutral damage.",1,true,100],
["ElementResist_Fire_1_PAL","Suntan Lover","10% decrease in incoming Fire damage.",1,true,100],
["ElementResist_Aqua_1_PAL","Waterproof","10% decrease in incoming Water damage.",1,true,100],
["ElementResist_Thunder_1_PAL","Insulated Body","10% decrease in incoming Lightning damage.",1,true,100],
["ElementResist_Leaf_1_PAL","Botanical Barrier","10% decrease in incoming Grass damage.",1,true,100],
["ElementResist_Ice_1_PAL","Heated Body","10% decrease in incoming Ice damage.",1,true,100],
["ElementResist_Earth_1_PAL","Earthquake Resistant","10% decrease in incoming Earth damage.",1,true,100],
["ElementResist_Dark_1_PAL","Cheery","10% decrease in incoming Dark damage.",1,true,100],
["ElementResist_Dragon_1_PAL","Dragonkiller","10% decrease in incoming Dragon damage.",1,true,100],
["ElementBoost_Normal_1_PAL","Spirit of Zen","10% increase in Neutral attack damage.",1,true,100],
["ElementBoost_Fire_1_PAL","Pyromaniac","10% increase in Fire attack damage.",1,true,100],
["ElementBoost_Aqua_1_PAL","Hydromaniac","10% increase in Water attack damage.",1,true,100],
["ElementBoost_Thunder_1_PAL","Capacitor","10% increase in Lightning attack damage.",1,true,100],
["ElementBoost_Leaf_1_PAL","Fragrant Foliage","10% increase in Grass attack damage.",1,true,100],
["ElementBoost_Ice_1_PAL","Coldblooded","10% increase in Ice attack damage.",1,true,100],
["ElementBoost_Earth_1_PAL","Power of Gaia","10% increase in Earth attack damage.",1,true,100],
["ElementBoost_Dark_1_PAL","Veil of Darkness","10% increase in Dark attack damage.",1,true,100],
["ElementBoost_Dragon_1_PAL","Blood of the Dragon","10% increase in Dragon attack damage.",1,true,100],
["PAL_FullStomach_Up_1","Glutton","Hunger decreases +10.0% faster.",-1,true,100],
["PAL_FullStomach_Up_2","Bottomless Stomach","Hunger decreases +15.0% faster.",-2,true,100],
["PAL_FullStomach_Down_1","Dainty Eater","Hunger decreases +10.0% slower.",1,true,100],
["PAL_FullStomach_Down_2","Diet Lover","Hunger decreases +15.0% slower.",3,true,100],
["PAL_FullStomach_Down_3","Mastery of Fasting","Hunger decreases +20.0% slower.",4,true,5],
["PAL_Sanity_Up_1","Unstable","SAN drops +10.0% faster.",-1,true,100],
["PAL_Sanity_Up_2","Destructive","SAN drops +15.0% faster.",-2,true,100],
["PAL_Sanity_Down_1","Positive Thinker","SAN drops +10.0% slower.",1,true,100],
["PAL_Sanity_Down_2","Workaholic","SAN drops +15.0% slower.",3,true,100],
["PAL_Sanity_Down_3","Heart of the Immovable King","SAN drops +20.0% slower.",4,true,5],
["ElementBoost_Normal_2_PAL","Celestial Emperor","30% increase in Neutral attack damage.",3,false,100],
["ElementBoost_Fire_2_PAL","Flame Emperor","30% increase in Fire attack damage.",3,false,100],
["ElementBoost_Aqua_2_PAL","Lord of the Sea","30% increase in Water attack damage.",3,false,100],
["ElementBoost_Thunder_2_PAL","Lord of Lightning","30% increase in Lightning attack damage.",3,false,100],
["ElementBoost_Leaf_2_PAL","Spirit Emperor","30% increase in Grass attack damage.",3,false,100],
["ElementBoost_Ice_2_PAL","Ice Emperor","30% increase in Ice attack damage.",3,false,100],
["ElementBoost_Earth_2_PAL","Earth Emperor","30% increase in Earth attack damage.",3,false,100],
["ElementBoost_Dark_2_PAL","Lord of the Underworld","30% increase in Dark attack damage.",3,false,100],
["ElementBoost_Dragon_2_PAL","Divine Dragon","30% increase in Dragon attack damage.",3,false,100],
["MoveSpeed_up_1","Nimble","10% increase to movement speed.",1,true,100],
["MoveSpeed_up_2","Runner","20% increase to movement speed.",3,true,100],
["MoveSpeed_up_3","Swift","30% increase to movement speed.",4,true,5],
["NonKilling","Mercy Hit","Pacifist.\nWill not reduce the target's Health below 1.",-1,true,100],
["Nocturnal","Insomnia","Does not sleep and continues to work even at night.",1,true,100],
["Test_PalEgg_HatchingSpeed_Up","Philanthropist","When assigned to a Breeding Farm, breeding speed is increased by 100%.",3,true,100],
["CoolTimeReduction_Up_1","Serenity","Active skill cooldown reduction 30%\nAttack +10%",3,true,100],
["CoolTimeReduction_Up_2","Impatient","Active skill cooldown reduction 15%",1,true,100],
["CoolTimeReduction_Down_1","Easygoing","Active skill cooldown extension -15%",-1,true,100],
["Stamina_Up_1","Infinite Stamina","Max stamina +50%\n*This effect is only valid for rideable pals.",3,true,100],
["Stamina_Up_2","Fit as a Fiddle","Max stamina +25%\n*This effect is only valid for rideable pals.",1,true,100],
["Stamina_Up_3","Eternal Engine","Max stamina +75%\n*This effect is only valid for rideable pals.",4,true,5],
["Stamina_Down_1","Sickly","Max Stamina -25%\n*This effect is only valid for rideable pals.",-1,true,100],
["SalePrice_Up_1","Noble","Increases the value of items when sold by +5%",3,true,100],
["SalePrice_Up_2","Fine Furs","Increases the value of items when sold by +3%",1,true,100],
["SalePrice_Down_1","Shabby","Decrease the value of items when sold by -10%",-1,true,100],
["Alien","Otherworldly Cells","Attack +10%\nFire damage reduction 15%\nLightning damage reduction 15%",1,false,100],
["Vampire","Vampiric","Absorbs a portion of the damage dealt to restore Health. \nDoes not sleep at night and continues to work.",4,true,5],
["Nushi","Lunker","20% increase to Water attack damage \n20% increase to Ice attack damage \n20% increase to defense.",4,false,100],
["SwimSpeed_up_1","Sleek Stroke","30% increase movement speed on water.",1,true,100],
["SwimSpeed_up_2","Ace Swimmer","40% increase movement speed on water.",3,true,100],
["SwimSpeed_up_3","King of the Waves","50% increase movement speed on water.",4,true,5],
["Salvation","Savior","30% increase in Neutral attack damage.\n30% increase in Grass attack damage.",4,false,100],
["WorldTree_ATK","Twin-Edged Holy Blade","Attack +50%\nDefense -30%\nWorld Tree resources will not vanish when approached.",5,false,5],
["WorldTree_DEF","Sanctified Meat Shield","Defense +50%\nAttack -30%\nWorld Tree resources will not vanish when approached.",5,false,5],
["WorldTree_CraftSpeed","Demon’s Hand","Work Speed +90%\nSAN dreceases +15.0% faster\nWorld Tree harvestables won't vanish when approached.",5,false,5],
["WorldTree_FullStomach","World Tree Seedbed","Decrease Hunger depletion rate by +50.0%\nHP -20%\nWorld Tree resources will not vanish when approached.",5,false,5],
["WorldTree_Sanity","Hermit Sage","SAN depletion rate -50.0%\nWork Speed -20%\nWorld Tree resources will not vanish when approached.",5,false,5],
["WorldTree_MoveSpeed","Dimensional Leap","Movement Speed +50%\nIncreases Hunger depletion rate by +15.0%\nWorld Tree resources will not vanish when approached.",5,false,5],
["WorldTree_ATK_DEF","God of Destruction","Attack +40%\nDefense +20%\nMax Health -50%\nWorld Tree resources will not vanish when approached.",5,false,5],
["MiniNushi","Whopper","5% increase to Water attack damage \n5% increase to Ice attack damage \n5% increase to defense.",3,false,100],
["Deffence_up2_2","Heavyweight","Defense +20%\nImmune to Knockback",2,true,100],
["MutationPal_Babysitter","Babysitter","While at a base, increases egg production speed by +30% and incubation speed by +30% for Pals assigned to a Breeding Farm.",4,false,100],
["MutationPal_Mutant","Idiosyncratic","Pal and Player Auto Health Regeneration Rate +50%\nDefense +25%\nImmune to Poison Damage\nImmune to Burn Damage",4,false,100],
["NightOwl","Night Owl","Tends to nap through the day, due to being nocturnal.",-1,true,100],
["SelfDeathAddItemDrop_up_2","Service-Minded","Your Dropped Items + 50%",3,true,100],
["SelfDeathAddItemDrop_up_3","Lavish Hospitality","Your Dropped Items + 100%",4,true,5],
["WorkSuitabilityAddRank_MonsterFarm_1","Farmhand","Farming's Work Suitability +1",3,true,100],
["WorkSuitabilityAddRank_MonsterFarm_2","Ranch Master","Farming's Work Suitability +2",4,true,5],
["MutationPal_Immortal","Immortality","Life Steal +5%\nPal Auto Health Regeneration Rate +100%\nAttack +15%",4,false,100],
["MutationPal_ExplosionResist","Heavily Armored","Immune to Explosion Damage",4,false,100],
["RideJumpCount_Increase1","Lightfooted","Mounted Jump Count +1",4,true,5],
["RideJumpCount_Increase2","Skymarcher","Mounted Jump Count +2",4,false,100],
["PlayerSP_DecreaseRate_Passive","Wellness Watcher","Player Stamina Consumption -5.0%",3,true,100],
["AutoHPRegeneRate_Passive","Healing Coach","Player Auto Health Regeneration Rate +5%",3,true,100],
["ReloadSpeedUp_Passive","Reload Master","Player Reload Speed +4%",3,true,100]
];

const PALWORLD_V1_GENDER_PROBABILITY: PalworldGameData["genderProbability"] = {
  "SheepBall": {
    "Male": 0.5,
    "Female": 0.5
  },
  "PinkCat": {
    "Male": 0.5,
    "Female": 0.5
  },
  "ChickenPal": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Carbunclo": {
    "Male": 0.5,
    "Female": 0.5
  },
  "BluePlatypus": {
    "Male": 0.5,
    "Female": 0.5
  },
  "BluePlatypus_Fire": {
    "Male": 0.5,
    "Female": 0.5
  },
  "CuteFox": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FlyingManta": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FlyingManta_Thunder": {
    "Male": 0.5,
    "Female": 0.5
  },
  "WoolFox": {
    "Male": 0.5,
    "Female": 0.5
  },
  "KendoFrog": {
    "Male": 0.5,
    "Female": 0.5
  },
  "KendoFrog_Dark": {
    "Male": 0.5,
    "Female": 0.5
  },
  "LeafMomonga": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Ganesha": {
    "Male": 0.5,
    "Female": 0.5
  },
  "PlantSlime": {
    "Male": 0.5,
    "Female": 0.5
  },
  "SamuraiDog": {
    "Male": 0.5,
    "Female": 0.5
  },
  "CloverFairy": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Hedgehog": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Hedgehog_Ice": {
    "Male": 0.5,
    "Female": 0.5
  },
  "NegativeKoala": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Penguin": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Penguin_Electric": {
    "Male": 0.5,
    "Female": 0.5
  },
  "CaptainPenguin": {
    "Male": 0.5,
    "Female": 0.5
  },
  "CaptainPenguin_Black": {
    "Male": 0.5,
    "Female": 0.5
  },
  "WizardOwl": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Alpaca": {
    "Male": 0.5,
    "Female": 0.5
  },
  "KingAlpaca": {
    "Male": 0.9,
    "Female": 0.100000024
  },
  "KingAlpaca_Ice": {
    "Male": 0.9,
    "Female": 0.100000024
  },
  "DreamDemon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Monkey": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Monkey_Fire": {
    "Male": 0.5,
    "Female": 0.5
  },
  "NightFox": {
    "Male": 0.5,
    "Female": 0.5
  },
  "LavaGirl": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FlameBambi": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Bastet": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Bastet_Ice": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Boar": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Kitsunebi": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Kitsunebi_Ice": {
    "Male": 0.5,
    "Female": 0.5
  },
  "NegativeOctopus": {
    "Male": 0.5,
    "Female": 0.5
  },
  "NegativeOctopus_Neutral": {
    "Male": 0.5,
    "Female": 0.5
  },
  "CuteMole": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Deer": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Deer_Ground": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Garm": {
    "Male": 0.5,
    "Female": 0.5
  },
  "BerryGoat": {
    "Male": 0.5,
    "Female": 0.5
  },
  "BerryGoat_Dark": {
    "Male": 0.5,
    "Female": 0.5
  },
  "MopBaby": {
    "Male": 0.5,
    "Female": 0.5
  },
  "MopKing": {
    "Male": 0.5,
    "Female": 0.5
  },
  "TentacleTurtle": {
    "Male": 0.5,
    "Female": 0.5
  },
  "TentacleTurtle_Ground": {
    "Male": 0.5,
    "Female": 0.5
  },
  "WindChimes": {
    "Male": 0.5,
    "Female": 0.5
  },
  "WindChimes_Ice": {
    "Male": 0.5,
    "Female": 0.5
  },
  "SweetsSheep": {
    "Male": 0.5,
    "Female": 0.5
  },
  "SweetsSheep_Ground": {
    "Male": 0.5,
    "Female": 0.5
  },
  "CowPal": {
    "Male": 0.2,
    "Female": 0.8
  },
  "BlueDragon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "BlueDragon_Ice": {
    "Male": 0.5,
    "Female": 0.5
  },
  "ElecCat": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Kelpie": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Kelpie_Fire": {
    "Male": 0.5,
    "Female": 0.5
  },
  "PinkRabbit": {
    "Male": 0.5,
    "Female": 0.5
  },
  "PinkRabbit_Grass": {
    "Male": 0.5,
    "Female": 0.5
  },
  "JellyfishFairy": {
    "Male": 0.5,
    "Female": 0.5
  },
  "JellyfishGhost": {
    "Male": 0.5,
    "Female": 0.5
  },
  "ClioneTwins": {
    "Male": 0.4,
    "Female": 0.6
  },
  "OctopusGirl": {
    "Male": 0.5,
    "Female": 0.5
  },
  "OctopusGirl_Neutral": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Eagle": {
    "Male": 0.5,
    "Female": 0.5
  },
  "GhostBlackCat": {
    "Male": 0.5,
    "Female": 0.5
  },
  "HawkBird": {
    "Male": 0.5,
    "Female": 0.5
  },
  "CatBat": {
    "Male": 0.5,
    "Female": 0.5
  },
  "ColorfulBird": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Kirin": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Kirin_Ice": {
    "Male": 0.5,
    "Female": 0.5
  },
  "SharkKid": {
    "Male": 0.5,
    "Female": 0.5
  },
  "SharkKid_Fire": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Werewolf": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Werewolf_Ice": {
    "Male": 0.5,
    "Female": 0.5
  },
  "DarkCrow": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FlameBuffalo": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FluffyBird": {
    "Male": 0.5,
    "Female": 0.5
  },
  "LittleBriarRose": {
    "Male": 0.5,
    "Female": 0.5
  },
  "CuteButterfly": {
    "Male": 0.5,
    "Female": 0.5
  },
  "ElecPomeranian": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FairyDragon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FairyDragon_Water": {
    "Male": 0.5,
    "Female": 0.5
  },
  "BirdDragon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "BirdDragon_Ice": {
    "Male": 0.5,
    "Female": 0.5
  },
  "CatVampire": {
    "Male": 0.5,
    "Female": 0.5
  },
  "VioletFairy": {
    "Male": 0.5,
    "Female": 0.5
  },
  "SoldierBee": {
    "Male": 0.1,
    "Female": 0.9
  },
  "QueenBee": {
    "Male": 0.1,
    "Female": 0.9
  },
  "PinkLizard": {
    "Male": 0.3,
    "Female": 0.7
  },
  "NaughtyCat": {
    "Male": 0.5,
    "Female": 0.5
  },
  "PurpleSpider": {
    "Male": 0.5,
    "Female": 0.5
  },
  "IceSeal": {
    "Male": 0.5,
    "Female": 0.5
  },
  "IceSeal_Ground": {
    "Male": 0.5,
    "Female": 0.5
  },
  "LizardMan": {
    "Male": 0.5,
    "Female": 0.5
  },
  "LizardMan_Fire": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Gorilla": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Gorilla_Ground": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Serpent": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Serpent_Ground": {
    "Male": 0.5,
    "Female": 0.5
  },
  "RobinHood": {
    "Male": 0.5,
    "Female": 0.5
  },
  "RobinHood_Ground": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FlowerRabbit": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FoxMage": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FoxMage_Dark": {
    "Male": 0.5,
    "Female": 0.5
  },
  "CatMage": {
    "Male": 0.5,
    "Female": 0.5
  },
  "CatMage_Fire": {
    "Male": 0.5,
    "Female": 0.5
  },
  "HadesBird": {
    "Male": 0.5,
    "Female": 0.5
  },
  "HadesBird_Electric": {
    "Male": 0.5,
    "Female": 0.5
  },
  "GrassMinotaur": {
    "Male": 0.6,
    "Female": 0.39999998
  },
  "GrassMinotaur_Ice": {
    "Male": 0.6,
    "Female": 0.39999998
  },
  "Mutant": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FengyunDeeper": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FengyunDeeper_Electric": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FlowerDinosaur": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FlowerDinosaur_Electric": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Ronin": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Ronin_Dark": {
    "Male": 0.5,
    "Female": 0.5
  },
  "IceCrocodile": {
    "Male": 0.5,
    "Female": 0.5
  },
  "GrassMammoth": {
    "Male": 0.5,
    "Female": 0.5
  },
  "GrassMammoth_Ice": {
    "Male": 0.5,
    "Female": 0.5
  },
  "StuffedShark": {
    "Male": 0.5,
    "Female": 0.5
  },
  "StuffedShark_Fire": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FlowerDoll": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FlowerDoll_Fire": {
    "Male": 0.5,
    "Female": 0.5
  },
  "PandaGirl": {
    "Male": 0.4,
    "Female": 0.6
  },
  "Baphomet": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Baphomet_Dark": {
    "Male": 0.5,
    "Female": 0.5
  },
  "RaijinDaughter": {
    "Male": 0.2,
    "Female": 0.8
  },
  "RaijinDaughter_Water": {
    "Male": 0.2,
    "Female": 0.8
  },
  "FireKirin": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FireKirin_Dark": {
    "Male": 0.5,
    "Female": 0.5
  },
  "LazyDragon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "LazyDragon_Electric": {
    "Male": 0.5,
    "Female": 0.5
  },
  "IceFox": {
    "Male": 0.5,
    "Female": 0.5
  },
  "ThunderBird": {
    "Male": 0.5,
    "Female": 0.5
  },
  "ThunderBird_Ice": {
    "Male": 0.5,
    "Female": 0.5
  },
  "GhostAnglerfish": {
    "Male": 0.5,
    "Female": 0.5
  },
  "GhostAnglerfish_Fire": {
    "Male": 0.5,
    "Female": 0.5
  },
  "ThunderDog": {
    "Male": 0.5,
    "Female": 0.5
  },
  "ThunderDog_Ice": {
    "Male": 0.5,
    "Female": 0.5
  },
  "DarkScorpion": {
    "Male": 0.5,
    "Female": 0.5
  },
  "DarkScorpion_Ground": {
    "Male": 0.5,
    "Female": 0.5
  },
  "CactusDoll": {
    "Male": 0.5,
    "Female": 0.5
  },
  "CactusDoll_Dark": {
    "Male": 0.5,
    "Female": 0.5
  },
  "IceDeer": {
    "Male": 0.5,
    "Female": 0.5
  },
  "GrassPanda": {
    "Male": 0.5,
    "Female": 0.5
  },
  "GrassPanda_Electric": {
    "Male": 0.5,
    "Female": 0.5
  },
  "WeaselDragon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "WeaselDragon_Fire": {
    "Male": 0.5,
    "Female": 0.5
  },
  "RedArmorBird": {
    "Male": 0.5,
    "Female": 0.5
  },
  "VolcanoDragon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "VolcanoDragon_Ice": {
    "Male": 0.5,
    "Female": 0.5
  },
  "TropicalOstrich": {
    "Male": 0.5,
    "Female": 0.5
  },
  "DrillGame": {
    "Male": 0.5,
    "Female": 0.5
  },
  "SakuraSaurus": {
    "Male": 0.5,
    "Female": 0.5
  },
  "SakuraSaurus_Water": {
    "Male": 0.5,
    "Female": 0.5
  },
  "LazyCatfish": {
    "Male": 0.5,
    "Female": 0.5
  },
  "LazyCatfish_Gold": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Plesiosaur": {
    "Male": 0.5,
    "Female": 0.5
  },
  "AmaterasuWolf": {
    "Male": 0.5,
    "Female": 0.5
  },
  "AmaterasuWolf_Dark": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Manticore": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Manticore_Dark": {
    "Male": 0.5,
    "Female": 0.5
  },
  "HerculesBeetle": {
    "Male": 0.85,
    "Female": 0.14999998
  },
  "HerculesBeetle_Ground": {
    "Male": 0.85,
    "Female": 0.14999998
  },
  "SnowPeafowl": {
    "Male": 0.5,
    "Female": 0.5
  },
  "DarkFlameFox": {
    "Male": 0.4,
    "Female": 0.6
  },
  "WhiteMoth": {
    "Male": 0.5,
    "Female": 0.5
  },
  "WhiteMoth_Neutral": {
    "Male": 0.5,
    "Female": 0.5
  },
  "GhostBeast": {
    "Male": 0.5,
    "Female": 0.5
  },
  "MushroomDragon": {
    "Male": 0.55,
    "Female": 0.45
  },
  "MushroomDragon_Dark": {
    "Male": 0.5,
    "Female": 0.5
  },
  "IceWitch": {
    "Male": 0.5,
    "Female": 0.5
  },
  "MummyPal": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Umihebi": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Umihebi_Fire": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Suzaku": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Suzaku_Water": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FeatherOstrich": {
    "Male": 0.5,
    "Female": 0.5
  },
  "SkyDragon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "SkyDragon_Grass": {
    "Male": 0.5,
    "Female": 0.5
  },
  "LeafPrincess": {
    "Male": 0.3,
    "Female": 0.7
  },
  "SmallArmadillo": {
    "Male": 0.5,
    "Female": 0.5
  },
  "GuardianDog": {
    "Male": 0.5,
    "Female": 0.5
  },
  "SwordCutlassfish": {
    "Male": 0.5,
    "Female": 0.5
  },
  "SwordCutlassfish_Fire": {
    "Male": 0.5,
    "Female": 0.5
  },
  "VolcanicMonster": {
    "Male": 0.5,
    "Female": 0.5
  },
  "VolcanicMonster_Ice": {
    "Male": 0.5,
    "Female": 0.5
  },
  "NightBlueHorse": {
    "Male": 0.5,
    "Female": 0.5
  },
  "NightBlueHorse_Neutral": {
    "Male": 0.5,
    "Female": 0.5
  },
  "RockBeast": {
    "Male": 0.5,
    "Female": 0.5
  },
  "RockBeast_Ice": {
    "Male": 0.5,
    "Female": 0.5
  },
  "WhiteTiger": {
    "Male": 0.5,
    "Female": 0.5
  },
  "WhiteTiger_Ground": {
    "Male": 0.5,
    "Female": 0.5
  },
  "SmallYeti": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Yeti": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Yeti_Grass": {
    "Male": 0.5,
    "Female": 0.5
  },
  "CandleGhost": {
    "Male": 0.5,
    "Female": 0.5
  },
  "VenusFlytrap": {
    "Male": 0.4,
    "Female": 0.6
  },
  "KingBahamut": {
    "Male": 0.5,
    "Female": 0.5
  },
  "KingBahamut_Dragon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "GrassGolem": {
    "Male": 0.5,
    "Female": 0.5
  },
  "GrassGolem_Dark": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Anubis": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Sekhmet": {
    "Male": 0.3,
    "Female": 0.7
  },
  "ScorpionMan": {
    "Male": 0.5,
    "Female": 0.5
  },
  "ScorpionMan_Electric": {
    "Male": 0.5,
    "Female": 0.5
  },
  "CubeTurtle": {
    "Male": 0.5,
    "Female": 0.5
  },
  "CubeTurtle_Neutral": {
    "Male": 0.5,
    "Female": 0.5
  },
  "BadCatgirl": {
    "Male": 0.4,
    "Female": 0.6
  },
  "MimicDog": {
    "Male": 0.8,
    "Female": 0.19999999
  },
  "DarkAlien": {
    "Male": 0.5,
    "Female": 0.5
  },
  "WhiteAlienDragon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "BlueberryFairy": {
    "Male": 0.4,
    "Female": 0.6
  },
  "GhostRabbit": {
    "Male": 0.4,
    "Female": 0.6
  },
  "GhostRabbit_Grass": {
    "Male": 0.4,
    "Female": 0.6
  },
  "BlackPuppy": {
    "Male": 0.5,
    "Female": 0.5
  },
  "BlackPuppy_Ice": {
    "Male": 0.5,
    "Female": 0.5
  },
  "MysteryMask": {
    "Male": 0.5,
    "Female": 0.5
  },
  "IceNarwhal": {
    "Male": 0.58,
    "Female": 0.42000002
  },
  "IceNarwhal_Fire": {
    "Male": 0.42,
    "Female": 0.58000004
  },
  "GrassRabbitMan": {
    "Male": 0.5,
    "Female": 0.5
  },
  "GrimGirl": {
    "Male": 0.38,
    "Female": 0.62
  },
  "GoldenHorse": {
    "Male": 0.5,
    "Female": 0.5
  },
  "SifuDog": {
    "Male": 0.5,
    "Female": 0.5
  },
  "SumoDog": {
    "Male": 0.5,
    "Female": 0.5
  },
  "WhiteDeer": {
    "Male": 0.5,
    "Female": 0.5
  },
  "WhiteDeer_Dark": {
    "Male": 0.5,
    "Female": 0.5
  },
  "BlackMetalDragon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "WingGolem": {
    "Male": 0.7,
    "Female": 0.3
  },
  "WingGolem_Fire": {
    "Male": 0.7,
    "Female": 0.3
  },
  "WhiteShieldDragon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "BlueThunderHorse": {
    "Male": 0.5,
    "Female": 0.5
  },
  "LongCat": {
    "Male": 0.5,
    "Female": 0.5
  },
  "ElecSnail": {
    "Male": 0.5,
    "Female": 0.5
  },
  "ElecSnail_Ground": {
    "Male": 0.5,
    "Female": 0.5
  },
  "DandelionGirl": {
    "Male": 0.4,
    "Female": 0.6
  },
  "BrownRabbit": {
    "Male": 0.5,
    "Female": 0.5
  },
  "HoodGhost": {
    "Male": 0.5,
    "Female": 0.5
  },
  "ElecLizard": {
    "Male": 0.5,
    "Female": 0.5
  },
  "OniGhostGirl": {
    "Male": 0.4,
    "Female": 0.6
  },
  "KingSunfish": {
    "Male": 0.5,
    "Female": 0.5
  },
  "KingSunfish_Thunder": {
    "Male": 0.5,
    "Female": 0.5
  },
  "SleeveRabbit": {
    "Male": 0.4,
    "Female": 0.6
  },
  "GhostDragon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "GhostDragon_Fire": {
    "Male": 0.5,
    "Female": 0.5
  },
  "ThunderFluffyBird": {
    "Male": 0.5,
    "Female": 0.5
  },
  "RedFlowerBird": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FoxExorcist": {
    "Male": 0.5,
    "Female": 0.5
  },
  "LotusDragon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "ClownRabbit": {
    "Male": 0.5,
    "Female": 0.5
  },
  "ThiefBird": {
    "Male": 0.6,
    "Female": 0.39999998
  },
  "SnakeGirl": {
    "Male": 0.4,
    "Female": 0.6
  },
  "MushroomLady": {
    "Male": 0.3,
    "Female": 0.7
  },
  "LanternButler": {
    "Male": 0.5,
    "Female": 0.5
  },
  "MoonChild": {
    "Male": 0.5,
    "Female": 0.5
  },
  "MonochromeQueen": {
    "Male": 0.3,
    "Female": 0.7
  },
  "KabukiMan": {
    "Male": 0.6,
    "Female": 0.39999998
  },
  "DomeArmorDragon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "ElecPanda": {
    "Male": 0.5,
    "Female": 0.5
  },
  "LilyQueen": {
    "Male": 0.3,
    "Female": 0.7
  },
  "LilyQueen_Dark": {
    "Male": 0.3,
    "Female": 0.7
  },
  "ThunderDragonMan": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Horus": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Horus_Water": {
    "Male": 0.5,
    "Female": 0.5
  },
  "BlackGriffon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "MoonQueen": {
    "Male": 0.2,
    "Female": 0.8
  },
  "SnowTigerBeastman": {
    "Male": 0.6,
    "Female": 0.39999998
  },
  "BlueSkyDragon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "Mothman": {
    "Male": 0.5,
    "Female": 0.5
  },
  "FlowerPrince": {
    "Male": 0.6,
    "Female": 0.39999998
  },
  "NightLady": {
    "Male": 0.1,
    "Female": 0.9
  },
  "NightLady_Dark": {
    "Male": 0.1,
    "Female": 0.9
  },
  "DarkMechaDragon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "LegendDeer": {
    "Male": 0.5,
    "Female": 0.5
  },
  "SaintCentaur": {
    "Male": 0.5,
    "Female": 0.5
  },
  "BlackCentaur": {
    "Male": 0.5,
    "Female": 0.5
  },
  "IceHorse": {
    "Male": 0.5,
    "Female": 0.5
  },
  "IceHorse_Dark": {
    "Male": 0.5,
    "Female": 0.5
  },
  "PoseidonOrca": {
    "Male": 0.5,
    "Female": 0.5
  },
  "JetDragon": {
    "Male": 0.5,
    "Female": 0.5
  },
  "KingWhale": {
    "Male": 0.5,
    "Female": 0.5
  },
  "YakushimaBoss001": {
    "Male": 0.5,
    "Female": 0.5
  },
  "YakushimaBoss001_Small": {
    "Male": 0.5,
    "Female": 0.5
  },
  "YakushimaMonster001": {
    "Male": 0.5,
    "Female": 0.5
  },
  "YakushimaMonster001_Blue": {
    "Male": 0.5,
    "Female": 0.5
  },
  "YakushimaMonster001_Pink": {
    "Male": 0.5,
    "Female": 0.5
  },
  "YakushimaMonster001_Purple": {
    "Male": 0.5,
    "Female": 0.5
  },
  "YakushimaMonster001_Rainbow": {
    "Male": 0.5,
    "Female": 0.5
  },
  "YakushimaMonster001_Red": {
    "Male": 0.5,
    "Female": 0.5
  },
  "YakushimaMonster002": {
    "Male": 0.5,
    "Female": 0.5
  },
  "YakushimaMonster003": {
    "Male": 0.5,
    "Female": 0.5
  },
  "YakushimaMonster003_Purple": {
    "Male": 0.5,
    "Female": 0.5
  }
};

export function createPalworldV1CatalogGameData(): PalworldGameData {
  const palsByInternal: Record<string, PalworldPalDefinition> = {};
  const passiveSkillsByInternal: Record<string, PalworldPassiveSkillDefinition> = {};

  for (const [
    internalName,
    name,
    paldeckNumber,
    paldeckCode,
    paldeckVariant,
    rarity,
    minWildLevel,
    maxWildLevel,

  ] of PALWORLD_V1_PALS) {
    palsByInternal[internalName] = {
      ...(paldeckNumber ? { paldeckNumber } : {}),
      ...(paldeckCode ? { paldeckCode } : {}),
      paldeckVariant,
      ...(rarity != null ? { rarity } : {}),
      ...(minWildLevel != null ? { minWildLevel } : {}),
      ...(maxWildLevel != null ? { maxWildLevel } : {}),
      name,

    };
  }

  for (const [
    internalName,
    name,

    description,

    rank,
    randomInheritanceAllowed,
    randomInheritanceWeight,
  ] of PALWORLD_V1_PASSIVE_SKILLS) {
    passiveSkillsByInternal[internalName] = {
      name,

      ...(description ? { description } : {}),

      rank,
      randomInheritanceAllowed,
      randomInheritanceWeight,
    };
  }

  return {
    version: PALWORLD_V1_METADATA.gameDataVersion,
    palsByInternal,
    breedingByChild: {},
    passiveSkillsByInternal,
    genderProbability: { ...PALWORLD_V1_GENDER_PROBABILITY },
  };
}
