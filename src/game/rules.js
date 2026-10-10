// Dahala Pakad Pure Rule Validation & Evaluation Logic

/**
 * Returns which cards in player's hand are legal to play.
 */
export function getPlayableCards(hand, leadSuit) {
  if (!leadSuit) {
    return [...hand]; // First card in trick can be any card
  }

  const matchingSuitCards = hand.filter(card => card.suit === leadSuit);
  if (matchingSuitCards.length > 0) {
    return matchingSuitCards; // Must follow lead suit if available
  }

  // Otherwise, can play any card (including trump cut card)
  return [...hand];
}

/**
 * Validates if playing a specific card is legal.
 */
export function isLegalMove(hand, cardToPlay, leadSuit) {
  const playable = getPlayableCards(hand, leadSuit);
  return playable.some(c => c.id === cardToPlay.id);
}

/**
 * Evaluates the winner of a single completed trick.
 * @param {Array<{playerIndex: number, card: object}>} trickCards - 4 cards played in order
 * @param {string} leadSuit - Suit of the first played card
 * @param {string|null} trumpSuit - Currently set trump suit (or null)
 * @returns {number} playerIndex of the trick winner
 */
export function evaluateTrickWinner(trickCards, leadSuit, trumpSuit) {
  let winningPlay = trickCards[0];

  for (let i = 1; i < trickCards.length; i++) {
    const candidate = trickCards[i];
    const currentBestCard = winningPlay.card;
    const candCard = candidate.card;

    if (trumpSuit) {
      // If current best is NOT trump, but candidate IS trump -> candidate wins
      if (currentBestCard.suit !== trumpSuit && candCard.suit === trumpSuit) {
        winningPlay = candidate;
        continue;
      }
      // If both are trump -> higher rank wins
      if (currentBestCard.suit === trumpSuit && candCard.suit === trumpSuit) {
        if (candCard.value > currentBestCard.value) {
          winningPlay = candidate;
        }
        continue;
      }
      // If current best IS trump, but candidate is NOT trump -> current best stays
      if (currentBestCard.suit === trumpSuit && candCard.suit !== trumpSuit) {
        continue;
      }
    }

    // Standard Lead Suit comparison (when neither card is trump or trump is unset)
    if (candCard.suit === leadSuit) {
      if (currentBestCard.suit !== leadSuit || candCard.value > currentBestCard.value) {
        winningPlay = candidate;
      }
    }
  }

  return winningPlay.playerIndex;
}

/**
 * Team assignment:
 * Players 0 & 2 = Team 0
 * Players 1 & 3 = Team 1
 */
export function getTeam(playerIndex) {
  return playerIndex % 2; // 0 or 1
}

/**
 * Calculates game outcome and score breakdown
 */
export function calculateScore(teamCapturedPiles) {
  const team0Cards = teamCapturedPiles[0] || [];
  const team1Cards = teamCapturedPiles[1] || [];

  const tensTeam0 = team0Cards.filter(c => c.isTen).length;
  const tensTeam1 = team1Cards.filter(c => c.isTen).length;

  let winnerTeam = null;
  let winType = 'NORMAL'; // 'NORMAL', 'COAT', 'TIE'
  let summary = '';

  if (tensTeam0 > tensTeam1) {
    winnerTeam = 0;
    if (tensTeam0 === 4) {
      winType = 'COAT';
      summary = 'Team 1 (South & North) delivered a COAT (Mindi Coat)! Captured all 4 Dehlas!';
    } else {
      summary = `Team 1 (South & North) won with ${tensTeam0} Dehlas against ${tensTeam1}!`;
    }
  } else if (tensTeam1 > tensTeam0) {
    winnerTeam = 1;
    if (tensTeam1 === 4) {
      winType = 'COAT';
      summary = 'Team 2 (East & West) delivered a COAT (Mindi Coat)! Captured all 4 Dehlas!';
    } else {
      summary = `Team 2 (East & West) won with ${tensTeam1} Dehlas against ${tensTeam0}!`;
    }
  } else {
    // 2-2 Tie in Tens! Winner decided by total captured cards
    if (team0Cards.length > team1Cards.length) {
      winnerTeam = 0;
      summary = `Tie in Dehlas (2-2)! Team 1 won on total cards captured (${team0Cards.length} vs ${team1Cards.length}).`;
    } else if (team1Cards.length > team0Cards.length) {
      winnerTeam = 1;
      summary = `Tie in Dehlas (2-2)! Team 2 won on total cards captured (${team1Cards.length} vs ${team0Cards.length}).`;
    } else {
      winnerTeam = null;
      winType = 'TIE';
      summary = 'Complete Tie! Equal Dehlas (2-2) and equal total cards captured!';
    }
  }

  return {
    tensTeam0,
    tensTeam1,
    totalCardsTeam0: team0Cards.length,
    totalCardsTeam1: team1Cards.length,
    winnerTeam,
    winType,
    summary
  };
}
