import produce from 'immer';
import * as types from '../actions/actionTypes';

const initWallet = () => {
  const wallet = {
    wallets: []
  };
  return wallet;
};

const setWallets = (wallet, wallets) => {
  wallet.wallets = wallets;
  return wallet;
};

const wallet = produce((wallet, action) => {
  switch (action.type) {
    case types.SET_WALLETS:
      return setWallets(wallet, action.wallets);
    default:
  }
  return wallet;
}, initWallet());

export default wallet;