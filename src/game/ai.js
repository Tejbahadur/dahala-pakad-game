// Dahala Pakad Smart AI Engine

import { getPlayableCards, evaluateTrickWinner, getTeam } from './rules.js';

/**
 * Determines the best move for an AI player.
 * @param {object} gameState - Current state of the game
 * @param {number} aiPlayerIndex - Player index (0..3)
 * @returns {object} Card to play
 */
export function chooseAiMove(gameState, aiPlayerIndex) {
  const hand = gameState.hands[aiPlayerIndex];
  const playable = getPlayableCards(hand, gameState.currentLeadSuit);

  if (playable.length === 1) {
    return playable[0]; // Only one legal choice
  }

  const currentTrick = gameState.currentTrick; // Array of { playerIndex, card }
  const leadSuit = gameState.currentLeadSuit;
  const trumpSuit = gameState.trumpSuit;
  const myTeam = getTeam(aiPlayerIndex);

  // CASE 1: Leading the trick
  if (currentTrick.length === 0) {
    // Prefer leading non-Ten Aces or Kings to secure tricks
    const highCards = playable.filter(c => (c.rank === 'A' || c.rank === 'K') && !c.isTen);
    if (highCards.length > 0) {
      return highCards[Math.floor(Math.random() * highCards.length)];
    }

    // Lead low non-Ten cards
    const lowNonTens = playable.filter(c => !c.isTen);
    if (lowNonTens.length > 0) {
      return lowNonTens.sort((a, b) => a.value - b.value)[0];
    }

    // Otherwise play lowest card
    return playable.sort((a, b) => a.value - b.value)[0];
  }

  // CASE 2: Following or Cutting
  // Who is currently winning the trick?
  const currentWinnerIndex = evaluateTrickWinner(currentTrick, leadSuit, trumpSuit);
  const isPartnerWinning = getTeam(currentWinnerIndex) === myTeam;

  // Subcase A: Partner is winning the trick!
  if (isPartnerWinning) {
    // Slough a Ten if playable to feed points to partner!
    const tensInHand = playable.filter(c => c.isTen);
    if (tensInHand.length > 0) {
      return tensInHand[0];
    }

    // Otherwise throw lowest card
    return playable.sort((a, b) => a.value - b.value)[0];
  }

  // Subcase B: Opponent is currently winning
  // Can we win this trick with our playable cards?
  const winningPlayableCards = playable.filter(card => {
    const simulatedTrick = [...currentTrick, { playerIndex: aiPlayerIndex, card }];
    // Evaluate with potential trump cut
    let simTrump = trumpSuit;
    if (!simTrump && card.suit !== leadSuit) {
      simTrump = card.suit;
    }
    const simWinner = evaluateTrickWinner(simulatedTrick, leadSuit, simTrump);
    return simWinner === aiPlayerIndex;
  });

  if (winningPlayableCards.length > 0) {
    // If a Ten is in the trick or accumulated center stack, prioritize winning!
    const centerTens = gameState.centerStack.filter(c => c.isTen).length;
    const trickTens = currentTrick.filter(t => t.card.isTen).length;

    // Pick lowest card that wins the trick
    const sortedWinners = winningPlayableCards.sort((a, b) => a.value - b.value);
    
    // If high value in center or trick, definitely win it
    if (centerTens > 0 || trickTens > 0 || Math.random() < 0.8) {
      return sortedWinners[0];
    }
  }

  // Cannot win or choosing to save cards: preserve Tens, play lowest non-Ten card
  const nonTens = playable.filter(c => !c.isTen);
  if (nonTens.length > 0) {
    return nonTens.sort((a, b) => a.value - b.value)[0];
  }

  // Fallback: lowest card
  return playable.sort((a, b) => a.value - b.value)[0];
}
