// PeerJS WebRTC P2P Networking Adapter for Dahala Pakad

import { Peer } from 'peerjs';

export class PeerJSAdapter {
  constructor(onMessageCallback, onStatusCallback) {
    this.peer = null;
    this.connections = []; // For Host: array of DataConnection to peers
    this.hostConnection = null; // For Client: DataConnection to Host
    this.isHost = false;
    this.mySeat = 0;
    this.roomId = '';
    this.onMessage = onMessageCallback;
    this.onStatus = onStatusCallback;
  }

  createRoom(customRoomId = null) {
    return new Promise((resolve, reject) => {
      this.isHost = true;
      this.mySeat = 0;
      const roomCode = customRoomId || 'DP-' + Math.floor(1000 + Math.random() * 9000);
      this.roomId = roomCode;

      this.peer = new Peer(roomCode, {
        debug: 1
      });

      this.peer.on('open', (id) => {
        this.onStatus('ROOM_CREATED', { roomId: id, seat: 0 });
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        this.handleNewClientConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS Host Error:', err);
        if (err.type === 'unavailable-id') {
          // Retry with fresh ID
          this.createRoom().then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });
    });
  }

  handleNewClientConnection(conn) {
    // Assign seat based on count of connected peers
    const assignedSeat = this.connections.length + 1;
    if (assignedSeat > 3) {
      conn.send({ type: 'ROOM_FULL' });
      conn.close();
      return;
    }

    conn.on('open', () => {
      this.connections.push({ seat: assignedSeat, conn });
      conn.send({
        type: 'SEAT_ASSIGNED',
        seat: assignedSeat,
        roomId: this.roomId
      });

      this.onStatus('PLAYER_JOINED', { seat: assignedSeat, totalPlayers: this.connections.length + 1 });
    });

    conn.on('data', (data) => {
      this.onMessage(data, assignedSeat);
    });

    conn.on('close', () => {
      this.connections = this.connections.filter(c => c.conn !== conn);
      this.onStatus('PLAYER_LEFT', { seat: assignedSeat });
    });
  }

  joinRoom(roomId) {
    return new Promise((resolve, reject) => {
      this.isHost = false;
      this.roomId = roomId.trim().toUpperCase();

      // Create peer with random ID
      this.peer = new Peer({ debug: 1 });

      this.peer.on('open', () => {
        const conn = this.peer.connect(this.roomId, { reliable: true });
        this.hostConnection = conn;

        conn.on('open', () => {
          this.onStatus('CONNECTED_TO_HOST', { roomId: this.roomId });
        });

        conn.on('data', (data) => {
          if (data.type === 'SEAT_ASSIGNED') {
            this.mySeat = data.seat;
            this.onStatus('SEAT_ASSIGNED', { seat: data.seat, roomId: this.roomId });
            resolve(data.seat);
          } else {
            this.onMessage(data, 0); // From Host
          }
        });

        conn.on('error', (err) => {
          reject(err);
        });

        conn.on('close', () => {
          this.onStatus('DISCONNECTED', {});
        });
      });

      this.peer.on('error', (err) => {
        reject(err);
      });
    });
  }

  broadcast(message) {
    if (this.isHost) {
      for (const item of this.connections) {
        if (item.conn && item.conn.open) {
          item.conn.send(message);
        }
      }
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(message);
    }
  }

  sendToHost(message) {
    if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(message);
    }
  }

  disconnect() {
    if (this.peer) {
      this.peer.destroy();
    }
  }
}
