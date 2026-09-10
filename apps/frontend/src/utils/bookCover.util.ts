/**
 * Cloud-Native Library Management System (LMS)
 * Luxury Book Cover Resolution & Metadata Helper
 */

const BOOK_COVER_MAP: Record<string, string> = {
  // ID mappings
  '000000000000000000000001': '/covers/aryabhatiya.jpg',
  '000000000000000000000002': '/covers/arthashastra.jpg',
  '000000000000000000000003': '/covers/discovery-of-india.jpg',
  '000000000000000000000004': '/covers/concepts-of-physics.jpg',
  '000000000000000000000005': '/covers/sanskrit-nlp.jpg',
  '000000000000000000000006': '/covers/ddia.jpg',
  '000000000000000000000007': '/covers/clean-architecture.svg',
  '000000000000000000000008': '/covers/clrs.jpg',
  '000000000000000000000009': '/covers/wings-of-fire.svg',
  '000000000000000000000010': '/covers/upanishads.svg',
  '000000000000000000000011': '/covers/india-after-gandhi.svg',
  '000000000000000000000012': '/covers/panchatantra.svg',
  '000000000000000000000013': '/covers/sre.svg',
  '000000000000000000000014': '/covers/building-microservices.svg',
  '000000000000000000000015': '/covers/database-internals.svg',
  '000000000000000000000016': '/covers/operating-systems.svg',
  '000000000000000000000017': '/covers/gitanjali.svg',
  '000000000000000000000018': '/covers/argumentative-indian.svg',
  '000000000000000000000019': '/covers/sicp.svg',
  '000000000000000000000020': '/covers/brief-history-of-time.svg',
  '000000000000000000000021': '/covers/dragon-book.svg',
  '000000000000000000000022': '/covers/computer-networks.svg',
  '000000000000000000000023': '/covers/artificial-intelligence.svg',
  '000000000000000000000024': '/covers/refactoring.svg',

  // ISBN mappings
  '9788172360214': '/covers/aryabhatiya.jpg',
  '9780140446036': '/covers/arthashastra.jpg',
  '9780195623598': '/covers/discovery-of-india.jpg',
  '9788177091878': '/covers/concepts-of-physics.jpg',
  '9783642175275': '/covers/sanskrit-nlp.jpg',
  '9781449373320': '/covers/ddia.jpg',
  '9780134494166': '/covers/clean-architecture.svg',
  '9780262033848': '/covers/clrs.jpg',
  '9788173711466': '/covers/wings-of-fire.svg',
  '9781586380212': '/covers/upanishads.svg',
  '9780330505543': '/covers/india-after-gandhi.svg',
  '9788171670659': '/covers/panchatantra.svg',
  '9781491929124': '/covers/sre.svg',
  '9781492034025': '/covers/building-microservices.svg',
  '9781492040347': '/covers/database-internals.svg',
  '9781119456339': '/covers/operating-systems.svg',
  '9780143417095': '/covers/gitanjali.svg',
  '9780141012117': '/covers/argumentative-indian.svg',
  '9780262510875': '/covers/sicp.svg',
  '9780553380163': '/covers/brief-history-of-time.svg',
  '9780321486813': '/covers/dragon-book.svg',
  '9780123850591': '/covers/computer-networks.svg',
  '9780136042594': '/covers/artificial-intelligence.svg',
  '9780134757599': '/covers/refactoring.svg',
};

/**
 * Resolves the absolute or relative cover photo URL for any book.
 * Falls back to matching by ID, ISBN, title keywords, or default luxury jacket.
 */
export function getBookCoverUrl(book?: {
  id?: string;
  isbn?: string;
  title?: string;
  coverImageUrl?: string | null;
}): string {
  if (!book) return '/covers/aryabhatiya.jpg';

  if (book.coverImageUrl && book.coverImageUrl.trim() !== '') {
    return book.coverImageUrl;
  }

  if (book.id && BOOK_COVER_MAP[book.id]) {
    return BOOK_COVER_MAP[book.id] || '/covers/aryabhatiya.jpg';
  }

  if (book.isbn && BOOK_COVER_MAP[book.isbn]) {
    return BOOK_COVER_MAP[book.isbn] || '/covers/aryabhatiya.jpg';
  }

  // Keyword title fallback
  if (book.title) {
    const t = book.title.toLowerCase();
    if (t.includes('aryabhat')) return '/covers/aryabhatiya.jpg';
    if (t.includes('arthashastra')) return '/covers/arthashastra.jpg';
    if (t.includes('discovery of india')) return '/covers/discovery-of-india.jpg';
    if (t.includes('physics')) return '/covers/concepts-of-physics.jpg';
    if (t.includes('sanskrit')) return '/covers/sanskrit-nlp.jpg';
    if (t.includes('data-intensive')) return '/covers/ddia.jpg';
    if (t.includes('clean architecture')) return '/covers/clean-architecture.svg';
    if (t.includes('algorithm') || t.includes('clrs')) return '/covers/clrs.jpg';
    if (t.includes('wings of fire') || t.includes('kalam')) return '/covers/wings-of-fire.svg';
    if (t.includes('upanishad')) return '/covers/upanishads.svg';
    if (t.includes('gandhi')) return '/covers/india-after-gandhi.svg';
    if (t.includes('panchatantra')) return '/covers/panchatantra.svg';
    if (t.includes('reliability') || t.includes('sre')) return '/covers/sre.svg';
    if (t.includes('microservice')) return '/covers/building-microservices.svg';
    if (t.includes('database internals')) return '/covers/database-internals.svg';
    if (t.includes('operating system')) return '/covers/operating-systems.svg';
    if (t.includes('gitanjali') || t.includes('tagore')) return '/covers/gitanjali.svg';
    if (t.includes('argumentative')) return '/covers/argumentative-indian.svg';
    if (t.includes('sicp') || t.includes('structure and interpretation')) return '/covers/sicp.svg';
    if (t.includes('history of time') || t.includes('hawking'))
      return '/covers/brief-history-of-time.svg';
    if (t.includes('compiler') || t.includes('dragon')) return '/covers/dragon-book.svg';
    if (t.includes('network')) return '/covers/computer-networks.svg';
    if (t.includes('artificial intelligence') || t.includes('norvig'))
      return '/covers/artificial-intelligence.svg';
    if (t.includes('refactoring') || t.includes('fowler')) return '/covers/refactoring.svg';
  }

  return '/covers/aryabhatiya.jpg';
}

/**
 * Returns a luxury collector subtitle or edition badge for a book.
 */
export function getBookEditionTier(book?: {
  id?: string;
  genre?: string;
  publicationYear?: number;
}): string {
  if (!book) return 'Collector Edition';
  const id = book.id || '';
  if (
    ['000000000000000000000001', '000000000000000000000002', '000000000000000000000010'].includes(
      id,
    )
  ) {
    return 'Nalanda Archival Heritage';
  }
  if (
    ['000000000000000000000003', '000000000000000000000011', '000000000000000000000017'].includes(
      id,
    )
  ) {
    return 'National Heritage First Edition';
  }
  if (
    ['000000000000000000000004', '000000000000000000000009', '000000000000000000000020'].includes(
      id,
    )
  ) {
    return 'Royal Academy Science Edition';
  }
  return 'Archival 24K Gold Masterwork';
}
