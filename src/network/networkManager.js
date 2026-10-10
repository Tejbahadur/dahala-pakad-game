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

  // --- MODE INITIALIZATION ---

  startOfflineGame() {
    this.mode = 'OFFLINE';
    this.mySeat = 0;
    this.isHost = true;
    this.botSeats = [1, 2, 3];
    this.roomId = null;

    this.onUIStatusNotification('Starting Offline Game vs 3 Bots...');
    this.engine.startNewGame();
  }

  async createPeerJSRoom() {
    this.mode = 'PEERJS';
    this.isHost = true;
    this.mySeat = 0;
    this.botSeats = []; // Will be filled if host starts game with fewer than 4 players

    this.peerAdapter = new PeerJSAdapter(
      (data, fromSeat) => this.handleNetworkMessage(data, fromSeat),
      (statusType, statusData) => this.handleNetworkStatus(statusType, statusData)
    );

    const code = await this.peerAdapter.createRoom();
    this.roomId = code;
    return code;
  }

  async joinPeerJSRoom(roomCode) {
    this.mode = 'PEERJS';
    this.isHost = false;

    this.peerAdapter = new PeerJSAdapter(
      (data, fromSeat) => this.handleNetworkMessage(data, fromSeat),
      (statusType, statusData) => this.handleNetworkStatus(statusType, statusData)
    );

    const seat = await this.peerAdapter.joinRoom(roomCode);
    this.mySeat = seat;
    this.roomId = roomCode;
    return seat;
  }

  async createFirebaseRoom(customConfig = null) {
    this.mode = 'FIREBASE';
    this.isHost = true;
    this.mySeat = 0;

    this.firebaseAdapter = new FirebaseAdapter(
      (remoteState) => this.handleRemoteStateSync(remoteState),
      (statusType, statusData) => this.handleNetworkStatus(statusType, statusData)
    );

    const code = await this.firebaseAdapter.createRoom();
    this.roomId = code;
    return code;
  }

  async joinFirebaseRoom(roomCode, playerName, customConfig = null) {
    this.mode = 'FIREBASE';
    this.isHost = false;

    this.firebaseAdapter = new FirebaseAdapter(
      (remoteState) => this.handleRemoteStateSync(remoteState),
      (statusType, statusData) => this.handleNetworkStatus(statusType, statusData)
    );

    const seat = await this.firebaseAdapter.joinRoom(roomCode, playerName);
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
      // Send play action to Host
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
      for (let i = connectedCount; i < 4; i++) {
        this.botSeats.push(i);
      }
    }

    this.engine.startNewGame();
  }

  handleNetworkMessage(message, fromSeat) {
    if (this.isHost && message.type === 'PLAY_CARD') {
      const result = this.engine.playCard(message.seat, message.cardId);
      if (!result.success && message.seat === fromSeat) {
        // Send error back to player
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
    // 1. Send state update to UI
    this.onUIStateUpdate(state, this.mySeat, eventName, eventData);

    // 2. Broadcast state over network if Host
    if (this.isHost) {
      if (this.mode === 'PEERJS') {
        this.peerAdapter.broadcast({ type: 'STATE_SYNC', state });
      } else if (this.mode === 'FIREBASE') {
        this.firebaseAdapter.updateGameState(state);
      }

      // 3. Trigger Bot Turn if current turn belongs to a bot seat
      if (state.phase === 'PLAYING' && this.botSeats.includes(state.currentTurn)) {
        const botSeat = state.currentTurn;
        // Small delay for natural feel
        setTimeout(() => {
          if (this.engine.state.currentTurn === botSeat && this.engine.state.phase === 'PLAYING') {
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
