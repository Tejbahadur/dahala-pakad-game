// Dahala Pakad Main Controller Entry Point

import { NetworkManager } from './network/networkManager.js';
import { RoomUI } from './ui/roomUI.js';
import { TableUI } from './ui/tableUI.js';

const appEl = document.getElementById('app');

let networkManager = null;
let roomUI = null;
let tableUI = null;

function init() {
  tableUI = new TableUI(appEl, (cardId) => {
    if (networkManager) {
      networkManager.playCard(cardId);
    }
  });

  networkManager = new NetworkManager(
    (state, mySeat, eventName, eventData) => {
      tableUI.render(state, mySeat, eventName, eventData);
    },
    (statusMsg) => {
      console.log('[Network Status]', statusMsg);
    }
  );

  roomUI = new RoomUI(appEl, {
    onOffline: () => {
      networkManager.startOfflineGame();
    },

    onCreatePeer: async () => {
      try {
        const code = await networkManager.createPeerJSRoom();
        alert(`Room Created! Share this code with 3 friends: ${code}`);
        networkManager.startHostGame(true);
      } catch (err) {
        alert('Failed to create PeerJS room: ' + err.message);
      }
    },

    onJoinPeer: async (code) => {
      try {
        await networkManager.joinPeerJSRoom(code);
      } catch (err) {
        alert('Failed to join PeerJS room: ' + err.message);
      }
    },

    onCreateFirebase: async () => {
      try {
        const code = await networkManager.createFirebaseRoom();
        alert(`Online Room Created! Share room code: ${code}`);
        networkManager.startHostGame(true);
      } catch (err) {
        alert('Failed to create Firebase room: ' + err.message);
      }
    },

    onJoinFirebase: async (code) => {
      try {
        await networkManager.joinFirebaseRoom(code, 'Player');
      } catch (err) {
        alert('Failed to join Firebase room: ' + err.message);
      }
    }
  });

  roomUI.render();
}

window.addEventListener('DOMContentLoaded', init);
