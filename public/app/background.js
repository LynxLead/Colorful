import * as types from '../../src/store/actions/actionTypes';
import { encryptPassword, decryptKey, encryptKey } from '../../src/utils/security';
import Pact from 'pact-lang-api';

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
        console.log(decryptedAccount);
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
    if (decryptedAccount.passwordHash === null) {
      return {
        status: 'failure',
        data: 'Account is locked'
      };
    } else {
      const account = {
        wallets: decryptedAccount.wallets.map(wallet => ({
          address: wallet.address,
          publicKey: wallet.publicKey
        }))
      };
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
    console.log(decryptedAccount);
    const keyPair = decryptedAccount.wallets[walletIndex];
    console.log(keyPair, cmd);
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
  };

  chrome.runtime.onConnect.addListener((port) => {
    console.assert(port.name === 'auth');
    port.onMessage.addListener(async (msg) => {
      let data;
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
        default:
      }
      const response = {
        ...data,
        action: msg.action,
      };
      port.postMessage(response);
    });
  });
})();