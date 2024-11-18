import { Router } from 'mediasoup/node/lib/RouterTypes';

import { Peer } from './peer';

export class Room {
  id: string;
  router: Router;
  peers: Map<string, Peer>;
  constructor(roomId: string, router: Router) {
    this.id = roomId;
    this.router = router;
    this.peers = new Map();
  }

  getRouter() {
    return this.router;
  }

  addPeer(socketId: string) {
    const peer = new Peer(socketId);
    this.peers.set(socketId, peer);
    return peer;
  }

  getPeer(socketId: string) {
    return this.peers.get(socketId);
  }

  removePeer(socketId: string) {
    const peer = this.peers.get(socketId);
    if (peer) {
      peer.close();
      this.peers.delete(socketId);
    }
  }

  close() {
    this.peers.forEach((peer) => peer.close());
    this.peers.clear();
    if (this.router) this.router.close();
  }
}
