// Dahala Pakad Lobby & Room Selection UI

export class RoomUI {
  constructor(containerEl, callbacks) {
    this.container = containerEl;
    this.callbacks = callbacks; // { onOffline, onCreatePeer, onJoinPeer, onCreateFirebase, onJoinFirebase }
  }

  render() {
    const html = `
      <div class="lobby-backdrop">
        <div class="lobby-card">
          <div class="lobby-header">
            <h1 class="game-logo">🎴 DAHALA PAKAD</h1>
            <p class="tagline">Traditional 4-Player Indian Card Game (Dehla Pakad / Mindi Coat)</p>
          </div>

          <div class="mode-selection">
            <!-- Mode 1: Offline vs Bots -->
            <div class="mode-card featured">
              <div class="mode-icon">🤖</div>
              <div class="mode-info">
                <h3>Single Player / Offline</h3>
                <p>Play immediately against 3 smart AI bots on your mobile or PC.</p>
              </div>
              <button class="btn btn-primary btn-offline">Play vs AI Bots</button>
            </div>

            <!-- Mode 2: Local P2P Room (PeerJS / WebRTC) -->
            <div class="mode-card">
              <div class="mode-icon">📶</div>
              <div class="mode-info">
                <h3>Local Room (WebRTC P2P)</h3>
                <p>Play with friends in the same room or network. Zero setup required.</p>
              </div>
              <div class="btn-group">
                <button class="btn btn-secondary btn-create-p2p">Create P2P Room</button>
                <button class="btn btn-outline btn-join-p2p">Join Room Code</button>
              </div>
            </div>

            <!-- Mode 3: Remote Online Room (Firebase DB) -->
            <div class="mode-card">
              <div class="mode-icon">🌐</div>
              <div class="mode-info">
                <h3>Remote Online (Firebase DB)</h3>
                <p>Play remotely across different locations over mobile data.</p>
              </div>
              <div class="btn-group">
                <button class="btn btn-secondary btn-create-firebase">Create Online Room</button>
                <button class="btn btn-outline btn-join-firebase">Join Room Code</button>
              </div>
            </div>
          </div>

          <div class="rules-quick-guide">
            <h4>📖 Standard Dahala Pakad Rules Summary</h4>
            <ul>
              <li><strong>4 Players / 2 Teams:</strong> You (South) & North vs East & West.</li>
              <li><strong>Objective:</strong> Capture 10s (Dehlas). Capture all 4 tens for a <strong>Mindi Coat</strong>!</li>
              <li><strong>Cut Trump Variant:</strong> The suit of the first card played when a player breaks suit becomes the <strong>Trump Suit</strong>!</li>
              <li><strong>Sweeping Stack:</strong> Cards in the center accumulate until a player wins <strong>2 consecutive tricks</strong>!</li>
            </ul>
          </div>
        </div>

        <!-- Join Room Modal Input -->
        <div class="modal-overlay hidden" id="joinModal">
          <div class="modal-card">
            <h3>Enter Room Code</h3>
            <p>Ask the room creator for their 4-digit room code.</p>
            <input type="text" id="roomCodeInput" class="text-input" placeholder="e.g. DP-4821" maxlength="10" />
            <div class="modal-actions">
              <button class="btn btn-outline btn-cancel-join">Cancel</button>
              <button class="btn btn-primary btn-confirm-join">Join Game</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  attachEventListeners() {
    // 1. Offline Mode
    const offlineBtn = this.container.querySelector('.btn-offline');
    if (offlineBtn) {
      offlineBtn.addEventListener('click', () => {
        this.callbacks.onOffline();
      });
    }

    // 2. PeerJS Local Room
    const createP2PBtn = this.container.querySelector('.btn-create-p2p');
    if (createP2PBtn) {
      createP2PBtn.addEventListener('click', () => {
        this.callbacks.onCreatePeer();
      });
    }

    const joinP2PBtn = this.container.querySelector('.btn-join-p2p');
    const joinModal = this.container.querySelector('#joinModal');
    const confirmJoinBtn = this.container.querySelector('.btn-confirm-join');
    const cancelJoinBtn = this.container.querySelector('.btn-cancel-join');
    const roomCodeInput = this.container.querySelector('#roomCodeInput');

    let activeJoinMode = 'PEERJS';

    if (joinP2PBtn) {
      joinP2PBtn.addEventListener('click', () => {
        activeJoinMode = 'PEERJS';
        joinModal.classList.remove('hidden');
      });
    }

    // 3. Firebase Remote Room
    const createFirebaseBtn = this.container.querySelector('.btn-create-firebase');
    if (createFirebaseBtn) {
      createFirebaseBtn.addEventListener('click', () => {
        this.callbacks.onCreateFirebase();
      });
    }

    const joinFirebaseBtn = this.container.querySelector('.btn-join-firebase');
    if (joinFirebaseBtn) {
      joinFirebaseBtn.addEventListener('click', () => {
        activeJoinMode = 'FIREBASE';
        joinModal.classList.remove('hidden');
      });
    }

    if (cancelJoinBtn) {
      cancelJoinBtn.addEventListener('click', () => {
        joinModal.classList.add('hidden');
      });
    }

    if (confirmJoinBtn) {
      confirmJoinBtn.addEventListener('click', () => {
        const code = roomCodeInput.value.trim();
        if (code) {
          joinModal.classList.add('hidden');
          if (activeJoinMode === 'PEERJS') {
            this.callbacks.onJoinPeer(code);
          } else {
            this.callbacks.onJoinFirebase(code);
          }
        }
      });
    }
  }
}
