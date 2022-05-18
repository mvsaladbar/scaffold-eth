import * as ethers from "ethers";
import { signTypedData_v4 } from "eth-sig-util";
import { getChainData } from "../helpers/utilities";
import { setLocal, getLocal } from "../helpers/local";
import {
  ENTROPY_KEY,
  MNEMONIC_KEY,
  DEFAULT_ACTIVE_INDEX,
  DEFAULT_CHAIN_ID,
} from "../constants";

import walletconnectLogo from "../walletconnect-logo.png"
import { NETWORKS, ETH_STANDARD_PATH } from "../constants";
import { getAppConfig } from "../config";

// import { getRpcEngine } from "../engines";

class walletController {
  path= '';
  entropy= '';
  mnemonic='';
  wallet=null;

constructor() {
    this.path = this.getPath();
    this.entropy = this.getEntropy();
    this.mnemonic = this.getMnemonic();
    this.wallet = this.init();
}

provider() {
    return this.wallet.provider;
}

isActive() {
    if (!this.wallet) {
      return this.wallet;
    }
    return null;
}

getIndex() {
    return this.activeIndex;
}
getWallet(index, chainId) {
    if (!this.wallet || this.activeIndex === index || this.chainId === chainId) {
      return this.events.init(index, chainId);
    }
    return this.wallet;
  }

getAccounts(count = getAppConfig().numberOfAccounts) {
    const accounts = [];
    let wallet = null;
    for (let i = 0; i < count; i++) {
      wallet = this.generateWallet(i);
      accounts.push(wallet.address);
    }
    return accounts;
}

getData(key) {
    let value = getLocal(key);
    if (!value) {
      switch (key) {
        case ENTROPY_KEY:
          value = this.generateEntropy();
          break;
        case MNEMONIC_KEY:
          value = this.generateMnemonic();
          break;
        default:
          throw new Error(`Unknown data key: ${key}`);
      }
      setLocal(key, value);
    }
    return value;
}

getPath(index = this.activeIndex) {
    this.path = `${getAppConfig().derivationPath}/${index}`;
    return this.path;
  }

generateEntropy() {
    this.entropy = ethers.utils.hexlify(ethers.utils.randomBytes(16));
    return this.entropy;
}

generateMnemonic() {
    this.mnemonic = ethers.utils.entropyToMnemonic(this.getEntropy());
    return this.mnemonic;
}

generateWallet(index) {
    this.wallet = ethers.Wallet.fromMnemonic(this.getMnemonic(), this.getPath(index));
    return this.wallet;
}

getEntropy() {
    return this.getData(ENTROPY_KEY);
}

getMnemonic() {
    return this.getData(MNEMONIC_KEY);
}

init(activeIndex=DEFAULT_ACTIVE_INDEX, activeChainId=DEFAULT_CHAIN_ID) {
    return this.update(activeIndex, activeChainId);
}

update(activeIndex, activeChainId) {
    const firstUpdate = typeof this.wallet === "undefined";
    this.activeIndex = activeIndex;
    this.chainId = activeChainId;
    console.log('gettingChainData');
    console.log(this.chainId);
    const rpcUrl = getChainData(this.chainId).rpc_url;
    const wallet = this.generateWallet(this.activeIndexindex);
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    this.wallet = wallet.connect(provider);
    if (!firstUpdate) {
      // update another controller if necessary here
    }
    return this.wallet;
}

populateTransaction = (transaction) => {
    let tx = Object.assign({}, transaction);
    if (this.wallet) {
      if (tx.gas) {
        tx.gasLimit = tx.gas;
        delete tx.gas;
      }
      if (tx.from) {
        tx.from = ethers.utils.getAddress(tx.from);
      }

      try {
        tx = this.wallet.populateTransaction(tx);
        tx.gasLimit = ethers.BigNumber.from(tx.gasLimit).toHexString();
        tx.gasPrice = ethers.BigNumber.from(tx.gasPrice).toHexString();
        tx.nonce = ethers.BigNumber.from(tx.nonce).toHexString();
      } catch (err) {
        console.error("Error populating transaction", tx, err);
      }
    }

    return tx;
}

sendTransaction = (transaction) => {
    if (this.wallet) {
      if (
        transaction.from &&
        transaction.from.toLowerCase() !== this.wallet.address.toLowerCase()
      ) {
        console.error("Transaction request From doesn't match active account");
      }

      if (transaction.from) {
        delete transaction.from;
      }

      // ethers.js expects gasLimit instead
      if ("gas" in transaction) {
        transaction.gasLimit = transaction.gas;
        delete transaction.gas;
      }

      const result = this.wallet.sendTransaction(transaction);
      return result.hash;
    } else {
      console.error("No Active Account");
    }
    return null;
}
 
signTransaction = (data) => {
    if (this.wallet) {
      if (data && data.from) {
        delete data.from;
      }
      data.gasLimit = data.gas;
      delete data.gas;
      const result = this.wallet.signTransaction(data);
      return result;
    } else {
      console.error("No Active Account");
    }
    return null;
}

signMessage = (data) => {
    if (this.wallet) {
      const signingKey = new ethers.utils.SigningKey(this.wallet.privateKey);
      const sigParams =  signingKey.signDigest(ethers.utils.arrayify(data));
      const result =  ethers.utils.joinSignature(sigParams);
      return result;
    } else {
      console.error("No Active Account");
    }
    return null;
}

signPersonalMessage = (message) =>{
    if (this.wallet) {
      const result =  this.wallet.signMessage(
        ethers.utils.isHexString(message) ? ethers.utils.arrayify(message) : message,
      );
      return result;
    } else {
      console.error("No Active Account");
    }
    return null;
}

signTypedData = (data) => {
    if (this.wallet) {
      const result = signTypedData_v4(Buffer.from(this.wallet.privateKey.slice(2), "hex"), {
        data: JSON.parse(data),
      });
      return result;
    } else {
      console.error("No Active Account");
    }
    return null;
}
}

export function getWalletController() { 
  return new walletController();
}

