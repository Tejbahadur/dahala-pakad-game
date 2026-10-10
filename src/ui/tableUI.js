// Dahala Pakad Table & Card Animation Render UI

import { createCardSVG, SUIT_SYMBOLS, SUIT_NAMES, SUIT_COLORS } from '../game/cards.js';
import { getPlayableCards, getTeam } from '../game/rules.js';
import { sounds } from './sound.js';
import confetti from 'canvas-confetti';

export class TableUI {
  constructor(containerEl, onPlayCardCallback) {
    this.container = containerEl;
    this.onPlayCard = onPlayCardCallback;
    this.latestState = null;
    this.mySeat = 0;
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

  getSeatLabel(absoluteSeat) {
    const relPos = this.getRelativePos(absoluteSeat);
    if (relPos === 'bottom') return 'You (South)';
    if (relPos === 'top') return 'Partner (North)';
    if (relPos === 'left') return `Opponent (West)`;
    if (relPos === 'right') return `Opponent (East)`;
    return `Player ${absoluteSeat + 1}`;
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

    const { currentTurn, trumpSuit, centerStack, capturedPiles, currentTrick, currentLeadSuit, phase, scoreSummary } = state;
    const playableCards = state.hands[mySeat] ? getPlayableCards(state.hands[mySeat], currentLeadSuit) : [];

    // Calculate score counters
    const team0Tens = (capturedPiles[0] || []).filter(c => c.isTen).length;
    const team1Tens = (capturedPiles[1] || []).filter(c => c.isTen).length;
    const myTeam = getTeam(mySeat);
    const opponentTeam = 1 - myTeam;

    const myTeamTens = myTeam === 0 ? team0Tens : team1Tens;
    const oppTeamTens = opponentTeam === 0 ? team0Tens : team1Tens;

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
        </header>

        <!-- Center Playing Table -->
        <main class="table-carpet">
          <!-- 4 Player Seats -->
          ${[0, 1, 2, 3].map(seatIndex => {
            const relPos = this.getRelativePos(seatIndex);
            const isCurrent = currentTurn === seatIndex;
            const hand = state.hands[seatIndex] || [];
            const isSelf = seatIndex === mySeat;

            return `
              <div class="player-seat seat-${relPos} ${isCurrent ? 'active-turn' : ''}">
                <div class="seat-badge">
                  <span class="avatar">${isSelf ? '👤' : (relPos === 'top' ? '🤝' : '🤖')}</span>
                  <span class="seat-name">${this.getSeatLabel(seatIndex)}</span>
                  <span class="card-count">${hand.length} cards</span>
                </div>
              </div>
            `;
          }).join('')}

          <!-- Played Trick Cards in Center -->
          <div class="center-trick-area">
            ${currentTrick.map(item => {
              const relPos = this.getRelativePos(item.playerIndex);
              return `
                <div class="played-card card-from-${relPos}">
                  ${createCardSVG(item.card, true)}
                </div>
              `;
            }).join('')}

            <!-- Center Stack Indicator -->
            ${centerStack.length > 0 ? `
              <div class="center-stack-badge">
                <span class="stack-count">${centerStack.length} CARDS IN STACK</span>
                <span class="stack-hint">Requires 2 consecutive wins to sweep!</span>
              </div>
            ` : ''}
          </div>
        </main>

        <!-- User Player Hand (Bottom Area) -->
        <footer class="user-hand-area">
          <div class="turn-prompt ${currentTurn === mySeat ? 'your-turn' : ''}">
            ${currentTurn === mySeat ? '👉 YOUR TURN! Select a card to play' : `Waiting for ${this.getSeatLabel(currentTurn)}...`}
          </div>

          <div class="cards-fan">
            ${(state.hands[mySeat] || []).map(card => {
              const playable = currentTurn === mySeat && playableCards.some(p => p.id === card.id);
              return `
                <div class="card-wrapper ${playable ? 'playable' : 'disabled'}" data-card-id="${card.id}">
                  ${createCardSVG(card, true)}
                </div>
              `;
            }).join('')}
          </div>
        </footer>

        <!-- Round/Game Over Modal -->
        ${phase === 'ROUND_OVER' && scoreSummary ? `
          <div class="modal-overlay">
            <div class="modal-card end-modal">
              <h2>${scoreSummary.winType === 'COAT' ? '👑 MINDI COAT!' : '🎉 ROUND COMPLETED!'}</h2>
              <p class="summary-text">${scoreSummary.summary}</p>

              <div class="final-score-grid">
                <div class="score-card team-0">
                  <h3>Team 1 (South & North)</h3>
                  <div class="metric"><span>Dehlas (10s):</span> <strong>${scoreSummary.tensTeam0}</strong></div>
                  <div class="metric"><span>Total Cards:</span> <strong>${scoreSummary.totalCardsTeam0}</strong></div>
                </div>
                <div class="score-card team-1">
                  <h3>Team 2 (East & West)</h3>
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

    const nextRoundBtn = this.container.querySelector('.btn-next-round');
    if (nextRoundBtn) {
      nextRoundBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }
}
