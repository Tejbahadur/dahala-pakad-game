// Dahala Pakad Table & Card Animation Render UI

import { createCardSVG, SUIT_SYMBOLS, SUIT_NAMES, SUIT_COLORS } from '../game/cards.js';
import { getPlayableCards, getTeam } from '../game/rules.js';
import { sounds } from './sound.js';
import confetti from 'canvas-confetti';

export class TableUI {
  constructor(containerEl, onPlayCardCallback, onCancelGameCallback) {
    this.container = containerEl;
    this.onPlayCard = onPlayCardCallback;
    this.onCancelGame = onCancelGameCallback;
    this.latestState = null;
    this.mySeat = 0;
    this.showLastHandModal = false;
  }

  /**
   * Translates absolute seat index (0..3) to relative UI position ('bottom', 'right', 'top', 'left')
   */
  getRelativePos(absoluteSeat) {
    const diff = (absoluteSeat - this.mySeat + 4) % 4;
    switch (diff) {
      case 0: return 'bottom';
      case 1: return 'right';
      case 2: return 'top';
      case 3: return 'left';
    }
  }

  getSeatLabel(absoluteSeat, playerNames = []) {
    const customName = playerNames[absoluteSeat];
    const relPos = this.getRelativePos(absoluteSeat);
    let posTag = '';
    if (relPos === 'bottom') posTag = ' (You)';
    if (relPos === 'top') posTag = ' (Partner)';

    return (customName || `Player ${absoluteSeat + 1}`) + posTag;
  }

  render(state, mySeat, eventName = null, eventData = null) {
    this.latestState = state;
    this.mySeat = mySeat;

    if (eventName === 'CARD_PLAYED') sounds.playCard();
    if (eventName === 'CARD_PLAYED' && eventData?.trumpJustSet) sounds.playTrumpReveal();
    if (eventName === 'TRICK_RESOLVED' && eventData?.isSweep) sounds.playSweep();
    if (eventName === 'ROUND_OVER') {
      sounds.playVictory();
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }

    const {
      currentTurn,
      trumpSuit,
      centerStack = [],
      capturedPiles = { 0: [], 1: [] },
      currentTrick = [],
      currentLeadSuit,
      phase,
      scoreSummary,
      playerNames = [],
      pendingTrickResolution = null,
      lastCompletedTrick = null
    } = state;

    const isResolving = !!pendingTrickResolution;
    const playableCards = (!isResolving && state.hands[mySeat])
      ? getPlayableCards(state.hands[mySeat], currentLeadSuit)
      : [];

    // Calculate score counters
    const team0Tens = (capturedPiles[0] || []).filter(c => c.isTen).length;
    const team1Tens = (capturedPiles[1] || []).filter(c => c.isTen).length;
    const myTeam = getTeam(mySeat);
    const opponentTeam = 1 - myTeam;

    const myTeamTens = myTeam === 0 ? team0Tens : team1Tens;
    const oppTeamTens = opponentTeam === 0 ? team0Tens : team1Tens;

    let turnPromptText = '';
    if (isResolving) {
      const winnerName = pendingTrickResolution.winnerIndex === mySeat
        ? 'You'
        : (playerNames[pendingTrickResolution.winnerIndex] || `Player ${pendingTrickResolution.winnerIndex + 1}`);
      turnPromptText = `⏳ Hand completed! ${winnerName} takes the hand...`;
    } else if (currentTurn === mySeat) {
      turnPromptText = '👉 YOUR TURN! Select a card to play';
    } else {
      turnPromptText = `Waiting for ${this.getSeatLabel(currentTurn, playerNames)}...`;
    }

    const html = `
      <div class="table-container">
        <!-- Top Status Bar & Scoreboard -->
        <header class="game-header">
          <div class="brand-title">
            <span class="game-name">DAHALA PAKAD</span>
            <span class="rule-badge">Standard Cut-Trump</span>
          </div>

          <div class="score-pill">
            <div class="score-team my-team">
              <span class="label">MY TEAM</span>
              <span class="tens-count">${myTeamTens} / 4 DEHLAS</span>
            </div>
            <div class="vs-divider">VS</div>
            <div class="score-team opp-team">
              <span class="label">OPPONENTS</span>
              <span class="tens-count">${oppTeamTens} / 4 DEHLAS</span>
            </div>
          </div>

          <!-- Trump Suit Indicator -->
          <div class="trump-badge ${trumpSuit ? 'set' : 'unset'}">
            <span class="trump-label">TRUMP (HUKAM):</span>
            ${trumpSuit ? `
              <span class="trump-icon" style="color: ${SUIT_COLORS[trumpSuit]}">
                ${SUIT_SYMBOLS[trumpSuit]} ${SUIT_NAMES[trumpSuit]}
              </span>
            ` : `<span class="trump-icon unset">Play off-suit to cut!</span>`}
          </div>

          <!-- Action Buttons -->
          <div class="header-actions">
            ${lastCompletedTrick ? `
              <button class="btn btn-outline btn-sm btn-view-last-hand" title="View cards placed in the last hand">
                👁️ Last Hand
              </button>
            ` : ''}
            <button class="btn btn-outline btn-cancel-game" title="Cancel & Exit Game">🚪 Exit Game</button>
          </div>
        </header>

        <!-- Center Playing Table -->
        <main class="table-carpet">
          <!-- Stack Panel placed at top-right corner of carpet -->
          ${centerStack.length > 0 ? `
            <div class="table-stack-panel">
              <span class="stack-count">🗂️ ${centerStack.length} CARDS IN STACK</span>
              <span class="stack-hint">Requires 2 consecutive wins to sweep!</span>
            </div>
          ` : ''}

          <!-- 4 Player Seats -->
          ${[0, 1, 2, 3].map(seatIndex => {
            const relPos = this.getRelativePos(seatIndex);
            const isCurrent = currentTurn === seatIndex && !isResolving;
            const hand = state.hands[seatIndex] || [];
            const isSelf = seatIndex === mySeat;

            return `
              <div class="player-seat seat-${relPos} ${isCurrent ? 'active-turn' : ''}">
                <div class="seat-badge">
                  <span class="avatar">${isSelf ? '👤' : (relPos === 'top' ? '🤝' : '🤖')}</span>
                  <span class="seat-name">${this.getSeatLabel(seatIndex, playerNames)}</span>
                  <span class="card-count">${hand.length} cards</span>
                </div>
              </div>
            `;
          }).join('')}

          <!-- Played Trick Cards in Center -->
          <div class="center-trick-area">
            ${currentTrick.map(item => {
              const relPos = this.getRelativePos(item.playerIndex);
              const isWinner = isResolving && pendingTrickResolution.winnerIndex === item.playerIndex;
              const seatLabel = this.getSeatLabel(item.playerIndex, playerNames);
              return `
                <div class="played-card card-from-${relPos} ${isWinner ? 'winning-play' : ''}">
                  <div class="played-by-tag ${isWinner ? 'winner-tag' : ''}">
                    ${isWinner ? '👑 ' : ''}${seatLabel}
                  </div>
                  ${createCardSVG(item.card, true)}
                  ${isWinner ? '<div class="hand-winner-pill">★ HAND WINNER ★</div>' : ''}
                </div>
              `;
            }).join('')}

            <!-- Trick Winner Announcement Banner before taking hand -->
            ${isResolving ? `
              <div class="trick-resolution-toast ${pendingTrickResolution.winnerTeam === myTeam ? 'my-team' : 'opp-team'}">
                <span class="toast-title">
                  ${pendingTrickResolution.winnerIndex === mySeat
                    ? '🎉 You won this hand!'
                    : (pendingTrickResolution.winnerTeam === myTeam
                      ? `🤝 Partner (${pendingTrickResolution.winnerName}) won this hand!`
                      : `👑 ${pendingTrickResolution.winnerName} won this hand!`)}
                </span>
                <span class="toast-card-desc">
                  Winning card: <strong>${pendingTrickResolution.winningCard?.rank}${SUIT_SYMBOLS[pendingTrickResolution.winningCard?.suit]}</strong>
                </span>
              </div>
            ` : ''}
          </div>
        </main>

        <!-- User Player Hand (Bottom Area) -->
        <footer class="user-hand-area">
          <div class="turn-prompt ${currentTurn === mySeat && !isResolving ? 'your-turn' : ''} ${isResolving ? 'resolving-turn' : ''}">
            ${turnPromptText}
          </div>

          <div class="cards-fan">
            ${(state.hands[mySeat] || []).map(card => {
              const playable = !isResolving && currentTurn === mySeat && playableCards.some(p => p.id === card.id);
              return `
                <div class="card-wrapper ${playable ? 'playable' : 'disabled'}" data-card-id="${card.id}">
                  ${createCardSVG(card, true)}
                </div>
              `;
            }).join('')}
          </div>
        </footer>

        <!-- View Last Hand Modal -->
        ${this.showLastHandModal && lastCompletedTrick ? `
          <div class="modal-overlay last-hand-overlay">
            <div class="modal-card last-hand-modal">
              <div class="modal-header-bar">
                <h3>📜 Cards Placed in Last Hand</h3>
                <button class="btn-close-last-hand" aria-label="Close">✕</button>
              </div>
              <p class="modal-sub">Taken by: <strong>${lastCompletedTrick.winnerName}</strong></p>
              
              <div class="last-hand-cards-grid">
                ${lastCompletedTrick.cards.map(item => {
                  const isWinner = item.playerIndex === lastCompletedTrick.winnerIndex;
                  return `
                    <div class="last-hand-card-col ${isWinner ? 'winner-col' : ''}">
                      <span class="player-title">${this.getSeatLabel(item.playerIndex, playerNames)}</span>
                      <div class="card-box">
                        ${createCardSVG(item.card, true)}
                      </div>
                      ${isWinner ? '<span class="winner-crown-label">👑 Hand Winner</span>' : ''}
                    </div>
                  `;
                }).join('')}
              </div>

              <button class="btn btn-primary btn-close-last-hand-btn">Back to Table</button>
            </div>
          </div>
        ` : ''}

        <!-- Round/Game Over Modal -->
        ${phase === 'ROUND_OVER' && scoreSummary ? `
          <div class="modal-overlay">
            <div class="modal-card end-modal">
              <h2>${scoreSummary.winType === 'COAT' ? '👑 MINDI COAT!' : '🎉 ROUND COMPLETED!'}</h2>
              <p class="summary-text">${scoreSummary.summary}</p>

              <div class="final-score-grid">
                <div class="score-card team-0">
                  <h3>Team 1 (${playerNames[0] || 'P1'} & ${playerNames[2] || 'P3'})</h3>
                  <div class="metric"><span>Dehlas (10s):</span> <strong>${scoreSummary.tensTeam0}</strong></div>
                  <div class="metric"><span>Total Cards:</span> <strong>${scoreSummary.totalCardsTeam0}</strong></div>
                </div>
                <div class="score-card team-1">
                  <h3>Team 2 (${playerNames[1] || 'P2'} & ${playerNames[3] || 'P4'})</h3>
                  <div class="metric"><span>Dehlas (10s):</span> <strong>${scoreSummary.tensTeam1}</strong></div>
                  <div class="metric"><span>Total Cards:</span> <strong>${scoreSummary.totalCardsTeam1}</strong></div>
                </div>
              </div>

              <button class="btn btn-primary btn-large btn-next-round">Play Next Round</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  attachEventListeners() {
    const cardElements = this.container.querySelectorAll('.card-wrapper.playable');
    cardElements.forEach(el => {
      el.addEventListener('click', () => {
        const cardId = el.getAttribute('data-card-id');
        if (cardId && this.onPlayCard) {
          this.onPlayCard(cardId);
        }
      });
    });

    const cancelGameBtn = this.container.querySelector('.btn-cancel-game');
    if (cancelGameBtn) {
      cancelGameBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel and exit the current game?')) {
          if (this.onCancelGame) this.onCancelGame();
        }
      });
    }

    const nextRoundBtn = this.container.querySelector('.btn-next-round');
    if (nextRoundBtn) {
      nextRoundBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }

    const viewLastHandBtn = this.container.querySelector('.btn-view-last-hand');
    if (viewLastHandBtn) {
      viewLastHandBtn.addEventListener('click', () => {
        this.showLastHandModal = true;
        this.render(this.latestState, this.mySeat);
      });
    }

    const closeLastHandBtns = this.container.querySelectorAll('.btn-close-last-hand, .btn-close-last-hand-btn');
    closeLastHandBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.showLastHandModal = false;
        this.render(this.latestState, this.mySeat);
      });
    });
  }
}
