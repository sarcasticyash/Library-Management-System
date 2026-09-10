import React, { useEffect, useState, useRef, useCallback } from 'react';

interface ArchivalThought {
  orangeWord: string;
  blackLine1: string[];
  blackLine2: string[];
  tagline: string;
}

const THOUGHTS: ArchivalThought[] = [
  {
    orangeWord: 'PULL',
    blackLine1: ['A', 'SPINE.'],
    blackLine2: ['STAMP', 'THE', 'SLIP.'],
    tagline: '350GSM RAG PAPER • PRESERVED FOREVER',
  },
  {
    orangeWord: 'FEEL',
    blackLine1: ['THE', 'PAPER.'],
    blackLine2: ['UNLOCK', 'THE', 'MIND.'],
    tagline: 'Nalanda Central Archival Repository • Station 042-B',
  },
  {
    orangeWord: 'VIDYA',
    blackLine1: ['DADAATI', 'VINAYAM.'],
    blackLine2: ['KNOWLEDGE', 'UNLOCKS', 'THE MIND.'],
    tagline: 'विद्या ददाति विनयं • Ancient Wisdom Meets Cloud Computing',
  },
  {
    orangeWord: 'EXPLORE',
    blackLine1: ['THE', 'ARCHIVE.'],
    blackLine2: ['FIND', 'YOUR', 'TRUTH.'],
    tagline: 'सत्यमेव जयते • Curated Knowledge For Bharat',
  },
  {
    orangeWord: 'PRESERVE',
    blackLine1: ['THE', 'WORD.'],
    blackLine2: ['IGNITE', 'THE', 'FUTURE.'],
    tagline: '125 Active Holdings • Physical & Digital Circulation',
  },
];

export const TypewriterTitle: React.FC = () => {
  const [thoughtIndex, setThoughtIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // 3D Tilt and Spotlight state
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50 });

  const currentThought: ArchivalThought = THOUGHTS[thoughtIndex] ||
    THOUGHTS[0] || {
      orangeWord: 'PULL',
      blackLine1: ['A', 'SPINE.'],
      blackLine2: ['STAMP', 'THE', 'SLIP.'],
      provenance: '350GSM RAG PAPER • PRESERVED FOREVER',
    };

  // Character lengths
  const orangeLength = currentThought.orangeWord.length;
  const black1Length = currentThought.blackLine1.reduce((sum, w) => sum + w.length, 0);
  const line1Length = orangeLength + black1Length;
  const line2Length = currentThought.blackLine2.reduce((sum, w) => sum + w.length, 0);
  const totalChars = line1Length + line2Length;

  // Next thought cycle
  const nextThought = useCallback(() => {
    setIsDeleting(false);
    setCharCount(0);
    setThoughtIndex((prev) => (prev + 1) % THOUGHTS.length);
  }, []);

  // Main Typewriter Loop
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (charCount < totalChars) {
        const isLineBreak = charCount === line1Length;
        const delay = isLineBreak ? 280 : Math.floor(40 + Math.random() * 25);

        timer = setTimeout(() => {
          setCharCount((prev) => prev + 1);
        }, delay);
      } else {
        // Linger on full thought for 5.5 seconds before smoothly cycling
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 5500);
      }
    } else {
      if (charCount > 0) {
        timer = setTimeout(() => {
          setCharCount((prev) => Math.max(0, prev - 2));
        }, 18);
      } else {
        setIsDeleting(false);
        setThoughtIndex((prev) => (prev + 1) % THOUGHTS.length);
      }
    }

    return () => clearTimeout(timer);
  }, [charCount, isDeleting, totalChars, line1Length]);

  // Handle Interactive 3D Tilt & Mouse Spotlight
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;

    const rY = (x / rect.width - 0.5) * 4;
    const rX = -(y / rect.height - 0.5) * 4;

    setTilt({ rotateX: rX, rotateY: rY });
    setSpotlightPos({ x: percentX, y: percentY });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
    setSpotlightPos({ x: 50, y: 50 });
  };

  // Helper to render black words with strict word boundaries and character counting
  const renderBlackWords = (words: string[], availableChars: number) => {
    let remaining = availableChars;

    return words.map((word, wordIdx) => {
      if (remaining <= 0) return null;
      const charsToShow = Math.min(remaining, word.length);
      remaining = Math.max(0, remaining - word.length);

      const chars = word.slice(0, charsToShow).split('');

      return (
        <React.Fragment key={`bw-${wordIdx}`}>
          <span className="poster-word hero-poster-word-black">
            {chars.map((ch, charIdx) => (
              <span key={`bc-${wordIdx}-${charIdx}`} className="ink-letter ink-letter-black">
                {ch}
              </span>
            ))}
          </span>
          {wordIdx < words.length - 1 && charsToShow === word.length && '\u00A0'}
        </React.Fragment>
      );
    });
  };

  const orangeAvailable = Math.min(charCount, orangeLength);
  const black1Available = Math.max(0, Math.min(charCount - orangeLength, black1Length));
  const line2Available = Math.max(0, charCount - line1Length);

  return (
    <div
      ref={wrapperRef}
      className="hero-poster-wrapper"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rotateX.toFixed(2)}deg) rotateY(${tilt.rotateY.toFixed(2)}deg)`,
        ['--spotlight-x' as string]: `${spotlightPos.x.toFixed(1)}%`,
        ['--spotlight-y' as string]: `${spotlightPos.y.toFixed(1)}%`,
      }}
    >
      {/* Dynamic Cursor Spotlight Overlay */}
      <div className="hero-poster-spotlight" aria-hidden="true" />

      {/* Main Punchy Editorial Headline */}
      <h1
        className="hero-poster-title"
        onClick={nextThought}
        title="Click to cycle to next thought"
        aria-label={`${currentThought.orangeWord} ${currentThought.blackLine1.join(' ')} ${currentThought.blackLine2.join(' ')}`}
        style={{ cursor: 'pointer', marginBottom: '8px' }}
      >
        {/* Line 1: Orange Slanted Word + Black Words */}
        <span className="hero-poster-line">
          {orangeAvailable > 0 && (
            <span className="poster-word poster-word-orange">
              {currentThought.orangeWord
                .slice(0, orangeAvailable)
                .split('')
                .map((ch, i) => (
                  <span key={`o-${i}`} className="ink-letter ink-letter-orange">
                    {ch}
                  </span>
                ))}
            </span>
          )}
          {orangeAvailable >= orangeLength && '\u00A0'}
          {renderBlackWords(currentThought.blackLine1, black1Available)}
          {charCount <= line1Length && <span className="typewriter-cursor" />}
        </span>

        {/* Line 2: Black Words */}
        <span className="hero-poster-line">
          {renderBlackWords(currentThought.blackLine2, line2Available)}
          {charCount > line1Length && <span className="typewriter-cursor" />}
        </span>
      </h1>

      {/* Sub-Headline Archival Tagline */}
      <div className="typewriter-meta-row" style={{ marginTop: '12px' }}>
        <div className="typewriter-tagline">
          <span>{currentThought.tagline}</span>
        </div>
      </div>
    </div>
  );
};
