import React from 'react';
import { FishVisual } from '../types';

interface FishIllustrationProps {
  visual: FishVisual;
  className?: string;
  flipHorizontal?: boolean;
}

export const FishIllustration: React.FC<FishIllustrationProps> = ({
  visual,
  className = 'w-20 h-12',
  flipHorizontal = false,
}) => {
  const { shape, primaryColor, secondaryColor, accentColor, stripeType, finStyle } = visual;
  const uid = React.useId().replace(/:/g, '');

  return (
    <svg
      viewBox="0 0 120 75"
      className={`${className} overflow-visible select-none`}
      style={{ transform: flipHorizontal ? 'scaleX(-1)' : undefined }}
    >
      <defs>
        <linearGradient id={`grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
        <filter id={`glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={primaryColor} floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter={`url(#glow-${uid})`}>
        {shape === 'angelfish' && (
          <g>
            {/* Tall sweeping dorsal & anal fins */}
            <path
              d="M52,22 L30,2 L68,26 Z"
              fill={secondaryColor}
              opacity="0.9"
            />
            <path
              d="M52,50 L28,73 L68,46 Z"
              fill={secondaryColor}
              opacity="0.9"
            />
            {/* Tail fin */}
            <path d="M28,36 L8,23 L14,36 L8,49 Z" fill={accentColor} opacity="0.85" />
            {/* Diamond body */}
            <path
              d="M26,36 Q55,14 88,36 Q55,58 26,36 Z"
              fill={primaryColor}
            />
            {/* Vertical stripes */}
            <path d="M46,24 L46,48" stroke={secondaryColor} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M62,21 L62,51" stroke={secondaryColor} strokeWidth="4" strokeLinecap="round" />
            <path d="M76,27 L76,45" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" />
            {/* Long pelvic feelers */}
            <path d="M68,45 Q55,62 40,70" stroke={accentColor} strokeWidth="2" fill="none" />
            {/* Eye */}
            <circle cx="78" cy="33" r="3.5" fill="#ef4444" />
            <circle cx="78.8" cy="33" r="1.8" fill="#0f172a" />
          </g>
        )}

        {shape === 'betta' && (
          <g>
            {/* Huge flowing veil tail */}
            <path
              d="M36,36 C12,8 2,14 6,36 C2,58 12,66 36,42 Z"
              fill={`url(#grad-${uid})`}
              opacity="0.92"
            />
            {/* Flowing dorsal fin */}
            <path
              d="M42,27 C30,10 55,8 70,26 Z"
              fill={secondaryColor}
              opacity="0.9"
            />
            {/* Flowing ventral fin */}
            <path
              d="M38,43 C28,62 58,64 74,44 Z"
              fill={accentColor}
              opacity="0.9"
            />
            {/* Sleek body */}
            <ellipse cx="64" cy="36" rx="28" ry="10.5" fill={primaryColor} />
            {/* Eye */}
            <circle cx="83" cy="34" r="2.8" fill="#f8fafc" />
            <circle cx="83.8" cy="34" r="1.5" fill="#0f172a" />
          </g>
        )}

        {shape === 'guppy' && (
          <g>
            {/* Fan or Sword tail */}
            {finStyle === 'swordtail' ? (
              <g>
                <path d="M32,36 L14,24 L18,36 L2,46 L32,41 Z" fill={secondaryColor} />
                <path d="M28,40 L2,46 L28,43 Z" fill={accentColor} />
              </g>
            ) : (
              <path
                d="M35,36 L10,16 Q4,36 10,56 Z"
                fill={`url(#grad-${uid})`}
              />
            )}
            {/* Dorsal */}
            <path d="M52,27 Q45,15 64,25 Z" fill={accentColor} />
            {/* Body */}
            <ellipse cx="64" cy="37" rx="27" ry="11" fill={primaryColor} />
            {stripeType === 'spots' && (
              <g fill={secondaryColor} opacity="0.85">
                <circle cx="48" cy="36" r="2.5" />
                <circle cx="57" cy="39" r="2" />
                <circle cx="22" cy="32" r="2.5" />
                <circle cx="20" cy="41" r="2" />
              </g>
            )}
            {/* Eye */}
            <circle cx="82" cy="34" r="3" fill="#ffffff" />
            <circle cx="82.8" cy="34" r="1.6" fill="#0f172a" />
          </g>
        )}

        {(shape === 'tetra' || shape === 'rasbora') && (
          <g>
            {/* Forked Tail */}
            <path d="M27,36 L11,24 L17,36 L11,48 Z" fill={stripeType === 'rummy_nose' ? '#ffffff' : secondaryColor} opacity="0.85" />
            {stripeType === 'rummy_nose' && (
              <g stroke="#0f172a" strokeWidth="2.2">
                <line x1="13" y1="27" x2="21" y2="32" />
                <line x1="15" y1="36" x2="24" y2="36" />
                <line x1="13" y1="45" x2="21" y2="40" />
              </g>
            )}
            {/* Dorsal & anal fins */}
            <path d="M54,24 L46,13 L64,24 Z" fill={accentColor} opacity="0.8" />
            <path d="M48,47 L42,56 L58,46 Z" fill={secondaryColor} opacity="0.75" />
            {/* Torpedo body */}
            <path
              d="M25,36 Q58,18 92,36 Q58,54 25,36 Z"
              fill={primaryColor}
            />
            {/* Pattern overlays */}
            {stripeType === 'neon_horizontal' && (
              <>
                <path
                  d="M32,34 Q60,28 84,33"
                  stroke="#00f2fe"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M28,40 Q52,44 68,40"
                  stroke={secondaryColor}
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />
              </>
            )}
            {stripeType === 'harlequin_wedge' && (
              <polygon points="46,35 70,29 66,44 30,37" fill="#0f172a" opacity="0.88" />
            )}
            {stripeType === 'rummy_nose' && (
              <path d="M76,30 Q92,36 76,42 Z" fill="#ef4444" />
            )}
            {stripeType === 'vertical_bars' && (
              <g stroke={secondaryColor} strokeWidth="3.5" strokeLinecap="round">
                <line x1="42" y1="28" x2="42" y2="44" />
                <line x1="56" y1="25" x2="56" y2="47" />
                <line x1="70" y1="26" x2="70" y2="45" />
              </g>
            )}
            {/* Eye */}
            <circle cx="81" cy="33.5" r="3" fill="#ffffff" />
            <circle cx="81.8" cy="33.5" r="1.6" fill="#0f172a" />
          </g>
        )}

        {(shape === 'gourami' || shape === 'cichlid') && (
          <g>
            {/* Tail */}
            <path d="M26,36 L10,23 L13,36 L10,49 Z" fill={secondaryColor} opacity="0.9" />
            {/* Long dorsal */}
            <path
              d="M38,24 Q55,10 75,23 Z"
              fill={finStyle === 'high_dorsal' ? accentColor : secondaryColor}
            />
            {/* Rounded body */}
            <ellipse cx="58" cy="36" rx="32" ry="15" fill={`url(#grad-${uid})`} />
            {stripeType === 'vertical_bars' && (
              <g stroke={secondaryColor} strokeWidth="2.5" opacity="0.65">
                <line x1="42" y1="23" x2="42" y2="49" />
                <line x1="52" y1="22" x2="52" y2="50" />
                <line x1="62" y1="22" x2="62" y2="50" />
                <line x1="72" y1="24" x2="72" y2="48" />
              </g>
            )}
            {/* Gourami feelers */}
            {shape === 'gourami' && (
              <path
                d="M70,48 Q56,64 38,68"
                stroke={accentColor}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            )}
            {/* Eye */}
            <circle cx="80" cy="33" r="3.2" fill="#ffffff" />
            <circle cx="80.8" cy="33" r="1.7" fill="#0f172a" />
          </g>
        )}

        {(shape === 'corydoras' || shape === 'pleco') && (
          <g>
            {/* Tail */}
            <path d="M25,40 L10,28 L15,40 L10,50 Z" fill={secondaryColor} />
            {/* Tall dorsal */}
            <path
              d="M52,27 L46,12 L66,27 Z"
              fill={stripeType === 'panda' ? '#0f172a' : secondaryColor}
            />
            {/* Flat-bellied bottom-dweller body */}
            <path
              d="M24,42 Q46,18 82,32 Q94,39 92,46 L26,46 Z"
              fill={primaryColor}
            />
            {stripeType === 'panda' && (
              <>
                {/* Panda eye mask */}
                <ellipse cx="81" cy="36" rx="4.5" ry="7" fill="#0f172a" />
                <circle cx="30" cy="41" r="4.5" fill="#0f172a" />
              </>
            )}
            {stripeType === 'spots' && (
              <g fill={accentColor} opacity="0.75">
                <circle cx="45" cy="38" r="1.8" />
                <circle cx="56" cy="34" r="1.8" />
                <circle cx="64" cy="40" r="1.8" />
                <circle cx="73" cy="36" r="1.8" />
              </g>
            )}
            {/* Whisker barbels */}
            <path d="M90,45 L97,51 M88,46 L94,52" stroke={secondaryColor} strokeWidth="2" strokeLinecap="round" />
            {/* Eye */}
            <circle cx="81" cy="35" r="2.8" fill="#ffffff" />
            <circle cx="81.6" cy="35" r="1.4" fill="#0f172a" />
          </g>
        )}

        {shape === 'loach' && (
          <g>
            {/* Sinuous eel-like body */}
            <path
              d="M12,42 Q32,30 52,40 T94,38"
              stroke={primaryColor}
              strokeWidth="11"
              strokeLinecap="round"
              fill="none"
            />
            {/* Tiger bands */}
            <path
              d="M18,40 Q32,30 52,40 T88,38"
              stroke={secondaryColor}
              strokeWidth="11"
              strokeDasharray="5 6"
              fill="none"
            />
            <circle cx="92" cy="36" r="2" fill="#ffffff" />
          </g>
        )}

        {shape === 'shrimp' && (
          <g>
            {/* Curved segmented shrimp body */}
            <path
              d="M26,46 Q46,24 76,34 Q86,38 82,44 Q56,36 32,50 Z"
              fill={primaryColor}
            />
            {/* Long antennae */}
            <path d="M82,36 Q98,26 110,22 M82,38 Q100,36 112,38" stroke={accentColor} strokeWidth="1.5" fill="none" />
            {/* Little legs */}
            <path d="M56,42 L54,50 M62,41 L61,49 M68,41 L68,49" stroke={secondaryColor} strokeWidth="1.8" />
            <circle cx="80" cy="36" r="2" fill="#0f172a" />
          </g>
        )}

        {shape === 'snail' && (
          <g>
            {/* Snail foot */}
            <path d="M30,50 L86,50 Q92,46 82,44 L34,44 Z" fill="#64748b" />
            {/* Striped shell */}
            <ellipse cx="56" cy="34" rx="20" ry="15" fill={primaryColor} />
            <path
              d="M42,24 L48,46 M54,20 L58,48 M66,23 L68,46"
              stroke={secondaryColor}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Tentacles */}
            <path d="M84,45 L94,38 M84,47 L95,43" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        )}
      </g>
    </svg>
  );
};
