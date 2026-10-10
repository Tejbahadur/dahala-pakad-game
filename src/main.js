// Dahala Pakad Main Controller Entry Point

import { NetworkManager } from './network/networkManager.js';
import { RoomUI } from './ui/roomUI.js';
import { TableUI } from './ui/tableUI.js';

const appEl = document.getElementById('app');

let networkManager = null;
let roomUI = null;
let tableUI = null;

function init() {
  tableUI = new TableUI(
    appEl,
    (cardId) => {
      if (networkManager) {
        networkManager.playCard(cardId);
      }
    },
    () => {
      if (networkManager) {
        networkManager.cancelGame();
      }
      roomUI.render();
    }
  );

  networkManager = new NetworkManager(
    (state, mySeat, eventName, eventData) => {
      if (state.phase === 'LOBBY') {
        roomUI.render();
      } else {
        tableUI.render(state, mySeat, eventName, eventData);
      }
    },
    (statusMsg) => {
      console.log('[Network Status]', statusMsg);
    }
  );

  roomUI = new RoomUI(appEl, {
    onOffline: (name) => {
      networkManager.startOfflineGame(name);
    },

    onCreatePeer: async (name) => {
      try {
        const code = await networkManager.createPeerJSRoom(name);
        alert(`Room Created! Share this room code with 3 friends: ${code}`);
        networkManager.startHostGame(true);
      } catch (err) {
        alert('Failed to create PeerJS room: ' + err.message);
      }
    },

    onJoinPeer: async (code, name) => {
      try {
        await networkManager.joinPeerJSRoom(code, name);
      } catch (err) {
        alert('Failed to join PeerJS room: ' + err.message);
      }
    },

    onCreateFirebase: async (name) => {
      try {
        const code = await networkManager.createFirebaseRoom(name);
        alert(`Online Room Created! Share room code: ${code}`);
        networkManager.startHostGame(true);
      } catch (err) {
        alert('Failed to create Firebase room: ' + err.message);
      }
    },

    onJoinFirebase: async (code, name) => {
      try {
        await networkManager.joinFirebaseRoom(code, name);
      } catch (err) {
        alert('Failed to join Firebase room: ' + err.message);
      }
    }
  });

  roomUI.render();
}

window.addEventListener('DOMContentLoaded', init);
