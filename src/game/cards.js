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
  S: '#1e293b', // Dark Slate
  H: '#dc2626', // Red
  D: '#dc2626', // Red
  C: '#1e293b'  // Dark Slate
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
 * Renders an inline SVG element for a playing card
 */
export function createCardSVG(card, isFaceUp = true) {
  if (!isFaceUp) {
    return `
      <svg class="card-svg card-back" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="96" height="136" rx="8" ry="8" fill="#1e293b" stroke="#ffffff" stroke-width="2"/>
        <rect x="6" y="6" width="88" height="128" rx="6" ry="6" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 2"/>
        <path d="M 20 20 L 80 120 M 80 20 L 20 120 M 50 10 L 50 130 M 10 70 L 90 70" stroke="#0284c7" stroke-width="1" opacity="0.4"/>
        <circle cx="50" cy="70" r="18" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
        <text x="50" y="76" font-size="18" font-weight="bold" fill="#38bdf8" text-anchor="middle">🎴</text>
      </svg>
    `;
  }

  const symbol = SUIT_SYMBOLS[card.suit];
  const color = SUIT_COLORS[card.suit];
  const isTen = card.isTen;

  return `
    <svg class="card-svg ${isTen ? 'ten-card' : ''}" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="96" height="136" rx="8" ry="8" fill="#ffffff" stroke="${isTen ? '#f59e0b' : '#cbd5e1'}" stroke-width="${isTen ? '3' : '2'}"/>
      
      <!-- Top Left Rank & Suit -->
      <text x="10" y="22" font-size="16" font-weight="bold" fill="${color}" font-family="sans-serif">${card.rank}</text>
      <text x="10" y="36" font-size="14" fill="${color}">${symbol}</text>
      
      <!-- Center Emblem -->
      <g transform="translate(50, 70)">
        <text x="0" y="12" font-size="${isTen ? '38' : '34'}" fill="${color}" text-anchor="middle">${symbol}</text>
        ${isTen ? '<text x="0" y="-22" font-size="12" font-weight="bold" fill="#d97706" text-anchor="middle">★ DEHLA ★</text>' : ''}
      </g>
      
      <!-- Bottom Right (Inverted) -->
      <g transform="translate(90, 118) rotate(180)">
        <text x="0" y="0" font-size="16" font-weight="bold" fill="${color}" font-family="sans-serif">${card.rank}</text>
        <text x="0" y="14" font-size="14" fill="${color}">${symbol}</text>
      </g>
    </svg>
  `;
}
