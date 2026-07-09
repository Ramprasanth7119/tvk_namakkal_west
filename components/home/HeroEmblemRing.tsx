'use client';

import type { SVGProps } from 'react';
import { FLAG_MED } from '@/constants/flag_assets';

/** SVG2 textPath attrs not yet in React's SVG typings. */
const RING_TEXT_PATH_PROPS = {
  side: 'right',
  method: 'align',
} as SVGProps<SVGTextPathElement>;

type HeroEmblemRingProps = {
  ringText: string;
  id?: string;
};

const WORD_GAP = '\u2003';

/** Word gaps + at most one repeat so glyphs stay large; spacing adjust fills the ring. */
function buildRingLabel(raw: string): string {
  const segment = raw
    .trim()
    .split(/\s*✦\s*/)
    .map((part) => part.trim().split(/\s+/).filter(Boolean).join(WORD_GAP))
    .filter(Boolean)
    .join(`${WORD_GAP}✦${WORD_GAP}`);

  if (segment.length >= 70) {
    return segment;
  }
  return `${segment}${WORD_GAP}${segment}`;
}

/** Emblem + rotating ring text in one SVG viewBox so they stay aligned at every size. */
export default function HeroEmblemRing({ ringText, id = 'medWrap' }: HeroEmblemRingProps) {
  // Outer ring: just outside the red disc (image stays at 16/168 — unchanged).
  const ringR = 86;
  const ringCx = 100;
  const ringCy = 100;
  const ringTop = ringCy - ringR;
  const ringCircumference = 2 * Math.PI * ringR;
  const label = buildRingLabel(ringText);

  return (
    <div className="med-wrap" id={id}>
      <svg className="hero-emblem" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <path
            id="heroRingPath"
            d={`M ${ringCx},${ringTop} a ${ringR},${ringR} 0 1,1 -0.01,0 z`}
          />
        </defs>
        <image
          href={FLAG_MED}
          x="16"
          y="16"
          width="168"
          height="168"
          preserveAspectRatio="xMidYMid meet"
        />
        <g className="hero-ring-spin">
          <text className="hero-ring-text" fontSize="11.5" fontWeight="700">
            <textPath
              href="#heroRingPath"
              textLength={ringCircumference.toFixed(2)}
              lengthAdjust="spacing"
              startOffset="0%"
              {...RING_TEXT_PATH_PROPS}
            >
              {label}
            </textPath>
          </text>
        </g>
      </svg>
    </div>
  );
}
