import * as types from './actionTypes';

// root
export const showLoading = () => {
  return {
    type: types.SHOW_LOADING
  };
};

export const hideLoading = () => {
  return {
    type: types.HIDE_LOADING
  };
};

export const savePort = (port) => {
  return {
    type: types.SAVE_PORT,
    port
  };
};

// wallet
export const setWallets = (wallets) => {
  return {
    type: types.SET_WALLETS,
    wallets
  };
};