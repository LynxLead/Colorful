import * as types from '../../src/store/actions/actionTypes';
import { encryptPassword, decryptKey, encryptKey } from '../../src/utils/security';
import Pact, { wallet } from 'pact-lang-api';

(() => {
  // it's safe to store credentials in self invoking function
  let decryptedAccount = {
    passwordHash: null,
    wallets: [{
      address: null,
      publicKey: null,
      secretKey: null
    }]
  };
  let unhandledMsg = null;
  let bufferMsg = null;

  const createAccount = async (originAccount) => {
    // save password and encrypted keys
    const { passwordHash, wallets } = originAccount;
    const encryptedAccount = {
      passwordHash: encryptPassword(passwordHash),
      wallets: wallets.map(wallet => ({
        address: encryptKey(wallet.address, passwordHash),
        publicKey: encryptKey(wallet.publicKey, passwordHash),
        secretKey: encryptKey(wallet.secretKey, passwordHash),
      }))
    };
    await chrome.storage.local.set({ account: encryptedAccount });
    return {
      status: 'success',
      data: 'create successfully'
    };
  };

  const unlockAccount = async (passwordHash) => {
    const isValid = await verifyPassword(passwordHash);
    if (isValid) {
      await chrome.storage.local.get('account', (data) => {
        const { account } = data;
        decryptedAccount = {
          passwordHash,
          wallets: account.wallets.map(wallet => ({
            address: decryptKey(wallet.address, passwordHash),
            publicKey: decryptKey(wallet.publicKey, passwordHash),
            secretKey: decryptKey(wallet.secretKey, passwordHash),
          }))
        };   // store account in memory
      });
      return {
        status: 'success',
        data: 'unlock successfully'
      };
    } else {
      return {
        status: 'failure',
        data: 'password is not correct'
      };
    }
  };

  const verifyPassword = async (passwordHash) => {
    const isValid = await new Promise((resolve) => {
      chrome.storage.local.get('account', (data) => {
        const isValid = data.account.passwordHash === encryptPassword(passwordHash);
        resolve(isValid);
      });
    });
    return isValid;
  };

  const lockAccount = async () => {
    decryptedAccount.passwordHash = null;
    return {
      status: 'success',
      data: 'lock successfully'
    };
  };

  const getAccount = async () => {
    const account = await new Promise((resolve) => {
      chrome.storage.local.get('account', (data) => {
        resolve(data.account);
      });
    });
    if (!account) {
      return {
        status: 'failure',
        data: 'Account is not initialized'
      };
    } else if (decryptedAccount.passwordHash === null) {
      return {
        status: 'failure',
        data: 'Account is locked, Please open extension popup and login'
      };
    } else {
      const account = {
        wallets: decryptedAccount.wallets.map(wallet => ({
          address: wallet.address,
          publicKey: wallet.publicKey
        }))
      };
      account.sigs = await Promise.all(account.wallets.map((wallet, index) => signCmd(wallet.publicKey, index).then(result => result.data)));
      return {
        status: 'success',
        data: account
      };
    }
  };

  const getLockStatus = async () => {
    return {
      status: 'success',
      data: decryptedAccount.passwordHash === null
    };
  };

  const signCmd = async (cmd, walletIndex) => {
    try {
      const keyPair = decryptedAccount.wallets[walletIndex];
      const signed = Pact.crypto.sign(cmd, keyPair);
      signed.cmd = cmd;
      return {
        status: 'success',
        data: {
          hash: signed.hash,
          sigs: [{
            sig: signed.sig
          }],
          cmd: signed.cmd
        }
      };
    } catch {
      return {
        status: 'failure',
        data: 'sign error'
      };
    }
  };

  const unlockSecret = async (passwordHash, walletIndex) => {
    const isValid = await verifyPassword(passwordHash);
    if (isValid) {
      const secretKey = decryptedAccount.wallets[walletIndex].secretKey;
      return {
        status: 'success',
        data: secretKey
      };
    } else {
      return {
        status: 'failure',
        data: 'password is not correct'
      };
    }
  };

  const getExtensionInfo = async () => {
    return {
      status: 'success',
      data: chrome.runtime
    };
  };

  const cancelSigning = async () => {
    return {
      status: 'failure',
      data: 'User canceled signing'
    };
  };

  const deleteAccount = async () => {
    decryptedAccount =  {
      passwordHash: null,
      wallets: [{
        address: null,
        publicKey: null,
        secretKey: null
      }]
    };
    await chrome.storage.local.set({ account: {} });
    return {
      status: 'success',
      data: 'Account is deleted'
    };
  };

  const openPopup = async () => {
    
    const width = 500;
    const height = 1000;
    const top = 0;
    const left = 1500 - width;

    await chrome.windows.create({
      url: 'index.html#popup',
      type: 'popup',
      focused: true,
      width,
      height,
      left,
      top
    });
  };

  const saveUnhandledMsg = (msg) => {
    unhandledMsg = msg;
  };
  const clearUnhandledMsg = (msg) => {
    unhandledMsg = null;
  };

  const saveBufferMsg = (msg) => {
    bufferMsg = msg;
  };
  const clearBufferMsg = () => {
    bufferMsg = null;
  };

  // there'll be multiple ports, for original webpage and popup page and maybe others
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'colorful.auth') {
      return;
    }
    port.onMessage.addListener(async (msg) => {
      let data = {};
      if (msg.source === 'colorful.popup' && msg.scene === 'repost' && unhandledMsg) {
        data = unhandledMsg;
        clearUnhandledMsg();
      } else if (msg.source === 'colorful.popup' && msg.scene === 'buffer' && !bufferMsg) {
        data = { 
          ...msg,
          status: 'success' 
        };
      } else if (msg.source === 'colorful.content' && msg.scene === 'buffer' && bufferMsg) {
        data = bufferMsg;
        clearBufferMsg();
      } else if (msg.source === 'colorful.content') {
        switch (msg.action) {
          case types.CREATE_ACCOUNT:
            data = await createAccount(msg.account);
            break;
          case types.UNLOCK_ACCOUNT:
            data = await unlockAccount(msg.passwordHash);
            break;
          case types.LOCK_ACCOUNT:
            data = await lockAccount();
            break;
          case types.VERIFY_PASSWORD:
            data = await verifyPassword(msg.passwordHash);
            break;
          case types.GET_ACCOUNT:
            data = await getAccount();
            break;
          case types.GET_LOCK_STATUS:
            data = await getLockStatus();
            break;
          case types.SIGN_CMD:
            saveUnhandledMsg(msg);
            await openPopup();
            return;
          case types.UNLOCK_SECRET:
            data = await unlockSecret(msg.passwordHash, msg.walletIndex);
            break;
          case types.GET_EXTENSION_INFO:
            data = await getExtensionInfo();
            break;
          case types.CANCEL_SIGNING:
            data = await cancelSigning();
            break;
          case types.DELETE_ACCOUNT:
            data = await deleteAccount();
            break;
          default:
        }
      } else if (msg.source === 'colorful.popup') {
        switch (msg.action) {
          case types.CREATE_ACCOUNT:
            data = await createAccount(msg.account);
            break;
          case types.UNLOCK_ACCOUNT:
            data = await unlockAccount(msg.passwordHash);
            break;
          case types.LOCK_ACCOUNT:
            data = await lockAccount();
            break;
          case types.VERIFY_PASSWORD:
            data = await verifyPassword(msg.passwordHash);
            break;
          case types.GET_ACCOUNT:
            data = await getAccount();
            break;
          case types.GET_LOCK_STATUS:
            data = await getLockStatus();
            break;
          case types.SIGN_CMD:
            data = await signCmd(msg.cmd, msg.walletIndex);
            break;
          case types.UNLOCK_SECRET:
            data = await unlockSecret(msg.passwordHash, msg.walletIndex);
            break;
          case types.GET_EXTENSION_INFO:
            data = await getExtensionInfo();
            break;
          case types.CANCEL_SIGNING:
            data = await cancelSigning();
            break;
          case types.DELETE_ACCOUNT:
            data = await deleteAccount();
            break;
          default:
        }
      }
      const response = {
        ...msg,
        ...data,
        source: 'colorful.background'
      };
      if (msg.buffer) {
        saveBufferMsg(response)
      } else {
        port.postMessage(response);
      }
    });
  });

  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      chrome.tabs.create({ url: '/index.html#/initialize' });
    }
  });
})();