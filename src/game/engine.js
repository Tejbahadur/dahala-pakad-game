// Dahala Pakad Game Engine & State Management

import { createDeck, shuffleDeck, sortHand } from './cards.js';
import { isLegalMove, evaluateTrickWinner, getTeam, calculateScore } from './rules.js';

export class DahalaPakadEngine {
  constructor() {
    this.trickResolutionTimeout = null;
    this.resetState();
    this.listeners = [];
  }

  resetState() {
    if (this.trickResolutionTimeout) {
      clearTimeout(this.trickResolutionTimeout);
      this.trickResolutionTimeout = null;
    }

    this.state = {
      phase: 'LOBBY',
      dealer: 3, // Player 0 leads first round
      currentTurn: 0,
      playerNames: ['Player 1', 'Bot East', 'Bot North', 'Bot West'],
      hands: { 0: [], 1: [], 2: [], 3: [] },
      currentLeadSuit: null,
      trumpSuit: null,
      trumpSetter: null,
      currentTrick: [],
      centerStack: [],
      lastTrickWinner: null,
      pendingTrickResolution: null,
      lastCompletedTrick: null,
      capturedPiles: { 0: [], 1: [] }, // Team 0 (p0+p2), Team 1 (p1+p3)
      tricksWon: { 0: 0, 1: 0, 2: 0, 3: 0 },
      roundNumber: 1,
      lastEvent: null,
      scoreSummary: null
    };
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  setPlayerNames(namesMap) {
    // namesMap: { 0: 'Alice', 1: 'Bob', 2: 'Charlie', 3: 'David' }
    for (const [seat, name] of Object.entries(namesMap)) {
      if (name) {
        this.state.playerNames[Number(seat)] = name;
      }
    }
    this.notify('NAMES_UPDATED', { playerNames: this.state.playerNames });
  }

  notify(eventName, eventData = {}) {
    this.state.lastEvent = { name: eventName, data: eventData, timestamp: Date.now() };
    for (const listener of this.listeners) {
      listener(this.state, eventName, eventData);
    }
  }

  startNewGame() {
    this.resetState();
    this.startNewRound();
  }

  cancelGame() {
    if (this.trickResolutionTimeout) {
      clearTimeout(this.trickResolutionTimeout);
      this.trickResolutionTimeout = null;
    }
    this.state.phase = 'LOBBY';
    this.notify('GAME_CANCELLED', {});
  }

  startNewRound() {
    if (this.trickResolutionTimeout) {
      clearTimeout(this.trickResolutionTimeout);
      this.trickResolutionTimeout = null;
    }

    const deck = shuffleDeck(createDeck());
    
    // Deal 13 cards to each of the 4 players
    const hands = {
      0: sortHand(deck.slice(0, 13)),
      1: sortHand(deck.slice(13, 26)),
      2: sortHand(deck.slice(26, 39)),
      3: sortHand(deck.slice(39, 52))
    };

    // First player is next to dealer
    const firstPlayer = (this.state.dealer + 1) % 4;

    this.state.phase = 'PLAYING';
    this.state.hands = hands;
    this.state.currentTurn = firstPlayer;
    this.state.currentLeadSuit = null;
    this.state.trumpSuit = null;
    this.state.trumpSetter = null;
    this.state.currentTrick = [];
    this.state.centerStack = [];
    this.state.lastTrickWinner = null;
    this.state.pendingTrickResolution = null;
    this.state.lastCompletedTrick = null;
    this.state.capturedPiles = { 0: [], 1: [] };
    this.state.tricksWon = { 0: 0, 1: 0, 2: 0, 3: 0 };
    this.state.scoreSummary = null;

    this.notify('ROUND_STARTED', { firstPlayer });
  }

  playCard(playerIndex, cardId) {
    if (this.state.phase !== 'PLAYING') {
      return { success: false, error: 'Game is not currently in PLAYING phase.' };
    }

    if (this.state.pendingTrickResolution) {
      return { success: false, error: 'Trick is currently being resolved, please wait.' };
    }

    if (this.state.currentTurn !== playerIndex) {
      return { success: false, error: `It is Player ${this.state.currentTurn}'s turn.` };
    }

    const playerHand = this.state.hands[playerIndex];
    const card = playerHand.find(c => c.id === cardId);

    if (!card) {
      return { success: false, error: 'Card not found in player hand.' };
    }

    if (!isLegalMove(playerHand, card, this.state.currentLeadSuit)) {
      return { success: false, error: 'Illegal move! You must follow suit if available.' };
    }

    // Remove played card from hand
    this.state.hands[playerIndex] = sortHand(playerHand.filter(c => c.id !== cardId));

    // Handle Lead Suit
    if (this.state.currentTrick.length === 0) {
      this.state.currentLeadSuit = card.suit;
    }

    // Handle Trump Cut / Open Break Rule
    let trumpJustSet = false;
    if (!this.state.trumpSuit && card.suit !== this.state.currentLeadSuit) {
      this.state.trumpSuit = card.suit;
      this.state.trumpSetter = playerIndex;
      trumpJustSet = true;
    }

    // Add card to current trick
    this.state.currentTrick.push({ playerIndex, card });

    this.notify('CARD_PLAYED', {
      playerIndex,
      card,
      trumpJustSet,
      trumpSuit: this.state.trumpSuit
    });

    // Check if trick is complete (4 cards played)
    if (this.state.currentTrick.length === 4) {
      const winnerIndex = evaluateTrickWinner(
        this.state.currentTrick,
        this.state.currentLeadSuit,
        this.state.trumpSuit
      );
      const winnerTeam = getTeam(winnerIndex);
      const winningItem = this.state.currentTrick.find(t => t.playerIndex === winnerIndex);

      this.state.pendingTrickResolution = {
        winnerIndex,
        winnerTeam,
        winningCard: winningItem ? winningItem.card : null,
        winnerName: this.state.playerNames[winnerIndex] || `Player ${winnerIndex + 1}`
      };

      // Notify that all 4 cards have been played and remain visible before taking the hand
      this.notify('TRICK_COMPLETED', {
        ...this.state.pendingTrickResolution,
        completedTrick: [...this.state.currentTrick]
      });

      // Maintain visible trick on the table for 2.2 seconds before collecting / taking the hand
      this.trickResolutionTimeout = setTimeout(() => {
        this.resolveTrick();
      }, 2200);
    } else {
      // Advance turn to next player
      this.state.currentTurn = (this.state.currentTurn + 1) % 4;
      this.notify('TURN_CHANGED', { currentTurn: this.state.currentTurn });
    }

    return { success: true };
  }

  resolveTrick() {
    if (this.trickResolutionTimeout) {
      clearTimeout(this.trickResolutionTimeout);
      this.trickResolutionTimeout = null;
    }

    if (this.state.currentTrick.length === 0) return;

    const winnerIndex = evaluateTrickWinner(
      this.state.currentTrick,
      this.state.currentLeadSuit,
      this.state.trumpSuit
    );

    const winnerTeam = getTeam(winnerIndex);
    this.state.tricksWon[winnerIndex]++;

    // Add current trick cards to center stack
    const trickCards = this.state.currentTrick.map(t => t.card);
    this.state.centerStack.push(...trickCards);

    let isSweep = false;
    let sweptCardsCount = 0;
    let tensCaptured = 0;

    // Check total remaining cards in hands
    const totalRemainingCards = Object.values(this.state.hands).reduce((sum, h) => sum + h.length, 0);
    const isLastTrick = totalRemainingCards === 0;

    // Consecutive win condition or Last trick condition
    if (this.state.lastTrickWinner === winnerIndex || isLastTrick) {
      // Sweep all cards in center stack to winner's team pile!
      isSweep = true;
      const sweptCards = [...this.state.centerStack];
      this.state.capturedPiles[winnerTeam].push(...sweptCards);
      sweptCardsCount = sweptCards.length;
      tensCaptured = sweptCards.filter(c => c.isTen).length;

      this.state.centerStack = [];
      this.state.lastTrickWinner = null;
    } else {
      // First trick win by this player (waiting for potential consecutive win)
      this.state.lastTrickWinner = winnerIndex;
    }

    const completedTrick = [...this.state.currentTrick];
    this.state.lastCompletedTrick = {
      cards: completedTrick,
      winnerIndex,
      winnerName: this.state.playerNames[winnerIndex] || `Player ${winnerIndex + 1}`
    };

    this.state.currentTrick = [];
    this.state.pendingTrickResolution = null;
    this.state.currentLeadSuit = null;
    this.state.currentTurn = winnerIndex;

    this.notify('TRICK_RESOLVED', {
      winnerIndex,
      winnerTeam,
      completedTrick,
      isSweep,
      isLastTrick,
      sweptCardsCount,
      tensCaptured,
      centerStackLength: this.state.centerStack.length
    });

    if (isLastTrick) {
      this.finishRound();
    } else {
      this.notify('TURN_CHANGED', { currentTurn: this.state.currentTurn });
    }
  }

  finishRound() {
    const score = calculateScore(this.state.capturedPiles);
    this.state.phase = 'ROUND_OVER';
    this.state.scoreSummary = score;

    this.notify('ROUND_OVER', { score });
  }

  getStateForPlayer(playerIndex) {
    // Hide opponent hands when sending state over network
    const sanitizedHands = {};
    for (let i = 0; i < 4; i++) {
      if (i === playerIndex) {
        sanitizedHands[i] = this.state.hands[i];
      } else {
        // Obfuscate with count of remaining cards
        sanitizedHands[i] = this.state.hands[i].map(() => ({ id: 'hidden', isHidden: true }));
      }
    }

    return {
      ...this.state,
      hands: sanitizedHands
    };
  }
}
