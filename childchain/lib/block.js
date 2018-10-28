const SparseMerkleTree = require('./smt');

const SMT_DEPTH = 16;

/*
* Only concerns for latest raw Block
* Older generated blocks are basically on leveldb
*/
class Block {
  
  constructor(number) {
    this.id = null;
    this.number = number;
    this.hash = null;
    this.prevhash = null;
    this.txs_root = null;
    this.txs = [];
    this.timestamp = Date.now();
    this.nonce = null;
    this.gaslimit = 0;
    this.gasused = 0;
    this.tree = null;
  }

  appendTx(tx) {
    this.txs.push(tx);
  }

  getTxIndex(tx) {
    for(var i = 0;i < this.txs.length;i++) {
      if(Buffer.compare(this.txs[i].hash(), tx.hash()) == 0) {
        return i;
      }
    }
    return -1;
  }

  createTree() {
    if(this.tree !== null) return this.tree;
    const leaf = Array.from(Array(Math.pow(2, SMT_DEPTH)), (item, index) => null);
    this.txs.forEach(tx=>{
      tx.outputs.forEach((o) => {
        o.value.forEach((uid) => {
          leaf[uid] = tx.merkleHash()
        })
      })
    })
    this.tree = new SparseMerkleTree(SMT_DEPTH, leaf);
    return this.tree;
  }

  createCoinProof(uid) {
    const tree = this.createTree();
    return tree.proof(uid);
  }

  createTXOProof(txo) {
    const uids = txo.outputs.reduce((uids, o) => {
      return uids.concat(o.value);
    }, []);
    const tree = this.createTree();
    return uids.map((uid) => tree.proof(uid));
  }

  merkleHash() {
    const tree = this.createTree();
    return tree.root();
  }

  toString() {
    return JSON.stringify({
      id: this.id,
      number: this.number,
      hash: this.hash,
      prevhash: this.prevhash,
      txs_root: this.txs_root,
      txs: this.txs,
      timestamp: this.timestamp,
      nonce: this.nonce,
      gaslimit: this.gaslimit,
      gasused: this.gasused
    })
  }

}

module.exports = Block
