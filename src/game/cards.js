// Dahala Pakad Card Utilities & SVG Generator

export const SUITS = {
  SPADES: 'S',
  HEARTS: 'H',
  DIAMONDS: 'D',
  CLUBS: 'C'
};

export const SUIT_SYMBOLS = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣'
};

export const SUIT_NAMES = {
  S: 'Spades',
  H: 'Hearts',
  D: 'Diamonds',
  C: 'Clubs'
};

export const SUIT_COLORS = {
  S: '#0f172a', // Deep Slate Black
  H: '#dc2626', // Vibrant Playing Card Red
  D: '#dc2626', // Vibrant Playing Card Red
  C: '#0f172a'  // Deep Slate Black
};

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

/**
 * Creates a standard 52 card deck
 * Each card: { id: '10S', suit: 'S', rank: '10', value: 10, isTen: true }
 */
export function createDeck() {
  const deck = [];
  for (const suit of Object.values(SUITS)) {
    for (const rank of RANKS) {
      deck.push({
        id: `${rank}${suit}`,
        suit,
        rank,
        value: RANK_VALUES[rank],
        isTen: rank === '10'
      });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle
 */
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Sorts hand by suit and then by rank descending
 */
export function sortHand(hand) {
  const suitOrder = { 'S': 0, 'H': 1, 'C': 2, 'D': 3 };
  return [...hand].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return b.value - a.value;
  });
}

/**
 * Generates an SVG path string for the given suit centered at (0, 0)
 */
export function getSuitPath(suit) {
  switch (suit) {
    case 'H':
      return 'M 0 7 C -6 2 -9.5 -2 -9.5 -6 C -9.5 -9.5 -6.5 -11 -3.5 -11 C -1.2 -11 0 -9 0 -9 C 0 -9 1.2 -11 3.5 -11 C 6.5 -11 9.5 -9.5 9.5 -6 C 9.5 -2 6 2 0 7 Z';
    case 'D':
      return 'M 0 -10 L 7.5 0 L 0 10 L -7.5 0 Z';
    case 'S':
      return 'M 0 -9 C -6 -3 -9.5 1 -9.5 5 C -9.5 8 -6.5 10 -3 10 C -1 10 0 8 0 8 C 0 8 1 10 3 10 C 6.5 10 9.5 8 9.5 5 C 9.5 1 6 -3 0 -9 Z M -1.5 6 L -3 11 L 3 11 L 1.5 6 Z';
    case 'C':
      return 'M 0 -4.5 C -2.8 -4.5 -4.5 -2.8 -4.5 -0.5 C -4.5 1.5 -2.8 2.8 -1 2.5 C -2.5 3.2 -4.5 5 -4.5 7.2 C -4.5 9.8 -2 10.5 0 10.5 C 2 10.5 4.5 9.8 4.5 7.2 C 4.5 5 2.5 3.2 1 2.5 C 2.8 2.8 4.5 1.5 4.5 -0.5 C 4.5 -2.8 2.8 -4.5 0 -4.5 Z M -1.5 7 L -2.8 12 L 2.8 12 L 1.5 7 Z';
    default:
      return '';
  }
}

/**
 * Generates center graphic, authentic pips, or face card artwork
 */
function renderCardCenter(rank, suit, color) {
  const path = getSuitPath(suit);
  const pip = (x, y, scale = 0.78, flip = false) => `
    <g transform="translate(${x}, ${y}) scale(${scale}) ${flip ? 'rotate(180)' : ''}">
      <path d="${path}" fill="${color}" />
    </g>
  `;

  switch (rank) {
    case '2':
      return pip(50, 48) + pip(50, 92, 0.78, true);

    case '3':
      return pip(50, 46) + pip(50, 70) + pip(50, 94, 0.78, true);

    case '4':
      return pip(35, 48) + pip(65, 48) + pip(35, 92, 0.78, true) + pip(65, 92, 0.78, true);

    case '5':
      return pip(35, 48) + pip(65, 48) + pip(50, 70) + pip(35, 92, 0.78, true) + pip(65, 92, 0.78, true);

    case '6':
      return (
        pip(35, 48) + pip(65, 48) +
        pip(35, 70) + pip(65, 70) +
        pip(35, 92, 0.78, true) + pip(65, 92, 0.78, true)
      );

    case '7':
      return (
        pip(35, 48) + pip(65, 48) +
        pip(50, 59) +
        pip(35, 70) + pip(65, 70) +
        pip(35, 92, 0.78, true) + pip(65, 92, 0.78, true)
      );

    case '8':
      return (
        pip(35, 48) + pip(65, 48) +
        pip(50, 58) +
        pip(35, 70) + pip(65, 70) +
        pip(50, 82, 0.78, true) +
        pip(35, 92, 0.78, true) + pip(65, 92, 0.78, true)
      );

    case '9':
      return (
        pip(35, 44) + pip(65, 44) +
        pip(35, 60) + pip(65, 60) +
        pip(50, 70) +
        pip(35, 80, 0.78, true) + pip(65, 80, 0.78, true) +
        pip(35, 96, 0.78, true) + pip(65, 96, 0.78, true)
      );

    case '10':
      return `
        <!-- Dehla Special Gold Shield -->
        <g transform="translate(50, 70)">
          <rect x="-36" y="-42" width="72" height="84" rx="8" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
          <rect x="-33" y="-39" width="66" height="78" rx="6" fill="#fffbeb" stroke="#f59e0b" stroke-width="1" stroke-dasharray="2 2"/>
          
          <!-- Banner -->
          <rect x="-34" y="-34" width="68" height="15" rx="3" fill="#b45309"/>
          <text x="0" y="-23" font-size="9.5" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">★ DEHLA ★</text>
          
          <!-- Large Center Suit & Rank -->
          <g transform="translate(0, 7) scale(1.6)">
            <path d="${path}" fill="${color}" />
          </g>
          <text x="0" y="28" font-size="14" font-weight="900" fill="#b45309" text-anchor="middle">10</text>
        </g>
      `;

    case 'J':
      return `
        <!-- Jack Court Emblem -->
        <g transform="translate(50, 70)">
          <rect x="-34" y="-38" width="68" height="76" rx="6" fill="#f8fafc" stroke="${color}" stroke-width="1.5"/>
          <rect x="-31" y="-35" width="62" height="70" rx="4" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
          
          <!-- Shield / Armor Symbol -->
          <path d="M 0 -22 L 16 -16 L 16 2 C 16 14 0 24 0 24 C 0 24 -16 14 -16 2 L -16 -16 Z" fill="#ffffff" stroke="${color}" stroke-width="1.5"/>
          <path d="M -9 -14 L 0 -20 L 9 -14 L 6 -3 L -6 -3 Z" fill="#e2e8f0" stroke="${color}" stroke-width="1.2"/>
          <circle cx="0" cy="-6" r="3" fill="${color}"/>
          <g transform="translate(0, 8) scale(0.9)">
            <path d="${path}" fill="${color}" />
          </g>
          
          <text x="0" y="32" font-size="11" font-weight="900" fill="${color}" text-anchor="middle">JACK</text>
        </g>
      `;

    case 'Q':
      return `
        <!-- Queen Court Emblem -->
        <g transform="translate(50, 70)">
          <rect x="-34" y="-38" width="68" height="76" rx="6" fill="#fdf2f8" stroke="${color}" stroke-width="1.5"/>
          <rect x="-31" y="-35" width="62" height="70" rx="4" fill="#fff1f2" stroke="#fbcfe8" stroke-width="1"/>
          
          <!-- Queen Crown -->
          <path d="M -16 10 L -18 -8 L -9 -2 L 0 -14 L 9 -2 L 18 -8 L 16 10 Z" fill="#fef08a" stroke="#d97706" stroke-width="1.5"/>
          <circle cx="-18" cy="-8" r="2" fill="#d97706"/>
          <circle cx="0" cy="-14" r="2.5" fill="#d97706"/>
          <circle cx="18" cy="-8" r="2" fill="#d97706"/>
          <rect x="-16" y="8" width="32" height="4" fill="#b45309"/>
          
          <g transform="translate(0, -1) scale(0.95)">
            <path d="${path}" fill="${color}" />
          </g>
          
          <text x="0" y="32" font-size="11" font-weight="900" fill="${color}" text-anchor="middle">QUEEN</text>
        </g>
      `;

    case 'K':
      return `
        <!-- King Court Emblem -->
        <g transform="translate(50, 70)">
          <rect x="-34" y="-38" width="68" height="76" rx="6" fill="#fefce8" stroke="${color}" stroke-width="1.5"/>
          <rect x="-31" y="-35" width="62" height="70" rx="4" fill="#fef9c3" stroke="#fde047" stroke-width="1"/>
          
          <!-- King Imperial Crown -->
          <path d="M -18 8 L -20 -10 L -10 -4 L 0 -16 L 10 -4 L 20 -10 L 18 8 Z" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
          <circle cx="-20" cy="-10" r="2" fill="#b45309"/>
          <circle cx="0" cy="-16" r="3" fill="#dc2626"/>
          <circle cx="20" cy="-10" r="2" fill="#b45309"/>
          <rect x="-18" y="7" width="36" height="5" rx="1" fill="#78350f"/>
          
          <g transform="translate(0, 0) scale(1)">
            <path d="${path}" fill="${color}" />
          </g>
          
          <text x="0" y="32" font-size="11" font-weight="900" fill="${color}" text-anchor="middle">KING</text>
        </g>
      `;

    case 'A':
      return `
        <!-- Ace Majestic Center Emblem -->
        <g transform="translate(50, 70)">
          <circle cx="0" cy="0" r="26" fill="none" stroke="${color}" stroke-width="0.8" stroke-dasharray="3 2" opacity="0.4"/>
          <g transform="scale(2.2)">
            <path d="${path}" fill="${color}" />
          </g>
          <text x="0" y="31" font-size="11" font-weight="900" fill="${color}" text-anchor="middle" letter-spacing="2">ACE</text>
        </g>
      `;

    default:
      return '';
  }
}

/**
 * Renders an inline SVG element for a playing card
 */
export function createCardSVG(card, isFaceUp = true) {
  if (!isFaceUp) {
    return `
      <svg class="card-svg card-back" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="96" height="136" rx="8" ry="8" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
        <rect x="6" y="6" width="88" height="128" rx="6" ry="6" fill="#0f172a" stroke="#0284c7" stroke-width="1.2"/>
        
        <!-- Classic Geometric Back Pattern -->
        <g opacity="0.35">
          <path d="M 12 12 L 88 128 M 88 12 L 12 128" stroke="#38bdf8" stroke-width="1.5"/>
          <path d="M 50 12 L 50 128 M 12 70 L 88 70" stroke="#38bdf8" stroke-width="1"/>
          <rect x="25" y="40" width="50" height="60" rx="4" fill="none" stroke="#38bdf8" stroke-width="1.2"/>
        </g>
        
        <!-- Dahala Pakad Center Medallion -->
        <circle cx="50" cy="70" r="18" fill="#0f172a" stroke="#f59e0b" stroke-width="2"/>
        <circle cx="50" cy="70" r="14" fill="#1e293b" stroke="#f59e0b" stroke-width="1" stroke-dasharray="2 2"/>
        <text x="50" y="75" font-size="13" font-weight="900" fill="#f59e0b" text-anchor="middle">♠ DP ♠</text>
      </svg>
    `;
  }

  const path = getSuitPath(card.suit);
  const color = SUIT_COLORS[card.suit] || '#0f172a';
  const isTen = card.isTen;

  return `
    <svg class="card-svg ${isTen ? 'ten-card' : ''}" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">
      <!-- Card Base Background -->
      <rect x="2" y="2" width="96" height="136" rx="8" ry="8" fill="#ffffff" stroke="${isTen ? '#f59e0b' : '#cbd5e1'}" stroke-width="${isTen ? '2.5' : '1.5'}"/>
      ${isTen ? '<rect x="4.5" y="4.5" width="91" height="131" rx="6" fill="none" stroke="#fef08a" stroke-width="1" opacity="0.8"/>' : ''}
      
      <!-- Top Left Corner -->
      <g transform="translate(13, 10)">
        <text x="0" y="12" font-size="15" font-weight="900" fill="${color}" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif">${card.rank}</text>
        <g transform="translate(0, 21) scale(0.65)">
          <path d="${path}" fill="${color}" />
        </g>
      </g>
      
      <!-- Center Graphic / Pips / Face Art -->
      ${renderCardCenter(card.rank, card.suit, color)}
      
      <!-- Bottom Right Corner (Symmetrically Rotated 180° around center 50, 70) -->
      <g transform="rotate(180, 50, 70)">
        <g transform="translate(13, 10)">
          <text x="0" y="12" font-size="15" font-weight="900" fill="${color}" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif">${card.rank}</text>
          <g transform="translate(0, 21) scale(0.65)">
            <path d="${path}" fill="${color}" />
          </g>
        </g>
      </g>
    </svg>
  `;
}
