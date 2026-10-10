// Firebase Realtime Database Adapter for Remote Multiplayer

import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, update, remove, get } from 'firebase/database';

export class FirebaseAdapter {
  constructor(onStateChangeCallback, onStatusCallback) {
    this.app = null;
    this.db = null;
    this.roomRef = null;
    this.roomId = null;
    this.mySeat = null;
    this.isHost = false;
    this.onStateChange = onStateChangeCallback;
    this.onStatus = onStatusCallback;
  }

  static getSavedConfig() {
    try {
      const saved = localStorage.getItem('dahala_firebase_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read saved Firebase config from localStorage', e);
    }
    return null;
  }

  static saveConfig(config) {
    try {
      localStorage.setItem('dahala_firebase_config', JSON.stringify(config));
    } catch (e) {
      console.warn('Could not save Firebase config to localStorage', e);
    }
  }

  init(customConfig = null) {
    const firebaseConfig = customConfig || FirebaseAdapter.getSavedConfig();

    if (!firebaseConfig || !firebaseConfig.databaseURL) {
      throw new Error('MISSING_CONFIG');
    }

    if (!getApps().length) {
      this.app = initializeApp(firebaseConfig);
    } else {
      this.app = getApps()[0];
    }

    this.db = getDatabase(this.app);
  }

  async createRoom(customRoomCode = null, customConfig = null) {
    this.init(customConfig);

    const code = customRoomCode || 'DP-' + Math.floor(1000 + Math.random() * 9000);
    this.roomId = code;
    this.isHost = true;
    this.mySeat = 0;

    this.roomRef = ref(this.db, `rooms/${this.roomId}`);

    const initialRoomData = {
      createdAt: Date.now(),
      players: {
        0: { name: 'Player 1 (Host)', seat: 0, connected: true }
      },
      playerCount: 1,
      gameState: null
    };

    try {
      await set(this.roomRef, initialRoomData);
    } catch (err) {
      if (err.message.includes('PERMISSION_DENIED')) {
        throw new Error('Firebase Database Permission Denied! Ensure your Firebase Realtime Database rules allow read/write.');
      }
      throw err;
    }

    this.listenToRoom();
    this.onStatus('ROOM_CREATED', { roomId: this.roomId, seat: 0 });
    return this.roomId;
  }

  async joinRoom(roomCode, playerName = 'Player', customConfig = null) {
    this.init(customConfig);

    const code = roomCode.trim().toUpperCase();
    this.roomId = code;
    this.isHost = false;

    this.roomRef = ref(this.db, `rooms/${this.roomId}`);
    
    let snapshot;
    try {
      snapshot = await get(this.roomRef);
    } catch (err) {
      if (err.message.includes('PERMISSION_DENIED')) {
        throw new Error('Firebase Database Permission Denied! Ensure your Firebase Realtime Database rules allow read/write.');
      }
      throw err;
    }

    if (!snapshot.exists()) {
      throw new Error(`Room code "${code}" not found in Firebase Database!`);
    }

    const roomData = snapshot.val();
    const existingPlayers = roomData.players || {};
    const count = Object.keys(existingPlayers).length;

    if (count >= 4) {
      throw new Error('Room is already full (4 players)!');
    }

    // Assign lowest free seat index
    let assignedSeat = -1;
    for (let i = 0; i < 4; i++) {
      if (!existingPlayers[i]) {
        assignedSeat = i;
        break;
      }
    }

    this.mySeat = assignedSeat;

    // Register player
    await update(ref(this.db, `rooms/${this.roomId}/players/${assignedSeat}`), {
      name: `${playerName} (P${assignedSeat + 1})`,
      seat: assignedSeat,
      connected: true
    });

    await update(ref(this.db, `rooms/${this.roomId}`), {
      playerCount: count + 1
    });

    this.listenToRoom();
    this.onStatus('SEAT_ASSIGNED', { seat: assignedSeat, roomId: this.roomId });
    return assignedSeat;
  }

  listenToRoom() {
    onValue(this.roomRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.val();

      if (data.gameState) {
        this.onStateChange(data.gameState);
      }

      this.onStatus('ROOM_UPDATED', {
        playerCount: data.playerCount || 0,
        players: data.players || {}
      });
    });
  }

  async updateGameState(state) {
    if (!this.roomRef) return;
    try {
      await update(ref(this.db, `rooms/${this.roomId}`), {
        gameState: state,
        lastUpdated: Date.now()
      });
    } catch (err) {
      console.error('Failed to update game state to Firebase:', err);
    }
  }

  async leaveRoom() {
    if (this.roomRef && this.mySeat !== null) {
      await remove(ref(this.db, `rooms/${this.roomId}/players/${this.mySeat}`));
    }
  }
}
