// Unified Network Manager for Dahala Pakad (Offline, PeerJS WebRTC, Firebase)

import { DahalaPakadEngine } from '../game/engine.js';
import { chooseAiMove } from '../game/ai.js';
import { PeerJSAdapter } from './peerjsAdapter.js';
import { FirebaseAdapter } from './firebaseAdapter.js';

export class NetworkManager {
  constructor(onUIStateUpdate, onUIStatusNotification) {
    this.engine = new DahalaPakadEngine();
    this.mode = 'OFFLINE'; // 'OFFLINE', 'PEERJS', 'FIREBASE'
    this.mySeat = 0;
    this.isHost = true;
    this.roomId = null;
    this.playerName = localStorage.getItem('dahala_player_name') || 'Player 1';
    this.peerAdapter = null;
    this.firebaseAdapter = null;
    this.botSeats = [1, 2, 3]; // Default to 3 bots in offline mode
    this.onUIStateUpdate = onUIStateUpdate;
    this.onUIStatusNotification = onUIStatusNotification;

    // Subscribe engine changes
    this.engine.subscribe((state, eventName, eventData) => {
      this.handleEngineEvent(state, eventName, eventData);
    });
  }

  setPlayerName(name) {
    if (!name) return;
    this.playerName = name.trim();
    localStorage.setItem('dahala_player_name', this.playerName);
    if (this.isHost) {
      this.engine.setPlayerNames({ [this.mySeat]: this.playerName });
    }
  }

  cancelGame() {
    this.onUIStatusNotification('Game cancelled by user.');
    if (this.isHost) {
      this.engine.cancelGame();
    }
    if (this.peerAdapter) {
      this.peerAdapter.disconnect();
    }
    if (this.firebaseAdapter) {
      this.firebaseAdapter.leaveRoom();
    }
  }

  // --- MODE INITIALIZATION ---

  startOfflineGame(customName = null) {
    if (customName) this.setPlayerName(customName);
    this.mode = 'OFFLINE';
    this.mySeat = 0;
    this.isHost = true;
    this.botSeats = [1, 2, 3];
    this.roomId = null;

    this.engine.setPlayerNames({
      0: this.playerName || 'Player 1',
      1: 'Bot East',
      2: 'Bot North (Partner)',
      3: 'Bot West'
    });

    this.onUIStatusNotification(`Starting Game as "${this.playerName}" vs 3 Bots...`);
    this.engine.startNewGame();
  }

  async createPeerJSRoom(customName = null) {
    if (customName) this.setPlayerName(customName);
    this.mode = 'PEERJS';
    this.isHost = true;
    this.mySeat = 0;
    this.botSeats = [];

    this.engine.setPlayerNames({ 0: this.playerName });

    this.peerAdapter = new PeerJSAdapter(
      (data, fromSeat) => this.handleNetworkMessage(data, fromSeat),
      (statusType, statusData) => this.handleNetworkStatus(statusType, statusData)
    );

    const code = await this.peerAdapter.createRoom();
    this.roomId = code;
    return code;
  }

  async joinPeerJSRoom(roomCode, customName = null) {
    if (customName) this.setPlayerName(customName);
    this.mode = 'PEERJS';
    this.isHost = false;

    this.peerAdapter = new PeerJSAdapter(
      (data, fromSeat) => this.handleNetworkMessage(data, fromSeat),
      (statusType, statusData) => this.handleNetworkStatus(statusType, statusData)
    );

    const seat = await this.peerAdapter.joinRoom(roomCode);
    this.mySeat = seat;
    this.roomId = roomCode;

    // Send player name to host
    this.peerAdapter.sendToHost({ type: 'SET_NAME', seat: this.mySeat, name: this.playerName });

    return seat;
  }

  async createFirebaseRoom(customName = null) {
    if (customName) this.setPlayerName(customName);
    this.mode = 'FIREBASE';
    this.isHost = true;
    this.mySeat = 0;

    this.engine.setPlayerNames({ 0: this.playerName });

    this.firebaseAdapter = new FirebaseAdapter(
      (remoteState) => this.handleRemoteStateSync(remoteState),
      (statusType, statusData) => this.handleNetworkStatus(statusType, statusData)
    );

    const code = await this.firebaseAdapter.createRoom();
    this.roomId = code;
    return code;
  }

  async joinFirebaseRoom(roomCode, customName = null) {
    if (customName) this.setPlayerName(customName);
    this.mode = 'FIREBASE';
    this.isHost = false;

    this.firebaseAdapter = new FirebaseAdapter(
      (remoteState) => this.handleRemoteStateSync(remoteState),
      (statusType, statusData) => this.handleNetworkStatus(statusType, statusData)
    );

    const seat = await this.firebaseAdapter.joinRoom(roomCode, this.playerName);
    this.mySeat = seat;
    this.roomId = roomCode;
    return seat;
  }

  // --- GAME ACTIONS & MESSAGES ---

  playCard(cardId) {
    if (this.isHost) {
      const result = this.engine.playCard(this.mySeat, cardId);
      if (!result.success) {
        this.onUIStatusNotification(result.error);
      }
    } else {
      const msg = { type: 'PLAY_CARD', seat: this.mySeat, cardId };
      if (this.mode === 'PEERJS') {
        this.peerAdapter.sendToHost(msg);
      }
    }
  }

  startHostGame(fillWithBots = true) {
    if (!this.isHost) return;

    if (this.mode === 'PEERJS') {
      const connectedCount = this.peerAdapter.connections.length + 1;
      this.botSeats = [];
      const botNames = ['Bot East', 'Bot North (Partner)', 'Bot West'];
      for (let i = connectedCount; i < 4; i++) {
        this.botSeats.push(i);
        this.engine.state.playerNames[i] = botNames[i - 1] || `Bot ${i + 1}`;
      }
    }

    this.engine.startNewGame();
  }

  handleNetworkMessage(message, fromSeat) {
    if (this.isHost) {
      if (message.type === 'PLAY_CARD') {
        this.engine.playCard(message.seat, message.cardId);
      } else if (message.type === 'SET_NAME') {
        this.engine.setPlayerNames({ [message.seat]: message.name });
      }
    }
  }

  handleRemoteStateSync(remoteState) {
    if (!this.isHost) {
      this.onUIStateUpdate(remoteState, this.mySeat);
    }
  }

  handleNetworkStatus(statusType, statusData) {
    this.onUIStatusNotification(`${statusType}: ${JSON.stringify(statusData)}`);
  }

  handleEngineEvent(state, eventName, eventData) {
    this.onUIStateUpdate(state, this.mySeat, eventName, eventData);

    if (this.isHost) {
      if (this.mode === 'PEERJS') {
        this.peerAdapter.broadcast({ type: 'STATE_SYNC', state });
      } else if (this.mode === 'FIREBASE') {
        this.firebaseAdapter.updateGameState(state);
      }

      if (state.phase === 'PLAYING' && !state.pendingTrickResolution && this.botSeats.includes(state.currentTurn)) {
        const botSeat = state.currentTurn;
        setTimeout(() => {
          if (this.engine.state.currentTurn === botSeat && this.engine.state.phase === 'PLAYING' && !this.engine.state.pendingTrickResolution) {
            const aiCard = chooseAiMove(this.engine.state, botSeat);
            if (aiCard) {
              this.engine.playCard(botSeat, aiCard.id);
            }
          }
        }, 700);
      }
    }
  }
}
