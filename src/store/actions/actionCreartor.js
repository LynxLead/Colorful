import * as types from './actionTypes';

// root
export const showLoading = (text=null) => {
  return {
    type: types.SHOW_LOADING,
    text
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

// messaging
export const createBaseMsg = () => {
  return {
    source: 'colorful.popup'
  };
};