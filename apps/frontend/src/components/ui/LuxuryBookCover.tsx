import React, { useState } from 'react';
import { getBookCoverUrl, getBookEditionTier } from '../../utils/bookCover.util';
import { Sparkles } from 'lucide-react';

export interface LuxuryBookCoverProps {
  book: {
    id?: string;
    title: string;
    author: string;
    isbn?: string;
    genre?: string;
    coverImageUrl?: string | null;
    publicationYear?: number;
  };
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showRibbon?: boolean;
  showFoilSheen?: boolean;
  interactiveHover?: boolean;
  badgeText?: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const SIZE_CONFIG = {
  sm: {
    width: 140,
    height: 196,
    borderRadius: 6,
    spineWidth: 10,
    pageDepth: 4,
    badgeFontSize: '8px',
  },
  md: {
    width: 220,
    height: 308,
    borderRadius: 8,
    spineWidth: 14,
    pageDepth: 6,
    badgeFontSize: '9px',
  },
  lg: {
    width: 280,
    height: 392,
    borderRadius: 10,
    spineWidth: 18,
    pageDepth: 8,
    badgeFontSize: '10px',
  },
  hero: {
    width: 340,
    height: 476,
    borderRadius: 12,
    spineWidth: 22,
    pageDepth: 10,
    badgeFontSize: '11px',
  },
};

export const LuxuryBookCover: React.FC<LuxuryBookCoverProps> = ({
  book,
  size = 'md',
  showRibbon = true,
  showFoilSheen = true,
  interactiveHover = true,
  badgeText,
  onClick,
  className = '',
  style = {},
}) => {
  const primaryCoverUrl = getBookCoverUrl(book);
  const [currentSrc, setCurrentSrc] = useState<string>(primaryCoverUrl);
  const [hasFailed, setHasFailed] = useState<boolean>(false);
  const [triedSvg, setTriedSvg] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  React.useEffect(() => {
    setCurrentSrc(getBookCoverUrl(book));
    setHasFailed(false);
    setTriedSvg(false);
  }, [book]);

  const handleImageError = () => {
    if (!triedSvg && currentSrc.endsWith('.jpg')) {
      setTriedSvg(true);
      setCurrentSrc(currentSrc.replace('.jpg', '.svg'));
    } else {
      setHasFailed(true);
    }
  };

  const dim = SIZE_CONFIG[size];
  const editionTier = badgeText || getBookEditionTier(book);

  const getLeatherGradient = (genre?: string) => {
    switch (genre) {
      case 'PHILOSOPHY':
      case 'FICTION':
        return 'linear-gradient(145deg, #2b0808 0%, #150303 100%)';
      case 'COMPUTER_SCIENCE':
      case 'TECHNOLOGY':
        return 'linear-gradient(145deg, #071329 0%, #030814 100%)';
      case 'SCIENCE':
      case 'MATHEMATICS':
        return 'linear-gradient(145deg, #082416 0%, #031009 100%)';
      default:
        return 'linear-gradient(145deg, #1c1511 0%, #0c0907 100%)';
    }
  };

  return (
    <div
      className={`luxury-book-wrapper ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        display: 'inline-block',
        perspective: '1200px',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* 3D Physical Book Body */}
      <div
        style={{
          position: 'relative',
          width: `${dim.width}px`,
          height: `${dim.height}px`,
          borderRadius: `${dim.borderRadius}px`,
          transformStyle: 'preserve-3d',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          transform:
            interactiveHover && isHovered
              ? 'translateY(-8px) rotateY(-6deg) rotateX(2deg) scale(1.025)'
              : 'translateY(0) rotateY(0) scale(1)',
          boxShadow:
            interactiveHover && isHovered
              ? `0 24px 44px -8px rgba(28, 20, 14, 0.45), 0 0 25px rgba(234, 179, 8, 0.28), -${dim.pageDepth + 2}px 4px 8px rgba(0,0,0,0.3)`
              : `0 12px 28px -6px rgba(28, 20, 14, 0.35), 0 2px 8px rgba(0, 0, 0, 0.15), -${dim.pageDepth}px 3px 6px rgba(0,0,0,0.25)`,
          background: '#1d1815',
          overflow: 'visible',
        }}
      >
        {/* Physical Paper Pages Edge (Right edge simulation) */}
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: `-${dim.pageDepth}px`,
            width: `${dim.pageDepth}px`,
            height: `${dim.height - 8}px`,
            background:
              'repeating-linear-gradient(to right, #f4ecd8 0px, #e7ddc4 1px, #fdfbf7 2px)',
            borderRight: '1.5px solid #d4c5a9',
            borderTop: '1px solid #e2d5ba',
            borderBottom: '1px solid #c9b999',
            borderRadius: '0 3px 3px 0',
            transform: 'skewY(-1deg)',
            transformOrigin: 'left center',
            boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.15)',
            zIndex: 1,
          }}
        />

        {/* Bottom Pages Edge */}
        <div
          style={{
            position: 'absolute',
            bottom: `-${Math.round(dim.pageDepth * 0.7)}px`,
            left: `${dim.spineWidth}px`,
            width: `${dim.width - dim.spineWidth - 2}px`,
            height: `${Math.round(dim.pageDepth * 0.7)}px`,
            background:
              'repeating-linear-gradient(to bottom, #f4ecd8 0px, #e7ddc4 1px, #fdfbf7 2px)',
            borderBottom: '1.5px solid #d4c5a9',
            borderRadius: '0 0 3px 3px',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
            zIndex: 1,
          }}
        />

        {/* Main Cover Card Body */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: `${dim.borderRadius}px`,
            overflow: 'hidden',
            border: '1.5px solid rgba(212, 175, 55, 0.45)',
            background: '#1a1614',
            zIndex: 2,
          }}
        >
          {/* Cover Art Image or Luxurious Leather Jacket Fallback */}
          {!hasFailed ? (
            <img
              src={currentSrc}
              alt=""
              role="presentation"
              loading="lazy"
              onError={handleImageError}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transition: 'transform 0.5s ease',
                transform: isHovered && interactiveHover ? 'scale(1.03)' : 'scale(1)',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: getLeatherGradient(book.genre),
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px 14px',
                boxSizing: 'border-box',
                textAlign: 'center',
                color: '#fff8d1',
              }}
            >
              {/* Ornate Gold Double Border */}
              <div
                style={{
                  position: 'absolute',
                  inset: '8px',
                  border: '1.5px solid rgba(255, 215, 0, 0.65)',
                  borderRadius: '4px',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: '12px',
                  border: '1px dashed rgba(255, 215, 0, 0.35)',
                  borderRadius: '2px',
                  pointerEvents: 'none',
                }}
              />

              {/* Top Archive Badge */}
              <div
                style={{
                  padding: '2px 8px',
                  background: 'rgba(0,0,0,0.65)',
                  border: '1px solid rgba(255, 215, 0, 0.5)',
                  borderRadius: '999px',
                  fontSize: '7.5px',
                  letterSpacing: '0.12em',
                  fontFamily: "'Cinzel', Georgia, serif",
                  color: '#ffd700',
                  zIndex: 2,
                  marginTop: '8px',
                }}
              >
                ARCHIVAL EDITION
              </div>

              {/* Center Title & Crest */}
              <div style={{ zIndex: 2, margin: 'auto 0', padding: '0 4px' }}>
                <h4
                  style={{
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontSize: size === 'sm' ? '10px' : size === 'md' ? '13px' : '16px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    background: 'linear-gradient(135deg, #ffd700 0%, #fff8d1 50%, #d4af37 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.3,
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  {book.title}
                </h4>
                <div
                  style={{
                    width: '40px',
                    height: '1.5px',
                    background: 'linear-gradient(to right, transparent, #ffd700, transparent)',
                    margin: '0 auto 6px',
                  }}
                />
                <p
                  style={{
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontSize: size === 'sm' ? '7.5px' : '9px',
                    letterSpacing: '0.08em',
                    color: 'rgba(255, 248, 209, 0.85)',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}
                >
                  {book.author}
                </p>
              </div>

              {/* Bottom Stamp */}
              <div
                style={{
                  fontSize: '7px',
                  letterSpacing: '0.14em',
                  color: 'rgba(255, 215, 0, 0.65)',
                  fontFamily: 'monospace',
                  zIndex: 2,
                  marginBottom: '4px',
                }}
              >
                NALANDA REPOSITORY
              </div>
            </div>
          )}

          {/* 3D Curved Spine Shadow Overlay (Left side) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${dim.spineWidth + 6}px`,
              height: '100%',
              background:
                'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 35%, rgba(255,255,255,0.18) 60%, rgba(0,0,0,0.15) 80%, rgba(0,0,0,0) 100%)',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />

          {/* Left Spine Rib Ridges (Simulating antique leather binding bands) */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: 0,
              width: `${dim.spineWidth - 2}px`,
              height: '3px',
              background: 'linear-gradient(to bottom, rgba(255,215,0,0.6), rgba(0,0,0,0.6))',
              pointerEvents: 'none',
              zIndex: 4,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '38%',
              left: 0,
              width: `${dim.spineWidth - 2}px`,
              height: '3px',
              background: 'linear-gradient(to bottom, rgba(255,215,0,0.6), rgba(0,0,0,0.6))',
              pointerEvents: 'none',
              zIndex: 4,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '62%',
              left: 0,
              width: `${dim.spineWidth - 2}px`,
              height: '3px',
              background: 'linear-gradient(to bottom, rgba(255,215,0,0.6), rgba(0,0,0,0.6))',
              pointerEvents: 'none',
              zIndex: 4,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '85%',
              left: 0,
              width: `${dim.spineWidth - 2}px`,
              height: '3px',
              background: 'linear-gradient(to bottom, rgba(255,215,0,0.6), rgba(0,0,0,0.6))',
              pointerEvents: 'none',
              zIndex: 4,
            }}
          />

          {/* 24K Gold Filigree Corner Accents */}
          {/* Top-Right Brass Bracket */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '18px',
              height: '18px',
              borderTop: '2.5px solid #ffd700',
              borderRight: '2.5px solid #ffd700',
              borderTopRightRadius: `${dim.borderRadius}px`,
              boxShadow: '0 0 6px rgba(255, 215, 0, 0.4)',
              pointerEvents: 'none',
              zIndex: 4,
            }}
          />
          {/* Bottom-Right Brass Bracket */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '18px',
              height: '18px',
              borderBottom: '2.5px solid #ffd700',
              borderRight: '2.5px solid #ffd700',
              borderBottomRightRadius: `${dim.borderRadius}px`,
              boxShadow: '0 0 6px rgba(255, 215, 0, 0.4)',
              pointerEvents: 'none',
              zIndex: 4,
            }}
          />

          {/* Glossy 24K Foil Sheen Reflection Overlay */}
          {showFoilSheen && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background:
                  isHovered && interactiveHover
                    ? 'linear-gradient(115deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 45%, rgba(212,175,55,0.15) 60%, rgba(0,0,0,0.2) 100%)'
                    : 'linear-gradient(120deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.25) 100%)',
                transition: 'background 0.4s ease',
                pointerEvents: 'none',
                zIndex: 5,
              }}
            />
          )}

          {/* Archival Edition Pill Tag (Floating at top-right of cover) */}
          {editionTier && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '999px',
                background: 'rgba(20, 16, 14, 0.82)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 215, 0, 0.5)',
                color: '#ffd700',
                fontFamily: "'Cinzel', 'Plus Jakarta Sans', serif",
                fontSize: dim.badgeFontSize,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                zIndex: 6,
              }}
            >
              <Sparkles size={9} color="#ffd700" />
              <span>{editionTier}</span>
            </div>
          )}
        </div>

        {/* Silk Bookmark Ribbon (Dangles down below the book edge) */}
        {showRibbon && (
          <div
            style={{
              position: 'absolute',
              bottom: `-${dim.pageDepth + 14}px`,
              right: `${Math.round(dim.width * 0.35)}px`,
              width: '14px',
              height: '24px',
              background: 'linear-gradient(to bottom, #991b1b, #7f1d1d)',
              borderRadius: '0 0 2px 2px',
              boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
              transform: isHovered ? 'rotate(4deg) scaleY(1.1)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
              zIndex: 1,
            }}
          >
            {/* Ribbon V-Notch Cut */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: 0,
                height: 0,
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderBottom: '6px solid #1a1614',
              }}
            />
            {/* Gold Fringe Thread */}
            <div
              style={{
                position: 'absolute',
                bottom: '1px',
                left: '2px',
                right: '2px',
                height: '2px',
                background: '#ffd700',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
