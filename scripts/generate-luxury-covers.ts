import fs from 'fs';
import path from 'path';

interface BookCoverDef {
  filename: string;
  title: string;
  subtitle?: string;
  author: string;
  editionBadge: string;
  theme: 'burgundy' | 'navy' | 'emerald' | 'saffron' | 'obsidian' | 'amethyst' | 'terracotta' | 'sapphire';
  symbolType:
    | 'astronomy'
    | 'lion'
    | 'india'
    | 'physics'
    | 'sanskrit'
    | 'ddia'
    | 'clean_arch'
    | 'clrs'
    | 'wings'
    | 'om'
    | 'parliament'
    | 'panchatantra'
    | 'sre'
    | 'microservices'
    | 'db_internals'
    | 'os'
    | 'gitanjali'
    | 'debate'
    | 'lambda'
    | 'cosmos'
    | 'dragon'
    | 'network'
    | 'ai'
    | 'refactoring';
}

function escapeXml(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const bookCovers: BookCoverDef[] = [
  {
    filename: 'aryabhatiya.svg',
    title: 'ARYABHATIYA',
    subtitle: 'CLASSICAL INDIAN MATHEMATICS',
    author: 'ARYABHATA',
    editionBadge: 'NALANDA ARCHIVAL EDITION',
    theme: 'burgundy',
    symbolType: 'astronomy',
  },
  {
    filename: 'arthashastra.svg',
    title: 'THE ARTHASHASTRA',
    subtitle: 'SCIENCE OF WEALTH & STATECRAFT',
    author: 'KAUTILYA (CHANAKYA)',
    editionBadge: 'IMPERIAL MAURYAN EDITION',
    theme: 'emerald',
    symbolType: 'lion',
  },
  {
    filename: 'discovery-of-india.svg',
    title: 'THE DISCOVERY OF INDIA',
    subtitle: 'HERITAGE OF CIVILIZATION',
    author: 'JAWAHARLAL NEHRU',
    editionBadge: 'OXFORD HERITAGE EDITION',
    theme: 'navy',
    symbolType: 'india',
  },
  {
    filename: 'concepts-of-physics.svg',
    title: 'CONCEPTS OF PHYSICS',
    subtitle: 'FOUNDATIONAL MECHANICS & QUANTUM',
    author: 'DR. H.C. VERMA',
    editionBadge: 'COLLECTOR EDITION // VOL. 1 & 2',
    theme: 'sapphire',
    symbolType: 'physics',
  },
  {
    filename: 'sanskrit-nlp.svg',
    title: 'SANSKRIT COMPUTATIONAL LINGUISTICS',
    subtitle: 'PANINIAN GRAMMAR & NLP',
    author: 'DR. GIRISH NATH JHA',
    editionBadge: 'SPRINGER INDIC STUDIES',
    theme: 'terracotta',
    symbolType: 'sanskrit',
  },
  {
    filename: 'ddia.svg',
    title: 'DESIGNING DATA-INTENSIVE APPLICATIONS',
    subtitle: 'RELIABLE, SCALABLE & MAINTAINABLE SYSTEMS',
    author: 'MARTIN KLEPPMANN',
    editionBadge: "O'REILLY GOLD ARCHIVE",
    theme: 'emerald',
    symbolType: 'ddia',
  },
  {
    filename: 'clean-architecture.svg',
    title: 'CLEAN ARCHITECTURE',
    subtitle: 'A CRAFTSMAN’S GUIDE TO SOFTWARE STRUCTURE',
    author: 'ROBERT C. MARTIN (UNCLE BOB)',
    editionBadge: 'PRENTICE HALL CRAFTSMAN SERIES',
    theme: 'obsidian',
    symbolType: 'clean_arch',
  },
  {
    filename: 'clrs.svg',
    title: 'INTRODUCTION TO ALGORITHMS',
    subtitle: 'THIRD EDITION // 24K GOLD EMBOSSED',
    author: 'CORMEN • LEISERSON • RIVEST • STEIN',
    editionBadge: 'MIT PRESS MASTERWORK',
    theme: 'navy',
    symbolType: 'clrs',
  },
  {
    filename: 'wings-of-fire.svg',
    title: 'WINGS OF FIRE',
    subtitle: 'AN AUTOBIOGRAPHY',
    author: 'DR. A.P.J. ABDUL KALAM',
    editionBadge: 'PRESIDENTIAL GOLD EDITION',
    theme: 'saffron',
    symbolType: 'wings',
  },
  {
    filename: 'upanishads.svg',
    title: 'THE UPANISHADS',
    subtitle: 'CLASSIC OF INDIAN SPIRITUALITY',
    author: 'EKNATH EASWARAN',
    editionBadge: 'SACRED VEDIC HERITAGE',
    theme: 'amethyst',
    symbolType: 'om',
  },
  {
    filename: 'india-after-gandhi.svg',
    title: 'INDIA AFTER GANDHI',
    subtitle: 'HISTORY OF THE WORLD’S LARGEST DEMOCRACY',
    author: 'RAMACHANDRA GUHA',
    editionBadge: 'PICADOR HISTORICAL ARCHIVE',
    theme: 'navy',
    symbolType: 'parliament',
  },
  {
    filename: 'panchatantra.svg',
    title: 'THE PANCHATANTRA',
    subtitle: 'ANCIENT WISDOM & MORAL STATECRAFT',
    author: 'PANDIT VISHNU SHARMA',
    editionBadge: 'CLASSICAL SANSKRIT FABLES',
    theme: 'terracotta',
    symbolType: 'panchatantra',
  },
  {
    filename: 'sre.svg',
    title: 'SITE RELIABILITY ENGINEERING',
    subtitle: 'HOW GOOGLE RUNS PRODUCTION SYSTEMS',
    author: 'BEYER • JONES • PETOFF • MURPHY',
    editionBadge: 'GOOGLE SYSTEMS MASTERWORK',
    theme: 'obsidian',
    symbolType: 'sre',
  },
  {
    filename: 'building-microservices.svg',
    title: 'BUILDING MICROSERVICES',
    subtitle: 'DESIGNING FINE-GRAINED SYSTEMS',
    author: 'SAM NEWMAN',
    editionBadge: 'DISTRIBUTED ARCHITECTURE EDITION',
    theme: 'emerald',
    symbolType: 'microservices',
  },
  {
    filename: 'database-internals.svg',
    title: 'DATABASE INTERNALS',
    subtitle: 'STORAGE ENGINES, B-TREES & DISTRIBUTED SYSTEMS',
    author: 'ALEX PETROV',
    editionBadge: 'DATA SYSTEMS DEEP DIVE',
    theme: 'sapphire',
    symbolType: 'db_internals',
  },
  {
    filename: 'operating-systems.svg',
    title: 'OPERATING SYSTEM CONCEPTS',
    subtitle: 'CONCURRENCY, MEMORY & FILE ARCHITECTURE',
    author: 'SILBERSCHATZ • GALVIN • GAGNE',
    editionBadge: 'WILEY CLASSICS COLLECTION',
    theme: 'navy',
    symbolType: 'os',
  },
  {
    filename: 'gitanjali.svg',
    title: 'GITANJALI',
    subtitle: 'SONG OFFERINGS // NOBEL PRIZE 1913',
    author: 'RABINDRANATH TAGORE',
    editionBadge: 'BENGAL LITERATURE HERITAGE',
    theme: 'burgundy',
    symbolType: 'gitanjali',
  },
  {
    filename: 'argumentative-indian.svg',
    title: 'THE ARGUMENTATIVE INDIAN',
    subtitle: 'WRITINGS ON INDIAN HISTORY, CULTURE & IDENTITY',
    author: 'AMARTYA SEN',
    editionBadge: 'NOBEL LAUREATE ESSAYS',
    theme: 'amethyst',
    symbolType: 'debate',
  },
  {
    filename: 'sicp.svg',
    title: 'STRUCTURE & INTERPRETATION',
    subtitle: 'OF COMPUTER PROGRAMS (SICP)',
    author: 'HAROLD ABELSON & GERALD JAY SUSSMAN',
    editionBadge: 'MIT PRESS WIZARD EDITION',
    theme: 'obsidian',
    symbolType: 'lambda',
  },
  {
    filename: 'brief-history-of-time.svg',
    title: 'A BRIEF HISTORY OF TIME',
    subtitle: 'FROM THE BIG BANG TO BLACK HOLES',
    author: 'STEPHEN HAWKING',
    editionBadge: 'CAMBRIDGE COSMOLOGY EDITION',
    theme: 'sapphire',
    symbolType: 'cosmos',
  },
  {
    filename: 'dragon-book.svg',
    title: 'COMPILERS: PRINCIPLES & TOOLS',
    subtitle: 'LEXICAL ANALYSIS, PARSING & CODE GEN (DRAGON BOOK)',
    author: 'AHO • LAM • SETHI • ULLMAN',
    editionBadge: 'PEARSON COMPUTING CLASSIC',
    theme: 'burgundy',
    symbolType: 'dragon',
  },
  {
    filename: 'computer-networks.svg',
    title: 'COMPUTER NETWORKS',
    subtitle: 'A SYSTEMS APPROACH',
    author: 'LARRY L. PETERSON & BRUCE S. DAVIE',
    editionBadge: 'MORGAN KAUFMANN NETWORKS',
    theme: 'navy',
    symbolType: 'network',
  },
  {
    filename: 'artificial-intelligence.svg',
    title: 'ARTIFICIAL INTELLIGENCE',
    subtitle: 'A MODERN APPROACH // 4TH EDITION',
    author: 'STUART RUSSELL & PETER NORVIG',
    editionBadge: 'PRENTICE HALL AI SERIES',
    theme: 'obsidian',
    symbolType: 'ai',
  },
  {
    filename: 'refactoring.svg',
    title: 'REFACTORING',
    subtitle: 'IMPROVING THE DESIGN OF EXISTING CODE',
    author: 'MARTIN FOWLER',
    editionBadge: 'SIGNATURE SERIES IN SOFTWARE',
    theme: 'sapphire',
    symbolType: 'refactoring',
  },
];

function getThemePalette(theme: BookCoverDef['theme']) {
  switch (theme) {
    case 'burgundy':
      return {
        bg1: '#260404',
        bg2: '#4a0c0c',
        bg3: '#150202',
        accentGold: '#ffd700',
        goldLight: '#fff8d1',
        goldDark: '#b38600',
        leatherPattern: '#380909',
      };
    case 'emerald':
      return {
        bg1: '#021a13',
        bg2: '#08382b',
        bg3: '#010d0a',
        accentGold: '#ffd700',
        goldLight: '#fff8d1',
        goldDark: '#b38600',
        leatherPattern: '#05241b',
      };
    case 'navy':
      return {
        bg1: '#061021',
        bg2: '#122445',
        bg3: '#030812',
        accentGold: '#ffd700',
        goldLight: '#fff8d1',
        goldDark: '#b38600',
        leatherPattern: '#0c1a33',
      };
    case 'sapphire':
      return {
        bg1: '#071633',
        bg2: '#102e5c',
        bg3: '#030b1a',
        accentGold: '#ffd700',
        goldLight: '#fff8d1',
        goldDark: '#b38600',
        leatherPattern: '#0b2042',
      };
    case 'saffron':
      return {
        bg1: '#361202',
        bg2: '#632508',
        bg3: '#1d0901',
        accentGold: '#ffd700',
        goldLight: '#fff8d1',
        goldDark: '#b38600',
        leatherPattern: '#471a05',
      };
    case 'terracotta':
      return {
        bg1: '#2e120b',
        bg2: '#57251a',
        bg3: '#190a06',
        accentGold: '#ffd700',
        goldLight: '#fff8d1',
        goldDark: '#b38600',
        leatherPattern: '#3d1a12',
      };
    case 'amethyst':
      return {
        bg1: '#1a072b',
        bg2: '#381259',
        bg3: '#0e0317',
        accentGold: '#ffd700',
        goldLight: '#fff8d1',
        goldDark: '#b38600',
        leatherPattern: '#240a38',
      };
    case 'obsidian':
    default:
      return {
        bg1: '#101012',
        bg2: '#202026',
        bg3: '#08080a',
        accentGold: '#ffd700',
        goldLight: '#fff8d1',
        goldDark: '#b38600',
        leatherPattern: '#16161a',
      };
  }
}

function getSymbolSvg(symbol: BookCoverDef['symbolType'], gold: string, goldLight: string): string {
  switch (symbol) {
    case 'astronomy':
      return `
        <circle cx="240" cy="335" r="75" fill="none" stroke="${gold}" stroke-width="1.8" stroke-dasharray="4,3"/>
        <circle cx="240" cy="335" r="55" fill="none" stroke="${gold}" stroke-width="2.2"/>
        <circle cx="240" cy="335" r="30" fill="none" stroke="${gold}" stroke-width="1.2"/>
        <circle cx="240" cy="335" r="14" fill="${goldLight}" fill-opacity="0.95"/>
        <path d="M 240,290 L 240,280 M 240,380 L 240,390 M 185,335 L 175,335 M 295,335 L 305,335 M 201,296 L 194,289 M 279,374 L 286,381 M 201,374 L 194,381 M 279,296 L 286,289" stroke="${gold}" stroke-width="2.2"/>
        <ellipse cx="240" cy="335" rx="95" ry="38" fill="none" stroke="${gold}" stroke-width="1.8" transform="rotate(-25 240 335)"/>
        <circle cx="315" cy="300" r="7" fill="${gold}"/>
        <circle cx="165" cy="370" r="6" fill="${gold}"/>
      `;
    case 'lion':
      return `
        <rect x="225" y="380" width="30" height="25" fill="none" stroke="${gold}" stroke-width="2"/>
        <path d="M 210,380 L 270,380 L 260,370 L 220,370 Z" fill="${gold}" fill-opacity="0.4" stroke="${gold}" stroke-width="1.5"/>
        <circle cx="240" cy="340" r="38" fill="none" stroke="${gold}" stroke-width="2"/>
        <circle cx="240" cy="340" r="8" fill="${goldLight}"/>
        <path d="M 240,305 L 240,375 M 205,340 L 275,340 M 215,315 L 265,365 M 215,365 L 265,315" stroke="${gold}" stroke-width="1.5"/>
        <path d="M 222,308 L 240,285 L 258,308 Z" fill="${gold}" stroke="${goldLight}" stroke-width="1"/>
        <path d="M 180,340 C 180,310 200,280 240,270 C 280,280 300,310 300,340" fill="none" stroke="${gold}" stroke-width="1.5" stroke-dasharray="2,3"/>
      `;
    case 'india':
      return `
        <circle cx="240" cy="330" r="65" fill="none" stroke="${gold}" stroke-width="1.8"/>
        <circle cx="240" cy="330" r="52" fill="none" stroke="${gold}" stroke-width="1.2" stroke-dasharray="3,3"/>
        <path d="M 240,280 L 246,298 L 265,298 L 250,309 L 256,327 L 240,316 L 224,327 L 230,309 L 215,298 L 234,298 Z" fill="${goldLight}" stroke="${gold}" stroke-width="1"/>
        <circle cx="240" cy="355" r="22" fill="none" stroke="${gold}" stroke-width="2"/>
        <circle cx="240" cy="355" r="5" fill="${gold}"/>
        <path d="M 240,335 L 240,375 M 220,355 L 260,355 M 226,341 L 254,369 M 226,369 L 254,341" stroke="${gold}" stroke-width="1.5"/>
      `;
    case 'physics':
      return `
        <circle cx="240" cy="330" r="14" fill="${goldLight}" stroke="${gold}" stroke-width="2"/>
        <ellipse cx="240" cy="330" rx="75" ry="26" fill="none" stroke="${gold}" stroke-width="2" transform="rotate(30 240 330)"/>
        <ellipse cx="240" cy="330" rx="75" ry="26" fill="none" stroke="${gold}" stroke-width="2" transform="rotate(-30 240 330)"/>
        <ellipse cx="240" cy="330" rx="75" ry="26" fill="none" stroke="${gold}" stroke-width="2" transform="rotate(90 240 330)"/>
        <circle cx="185" cy="300" r="5" fill="${goldLight}"/>
        <circle cx="295" cy="360" r="5" fill="${goldLight}"/>
        <circle cx="240" cy="255" r="5" fill="${goldLight}"/>
        <path d="M 160,395 Q 200,380 240,395 T 320,395" fill="none" stroke="${gold}" stroke-width="1.5"/>
      `;
    case 'sanskrit':
      return `
        <circle cx="240" cy="335" r="62" fill="none" stroke="${gold}" stroke-width="1.8"/>
        <path d="M 240,290 C 220,315 220,345 240,360 C 260,345 260,315 240,290 Z" fill="${goldLight}" fill-opacity="0.3" stroke="${gold}" stroke-width="1.5"/>
        <path d="M 240,360 C 205,355 190,330 205,310 C 220,325 230,345 240,360 Z" fill="${gold}" fill-opacity="0.4" stroke="${gold}" stroke-width="1.5"/>
        <path d="M 240,360 C 275,355 290,330 275,310 C 260,325 250,345 240,360 Z" fill="${gold}" fill-opacity="0.4" stroke="${gold}" stroke-width="1.5"/>
        <circle cx="240" cy="285" r="5" fill="${goldLight}"/>
        <circle cx="190" cy="385" r="5" fill="${gold}"/>
        <circle cx="290" cy="385" r="5" fill="${gold}"/>
        <path d="M 240,360 L 190,385 M 240,360 L 290,385" stroke="${gold}" stroke-width="1.5"/>
      `;
    case 'ddia':
      return `
        <polygon points="240,280 295,312 295,376 240,408 185,376 185,312" fill="none" stroke="${gold}" stroke-width="2.2"/>
        <circle cx="240" cy="344" r="22" fill="${goldLight}" fill-opacity="0.25" stroke="${gold}" stroke-width="2"/>
        <circle cx="240" cy="280" r="7" fill="${gold}"/>
        <circle cx="295" cy="312" r="7" fill="${gold}"/>
        <circle cx="295" cy="376" r="7" fill="${gold}"/>
        <circle cx="240" cy="408" r="7" fill="${gold}"/>
        <circle cx="185" cy="376" r="7" fill="${gold}"/>
        <circle cx="185" cy="312" r="7" fill="${gold}"/>
        <line x1="240" y1="280" x2="240" y2="344" stroke="${gold}" stroke-width="1.8"/>
        <line x1="295" y1="376" x2="240" y2="344" stroke="${gold}" stroke-width="1.8"/>
        <line x1="185" y1="376" x2="240" y2="344" stroke="${gold}" stroke-width="1.8"/>
      `;
    case 'clean_arch':
      return `
        <polygon points="240,265 305,302 305,377 240,414 175,377 175,302" fill="none" stroke="${gold}" stroke-width="1.8"/>
        <polygon points="240,285 285,311 285,363 240,389 195,363 195,311" fill="none" stroke="${gold}" stroke-width="2.2"/>
        <circle cx="240" cy="337" r="28" fill="${goldLight}" fill-opacity="0.25" stroke="${gold}" stroke-width="2"/>
        <circle cx="240" cy="337" r="9" fill="${gold}"/>
        <path d="M 240,290 L 240,384 M 193,337 L 287,337" stroke="${gold}" stroke-width="1.2" stroke-dasharray="2,2"/>
      `;
    case 'clrs':
      return `
        <circle cx="240" cy="285" r="14" fill="${goldLight}" stroke="${gold}" stroke-width="2"/>
        <circle cx="200" cy="335" r="12" fill="${gold}" stroke="${goldLight}" stroke-width="1.5"/>
        <circle cx="280" cy="335" r="12" fill="${gold}" stroke="${goldLight}" stroke-width="1.5"/>
        <circle cx="175" cy="385" r="9" fill="${gold}"/>
        <circle cx="225" cy="385" r="9" fill="${gold}"/>
        <circle cx="260" cy="385" r="9" fill="${gold}"/>
        <circle cx="305" cy="385" r="9" fill="${gold}"/>
        <line x1="240" y1="299" x2="200" y2="323" stroke="${gold}" stroke-width="2"/>
        <line x1="240" y1="299" x2="280" y2="323" stroke="${gold}" stroke-width="2"/>
        <line x1="200" y1="347" x2="175" y2="376" stroke="${gold}" stroke-width="1.5"/>
        <line x1="200" y1="347" x2="225" y2="376" stroke="${gold}" stroke-width="1.5"/>
        <line x1="280" y1="347" x2="260" y2="376" stroke="${gold}" stroke-width="1.5"/>
        <line x1="280" y1="347" x2="305" y2="376" stroke="${gold}" stroke-width="1.5"/>
      `;
    case 'wings':
      return `
        <path d="M 240,270 C 248,310 265,340 240,390 C 215,340 232,310 240,270 Z" fill="${goldLight}" stroke="${gold}" stroke-width="2"/>
        <path d="M 240,300 C 244,325 252,345 240,375 C 228,345 236,325 240,300 Z" fill="${gold}" stroke="${goldLight}" stroke-width="1"/>
        <ellipse cx="240" cy="335" rx="85" ry="32" fill="none" stroke="${gold}" stroke-width="1.8" transform="rotate(-30 240 335)"/>
        <circle cx="310" cy="295" r="6" fill="${goldLight}"/>
        <polygon points="310,295 320,290 320,300" fill="${gold}"/>
      `;
    case 'om':
      return `
        <circle cx="240" cy="335" r="65" fill="none" stroke="${gold}" stroke-width="2.2"/>
        <circle cx="240" cy="335" r="48" fill="none" stroke="${gold}" stroke-width="1.2" stroke-dasharray="3,3"/>
        <circle cx="240" cy="335" r="28" fill="${goldLight}" fill-opacity="0.3" stroke="${gold}" stroke-width="2"/>
        <text x="240" y="348" font-family="'Cinzel', serif" font-size="36" font-weight="700" fill="${goldLight}" text-anchor="middle">ॐ</text>
        <path d="M 240,260 L 240,266 M 240,404 L 240,410 M 165,335 L 171,335 M 309,335 L 315,335" stroke="${gold}" stroke-width="2"/>
      `;
    case 'parliament':
      return `
        <circle cx="240" cy="320" r="36" fill="none" stroke="${gold}" stroke-width="2.2"/>
        <path d="M 240,286 L 240,354 M 206,320 L 274,320 M 216,296 L 264,344 M 216,344 L 264,296" stroke="${gold}" stroke-width="1.6"/>
        <circle cx="240" cy="320" r="9" fill="${goldLight}"/>
        <path d="M 180,380 L 300,380 L 290,395 L 190,395 Z" fill="${gold}" fill-opacity="0.35" stroke="${gold}" stroke-width="1.5"/>
        <rect x="200" y="365" width="80" height="15" fill="none" stroke="${gold}" stroke-width="1.6"/>
      `;
    case 'panchatantra':
      return `
        <circle cx="240" cy="335" r="65" fill="none" stroke="${gold}" stroke-width="2.2"/>
        <path d="M 215,355 C 215,330 230,310 255,310 C 275,310 285,325 285,340 C 285,360 270,365 255,365" fill="none" stroke="${gold}" stroke-width="2.5"/>
        <circle cx="265" cy="325" r="4" fill="${goldLight}"/>
        <path d="M 285,340 C 295,345 300,360 295,370" fill="none" stroke="${gold}" stroke-width="2.2"/>
        <path d="M 200,375 C 220,365 260,365 280,375" fill="none" stroke="${gold}" stroke-width="2"/>
      `;
    case 'sre':
      return `
        <path d="M 175,360 A 65 65 0 1 1 305 360" fill="none" stroke="${gold}" stroke-width="3"/>
        <path d="M 190,345 A 50 50 0 1 1 290 345" fill="none" stroke="${gold}" stroke-width="1.2" stroke-dasharray="3,4"/>
        <circle cx="240" cy="345" r="9" fill="${goldLight}"/>
        <line x1="240" y1="345" x2="275" y2="305" stroke="${gold}" stroke-width="2.8"/>
        <text x="240" y="380" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="${gold}" text-anchor="middle">99.999% SLO</text>
      `;
    case 'microservices':
      return `
        <polygon points="240,280 268,296 268,328 240,344 212,328 212,296" fill="${goldLight}" fill-opacity="0.25" stroke="${gold}" stroke-width="2.2"/>
        <polygon points="180,340 208,356 208,388 180,404 152,388 152,356" fill="none" stroke="${gold}" stroke-width="1.8"/>
        <polygon points="300,340 328,356 328,388 300,404 272,388 272,356" fill="none" stroke="${gold}" stroke-width="1.8"/>
        <line x1="226" y1="336" x2="194" y2="348" stroke="${gold}" stroke-width="2.2"/>
        <line x1="254" y1="336" x2="286" y2="348" stroke="${gold}" stroke-width="2.2"/>
      `;
    case 'db_internals':
      return `
        <rect x="180" y="280" width="120" height="28" rx="4" fill="${goldLight}" fill-opacity="0.25" stroke="${gold}" stroke-width="2.2"/>
        <rect x="160" y="325" width="70" height="25" rx="4" fill="none" stroke="${gold}" stroke-width="1.8"/>
        <rect x="250" y="325" width="70" height="25" rx="4" fill="none" stroke="${gold}" stroke-width="1.8"/>
        <rect x="145" y="370" width="45" height="22" rx="3" fill="none" stroke="${gold}" stroke-width="1.2"/>
        <rect x="200" y="370" width="45" height="22" rx="3" fill="none" stroke="${gold}" stroke-width="1.2"/>
        <rect x="250" y="370" width="45" height="22" rx="3" fill="none" stroke="${gold}" stroke-width="1.2"/>
        <rect x="300" y="370" width="45" height="22" rx="3" fill="none" stroke="${gold}" stroke-width="1.2"/>
        <line x1="210" y1="308" x2="195" y2="325" stroke="${gold}" stroke-width="1.8"/>
        <line x1="270" y1="308" x2="285" y2="325" stroke="${gold}" stroke-width="1.8"/>
      `;
    case 'os':
      return `
        <rect x="190" y="285" width="100" height="100" rx="8" fill="none" stroke="${gold}" stroke-width="2.8"/>
        <rect x="210" y="305" width="60" height="60" rx="4" fill="${goldLight}" fill-opacity="0.25" stroke="${gold}" stroke-width="2.2"/>
        <circle cx="240" cy="335" r="16" fill="${gold}"/>
        <path d="M 205,285 L 205,275 M 225,285 L 225,275 M 245,285 L 245,275 M 265,285 L 265,275 M 205,385 L 205,395 M 225,385 L 225,395 M 245,385 L 245,395 M 265,385 L 265,395" stroke="${gold}" stroke-width="2.2"/>
        <path d="M 190,305 L 180,305 M 190,325 L 180,325 M 190,345 L 180,345 M 190,365 L 180,365 M 290,305 L 300,305 M 290,325 L 300,325 M 290,345 L 300,345 M 290,365 L 300,365" stroke="${gold}" stroke-width="2.2"/>
      `;
    case 'gitanjali':
      return `
        <circle cx="240" cy="335" r="65" fill="none" stroke="${gold}" stroke-width="1.8"/>
        <path d="M 215,370 C 215,310 230,290 265,290 C 265,340 245,370 215,370 Z" fill="${goldLight}" fill-opacity="0.35" stroke="${gold}" stroke-width="2.2"/>
        <line x1="228" y1="365" x2="242" y2="300" stroke="${gold}" stroke-width="1.4"/>
        <line x1="236" y1="360" x2="250" y2="305" stroke="${gold}" stroke-width="1.4"/>
        <line x1="244" y1="355" x2="258" y2="315" stroke="${gold}" stroke-width="1.4"/>
        <circle cx="240" cy="275" r="5" fill="${goldLight}"/>
      `;
    case 'debate':
      return `
        <line x1="240" y1="280" x2="240" y2="385" stroke="${gold}" stroke-width="2.8"/>
        <line x1="180" y1="305" x2="300" y2="305" stroke="${gold}" stroke-width="2.8"/>
        <line x1="180" y1="305" x2="165" y2="340" stroke="${gold}" stroke-width="1.8"/>
        <line x1="180" y1="305" x2="195" y2="340" stroke="${gold}" stroke-width="1.8"/>
        <path d="M 160,340 Q 180,355 200,340 Z" fill="${goldLight}" stroke="${gold}" stroke-width="1.8"/>
        <line x1="300" y1="305" x2="285" y2="340" stroke="${gold}" stroke-width="1.8"/>
        <line x1="300" y1="305" x2="315" y2="340" stroke="${gold}" stroke-width="1.8"/>
        <path d="M 280,340 Q 300,355 320,340 Z" fill="${goldLight}" stroke="${gold}" stroke-width="1.8"/>
        <path d="M 220,385 L 260,385 L 250,395 L 230,395 Z" fill="${gold}"/>
      `;
    case 'lambda':
      return `
        <circle cx="240" cy="335" r="65" fill="none" stroke="${gold}" stroke-width="2.2"/>
        <circle cx="240" cy="335" r="50" fill="none" stroke="${gold}" stroke-width="1.2" stroke-dasharray="3,3"/>
        <text x="240" y="360" font-family="'Cinzel', serif" font-size="70" font-weight="700" fill="${goldLight}" text-anchor="middle">λ</text>
        <circle cx="240" cy="260" r="6" fill="${gold}"/>
        <circle cx="240" cy="410" r="6" fill="${gold}"/>
      `;
    case 'cosmos':
      return `
        <circle cx="240" cy="335" r="45" fill="${goldLight}" fill-opacity="0.2" stroke="${gold}" stroke-width="2.8"/>
        <circle cx="240" cy="335" r="20" fill="${gold}"/>
        <ellipse cx="240" cy="335" rx="88" ry="30" fill="none" stroke="${gold}" stroke-width="2.2" transform="rotate(-20 240 335)"/>
        <ellipse cx="240" cy="335" rx="88" ry="30" fill="none" stroke="${gold}" stroke-width="1.2" stroke-dasharray="3,3" transform="rotate(20 240 335)"/>
        <circle cx="310" cy="305" r="5" fill="${goldLight}"/>
        <circle cx="170" cy="365" r="5" fill="${goldLight}"/>
      `;
    case 'dragon':
      return `
        <circle cx="240" cy="335" r="65" fill="none" stroke="${gold}" stroke-width="2.2"/>
        <path d="M 240,285 C 275,295 305,330 285,365 C 265,340 250,335 240,350 C 230,335 215,340 195,365 C 175,330 205,295 240,285 Z" fill="${goldLight}" fill-opacity="0.35" stroke="${gold}" stroke-width="2.2"/>
        <circle cx="240" cy="320" r="11" fill="${gold}"/>
        <path d="M 235,310 L 240,295 L 245,310 Z" fill="${goldLight}"/>
        <path d="M 220,380 L 240,365 L 260,380" fill="none" stroke="${gold}" stroke-width="2.2"/>
      `;
    case 'network':
      return `
        <circle cx="240" cy="335" r="65" fill="none" stroke="${gold}" stroke-width="1.8"/>
        <circle cx="240" cy="290" r="9" fill="${goldLight}"/>
        <circle cx="195" cy="335" r="9" fill="${gold}"/>
        <circle cx="285" cy="335" r="9" fill="${gold}"/>
        <circle cx="215" cy="380" r="8" fill="${gold}"/>
        <circle cx="265" cy="380" r="8" fill="${gold}"/>
        <line x1="240" y1="290" x2="195" y2="335" stroke="${gold}" stroke-width="2.2"/>
        <line x1="240" y1="290" x2="285" y2="335" stroke="${gold}" stroke-width="2.2"/>
        <line x1="195" y1="335" x2="285" y2="335" stroke="${gold}" stroke-width="1.6"/>
        <line x1="195" y1="335" x2="215" y2="380" stroke="${gold}" stroke-width="2.2"/>
        <line x1="285" y1="335" x2="265" y2="380" stroke="${gold}" stroke-width="2.2"/>
        <line x1="215" y1="380" x2="265" y2="380" stroke="${gold}" stroke-width="1.6"/>
      `;
    case 'ai':
      return `
        <circle cx="240" cy="335" r="65" fill="none" stroke="${gold}" stroke-width="1.8"/>
        <circle cx="215" cy="305" r="7" fill="${goldLight}"/>
        <circle cx="265" cy="305" r="7" fill="${goldLight}"/>
        <circle cx="195" cy="340" r="7" fill="${gold}"/>
        <circle cx="240" cy="340" r="9" fill="${goldLight}"/>
        <circle cx="285" cy="340" r="7" fill="${gold}"/>
        <circle cx="215" cy="375" r="7" fill="${gold}"/>
        <circle cx="265" cy="375" r="7" fill="${gold}"/>
        <line x1="215" y1="305" x2="195" y2="340" stroke="${gold}" stroke-width="1.6"/>
        <line x1="215" y1="305" x2="240" y2="340" stroke="${gold}" stroke-width="1.6"/>
        <line x1="265" y1="305" x2="240" y2="340" stroke="${gold}" stroke-width="1.6"/>
        <line x1="265" y1="305" x2="285" y2="340" stroke="${gold}" stroke-width="1.6"/>
        <line x1="195" y1="340" x2="215" y2="375" stroke="${gold}" stroke-width="1.6"/>
        <line x1="240" y1="340" x2="215" y2="375" stroke="${gold}" stroke-width="1.6"/>
        <line x1="240" y1="340" x2="265" y2="375" stroke="${gold}" stroke-width="1.6"/>
        <line x1="285" y1="340" x2="265" y2="375" stroke="${gold}" stroke-width="1.6"/>
      `;
    case 'refactoring':
      return `
        <polygon points="240,270 300,335 240,400 180,335" fill="${goldLight}" fill-opacity="0.3" stroke="${gold}" stroke-width="2.8"/>
        <polygon points="240,295 280,335 240,375 200,335" fill="none" stroke="${gold}" stroke-width="1.8"/>
        <circle cx="240" cy="335" r="9" fill="${gold}"/>
        <line x1="240" y1="270" x2="240" y2="400" stroke="${gold}" stroke-width="1.2"/>
        <line x1="180" y1="335" x2="300" y2="335" stroke="${gold}" stroke-width="1.2"/>
      `;
  }
}

function generateSvgCover(def: BookCoverDef): string {
  const p = getThemePalette(def.theme);
  const symbolSvg = getSymbolSvg(def.symbolType, p.accentGold, p.goldLight);

  // Wrap long titles into multiple lines if needed
  const words = def.title.split(' ');
  let titleLine1 = '';
  let titleLine2 = '';

  if (words.length <= 3 || def.title.length <= 20) {
    titleLine1 = def.title;
  } else {
    const mid = Math.ceil(words.length / 2);
    titleLine1 = words.slice(0, mid).join(' ');
    titleLine2 = words.slice(mid).join(' ');
  }

  const titleFontSize = titleLine2 ? (titleLine1.length > 18 ? 20 : 22) : (titleLine1.length > 22 ? 20 : 24);

  const titleLine1Esc = escapeXml(titleLine1);
  const titleLine2Esc = escapeXml(titleLine2);
  const subtitleEsc = escapeXml(def.subtitle);
  const authorEsc = escapeXml(def.author);
  const editionBadgeEsc = escapeXml(def.editionBadge);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 640" width="100%" height="100%">
  <defs>
    <!-- Rich Leather Gradient -->
    <linearGradient id="leatherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.bg1}" />
      <stop offset="45%" stop-color="${p.bg2}" />
      <stop offset="100%" stop-color="${p.bg3}" />
    </linearGradient>

    <!-- 24K Gold Foil Brilliant Gradient -->
    <linearGradient id="goldFoil" x1="0%" y1="0%" x2="100%" y2="85%">
      <stop offset="0%" stop-color="#b38600" />
      <stop offset="20%" stop-color="#ffd700" />
      <stop offset="45%" stop-color="#fff8d1" />
      <stop offset="70%" stop-color="#ffd700" />
      <stop offset="100%" stop-color="#997014" />
    </linearGradient>

    <!-- Center Radiant Amber Aura -->
    <radialGradient id="centerAura" cx="50%" cy="53%" r="40%">
      <stop offset="0%" stop-color="#ffd700" stop-opacity="0.22" />
      <stop offset="60%" stop-color="#ffd700" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#ffd700" stop-opacity="0" />
    </radialGradient>

    <!-- 3D Book Spine Shadow -->
    <linearGradient id="spineShadow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.8" />
      <stop offset="3%" stop-color="#000000" stop-opacity="0.35" />
      <stop offset="6%" stop-color="#ffffff" stop-opacity="0.2" />
      <stop offset="10%" stop-color="#000000" stop-opacity="0" />
    </linearGradient>

    <!-- Light Sheen Reflection -->
    <linearGradient id="lightSheen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.2" />
      <stop offset="28%" stop-color="#ffffff" stop-opacity="0.04" />
      <stop offset="55%" stop-color="#000000" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.38" />
    </linearGradient>

    <!-- Subtle Grain Pattern -->
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="60%" stop-color="#000000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.5" />
    </radialGradient>
  </defs>

  <!-- Leather Background -->
  <rect width="480" height="640" rx="6" fill="url(#leatherGrad)" />
  <rect width="480" height="640" rx="6" fill="url(#vignette)" />

  <!-- Outer Ornate Gold Border -->
  <rect x="22" y="22" width="436" height="596" rx="4" fill="none" stroke="url(#goldFoil)" stroke-width="3.5" />
  
  <!-- Inner Delicate Filigree Border -->
  <rect x="32" y="32" width="416" height="576" rx="2" fill="none" stroke="url(#goldFoil)" stroke-width="1.4" stroke-dasharray="6,2.5" />

  <!-- Ornate Corner Ornaments (Top-Left) -->
  <path d="M 26,50 L 50,26 M 26,62 L 62,26 M 38,38 L 50,50 L 38,62 Z" fill="url(#goldFoil)" stroke="#ffd700" stroke-width="0.6" />
  <!-- (Top-Right) -->
  <path d="M 454,50 L 430,26 M 454,62 L 418,26 M 442,38 L 430,50 L 442,62 Z" fill="url(#goldFoil)" stroke="#ffd700" stroke-width="0.6" />
  <!-- (Bottom-Left) -->
  <path d="M 26,590 L 50,614 M 26,578 L 62,614 M 38,602 L 50,590 L 38,578 Z" fill="url(#goldFoil)" stroke="#ffd700" stroke-width="0.6" />
  <!-- (Bottom-Right) -->
  <path d="M 454,590 L 430,614 M 454,578 L 418,614 M 442,602 L 430,590 L 442,578 Z" fill="url(#goldFoil)" stroke="#ffd700" stroke-width="0.6" />

  <!-- Top Ribbon Badge -->
  <rect x="100" y="50" width="280" height="26" rx="13" fill="${p.bg3}" stroke="url(#goldFoil)" stroke-width="1.2" />
  <text x="240" y="67" font-family="'Cinzel', Georgia, serif" font-size="9.5" font-weight="700" letter-spacing="2" fill="#fff8d1" text-anchor="middle">
    ${editionBadgeEsc}
  </text>

  <!-- Title Section -->
  ${
    titleLine2Esc
      ? `<text x="240" y="124" font-family="'Cinzel', Georgia, serif" font-size="${titleFontSize}" font-weight="800" letter-spacing="1.5" fill="url(#goldFoil)" text-anchor="middle">
           ${titleLine1Esc}
         </text>
         <text x="240" y="${124 + titleFontSize + 8}" font-family="'Cinzel', Georgia, serif" font-size="${titleFontSize}" font-weight="800" letter-spacing="1.5" fill="url(#goldFoil)" text-anchor="middle">
           ${titleLine2Esc}
         </text>`
      : `<text x="240" y="134" font-family="'Cinzel', Georgia, serif" font-size="${titleFontSize}" font-weight="800" letter-spacing="1.5" fill="url(#goldFoil)" text-anchor="middle">
           ${titleLine1Esc}
         </text>`
  }

  <!-- Gold Decorative Divider -->
  <path d="M 150,182 L 240,182 L 330,182" stroke="url(#goldFoil)" stroke-width="1.8" />
  <polygon points="240,177 246,182 240,187 234,182" fill="#fff8d1" />
  <circle cx="150" cy="182" r="3" fill="#ffd700" />
  <circle cx="330" cy="182" r="3" fill="#ffd700" />

  <!-- Subtitle -->
  ${
    subtitleEsc
      ? `<text x="240" y="202" font-family="'Plus Jakarta Sans', sans-serif" font-size="9.5" font-weight="600" letter-spacing="1.5" fill="#fff8d1" fill-opacity="0.9" text-anchor="middle">
           ${subtitleEsc}
         </text>`
      : ''
  }

  <!-- Ambient Center Aura -->
  <circle cx="240" cy="338" r="140" fill="url(#centerAura)" pointer-events="none" />

  <!-- Center Artwork Symbol -->
  <g id="centerSymbol">
    ${symbolSvg}
  </g>

  <!-- Bottom Divider -->
  <path d="M 160,470 L 240,470 L 320,470" stroke="url(#goldFoil)" stroke-width="1.4" />
  <circle cx="240" cy="470" r="3.5" fill="#fff8d1" />

  <!-- Author Section -->
  <text x="240" y="502" font-family="'Plus Jakarta Sans', sans-serif" font-size="10.5" font-weight="600" letter-spacing="2" fill="#fff8d1" fill-opacity="0.75" text-anchor="middle">
    WRITTEN BY
  </text>
  <text x="240" y="528" font-family="'Cinzel', Georgia, serif" font-size="16.5" font-weight="700" letter-spacing="1.2" fill="url(#goldFoil)" text-anchor="middle">
    ${authorEsc}
  </text>

  <!-- Bottom Archival Stamp -->
  <text x="240" y="575" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="600" letter-spacing="2" fill="#fff8d1" fill-opacity="0.7" text-anchor="middle">
    ARCHIVAL COLLECTION // NALANDA REPOSITORY
  </text>

  <!-- Left 3D Spine Emboss and Shadow -->
  <rect x="0" y="0" width="36" height="640" fill="url(#spineShadow)" />
  <line x1="36" y1="0" x2="36" y2="640" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1.2" />

  <!-- Surface Light Sheen Overlay -->
  <rect width="480" height="640" fill="url(#lightSheen)" pointer-events="none" />
</svg>`;
}

async function run() {
  const outputDir = path.resolve('apps/frontend/public/covers');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Generating valid XML luxury vector covers to ${outputDir}...`);

  for (const def of bookCovers) {
    const svgContent = generateSvgCover(def);
    const destPath = path.join(outputDir, def.filename);
    fs.writeFileSync(destPath, svgContent, 'utf-8');
    console.log(`Generated: ${def.filename}`);
  }

  console.log(`Successfully generated all ${bookCovers.length} valid luxury vector covers!`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
