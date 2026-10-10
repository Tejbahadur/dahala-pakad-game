// Dahala Pakad Lobby & Room Selection UI

import { FirebaseAdapter } from '../network/firebaseAdapter.js';

export class RoomUI {
  constructor(containerEl, callbacks) {
    this.container = containerEl;
    this.callbacks = callbacks; // { onOffline, onCreatePeer, onJoinPeer, onCreateFirebase, onJoinFirebase }
  }

  render() {
    const savedConfig = FirebaseAdapter.getSavedConfig();

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
                <h3>Local Room (WebRTC P2P) <span class="tag-free">RECOMMENDED • FREE</span></h3>
                <p>Play with friends in the same room or network. Zero setup or API keys required!</p>
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
                <h3>Remote Online (Firebase DB) ${savedConfig ? '<span class="tag-configured">CONFIGURED</span>' : ''}</h3>
                <p>Play remotely across different locations using your Firebase database URL.</p>
              </div>
              <div class="btn-group">
                <button class="btn btn-secondary btn-create-firebase">Create Online Room</button>
                <button class="btn btn-outline btn-join-firebase">Join Room Code</button>
                <button class="btn btn-icon btn-config-firebase" title="Configure Firebase Credentials">⚙️</button>
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

        <!-- Join Room Code Modal -->
        <div class="modal-overlay hidden" id="joinModal">
          <div class="modal-card">
            <h3>Enter Room Code</h3>
            <p>Ask the room host for their room code.</p>
            <input type="text" id="roomCodeInput" class="text-input" placeholder="e.g. DP-4821" maxlength="10" />
            <div class="modal-actions">
              <button class="btn btn-outline btn-cancel-join">Cancel</button>
              <button class="btn btn-primary btn-confirm-join">Join Game</button>
            </div>
          </div>
        </div>

        <!-- Firebase Config Settings Modal -->
        <div class="modal-overlay hidden" id="firebaseConfigModal">
          <div class="modal-card config-modal">
            <h3>⚙️ Firebase Database Setup</h3>
            <p class="modal-desc">
              To host remote rooms using Firebase, paste your Firebase Realtime Database URL and API key below (or use WebRTC P2P mode for zero setup!).
            </p>
            
            <div class="form-group">
              <label>Database URL (*required)</label>
              <input type="text" id="fbDbUrlInput" class="text-input text-left" placeholder="https://your-project-default-rtdb.firebaseio.com" value="${savedConfig?.databaseURL || ''}" />
            </div>

            <div class="form-group">
              <label>API Key (*required)</label>
              <input type="text" id="fbApiKeyInput" class="text-input text-left" placeholder="AIzaSy..." value="${savedConfig?.apiKey || ''}" />
            </div>

            <div class="form-group">
              <label>Project ID (optional)</label>
              <input type="text" id="fbProjectIdInput" class="text-input text-left" placeholder="your-project-id" value="${savedConfig?.projectId || ''}" />
            </div>

            <div class="modal-actions">
              <button class="btn btn-outline btn-cancel-config">Cancel</button>
              <button class="btn btn-primary btn-save-config">Save & Continue</button>
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

    // 3. Firebase Modals & Config
    const createFirebaseBtn = this.container.querySelector('.btn-create-firebase');
    const joinFirebaseBtn = this.container.querySelector('.btn-join-firebase');
    const configFirebaseBtn = this.container.querySelector('.btn-config-firebase');
    const fbModal = this.container.querySelector('#firebaseConfigModal');
    const saveConfigBtn = this.container.querySelector('.btn-save-config');
    const cancelConfigBtn = this.container.querySelector('.btn-cancel-config');

    let pendingFirebaseAction = null; // 'CREATE' or 'JOIN'

    const checkFirebaseConfigAndRun = (action) => {
      const saved = FirebaseAdapter.getSavedConfig();
      if (!saved || !saved.databaseURL) {
        pendingFirebaseAction = action;
        fbModal.classList.remove('hidden');
      } else {
        if (action === 'CREATE') {
          this.callbacks.onCreateFirebase();
        } else if (action === 'JOIN') {
          activeJoinMode = 'FIREBASE';
          joinModal.classList.remove('hidden');
        }
      }
    };

    if (createFirebaseBtn) {
      createFirebaseBtn.addEventListener('click', () => {
        checkFirebaseConfigAndRun('CREATE');
      });
    }

    if (joinFirebaseBtn) {
      joinFirebaseBtn.addEventListener('click', () => {
        checkFirebaseConfigAndRun('JOIN');
      });
    }

    if (configFirebaseBtn) {
      configFirebaseBtn.addEventListener('click', () => {
        pendingFirebaseAction = null;
        fbModal.classList.remove('hidden');
      });
    }

    if (cancelConfigBtn) {
      cancelConfigBtn.addEventListener('click', () => {
        fbModal.classList.add('hidden');
      });
    }

    if (saveConfigBtn) {
      saveConfigBtn.addEventListener('click', () => {
        const dbUrl = this.container.querySelector('#fbDbUrlInput').value.trim();
        const apiKey = this.container.querySelector('#fbApiKeyInput').value.trim();
        const projectId = this.container.querySelector('#fbProjectIdInput').value.trim();

        if (!dbUrl || !apiKey) {
          alert('Please enter both Database URL and API Key for Firebase!');
          return;
        }

        const newConfig = {
          databaseURL: dbUrl,
          apiKey: apiKey,
          projectId: projectId || dbUrl.split('.')[0].replace('https://', ''),
          authDomain: `${projectId || 'project'}.firebaseapp.com`
        };

        FirebaseAdapter.saveConfig(newConfig);
        fbModal.classList.add('hidden');

        if (pendingFirebaseAction === 'CREATE') {
          this.callbacks.onCreateFirebase();
        } else if (pendingFirebaseAction === 'JOIN') {
          activeJoinMode = 'FIREBASE';
          joinModal.classList.remove('hidden');
        }
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
