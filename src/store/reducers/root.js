import produce from 'immer';
import * as types from '../actions/actionTypes';

const initRoot = () => {
  const root = {
    loading: false,
    loadingText: false,
    port: null
  };
  return root;
};

const showLoading = (root, text) => {
  root.loading = true;
  root.loadingText = text;
  return root;
};

const hideLoading = (root) => {
  root.loading = false;
  root.loadingText = null;
  return root;
};

const savePort = (root, port) => {
  root.port = port;
  return root;
};

const root = produce((root, action) => {
  switch (action.type) {
    case types.SHOW_LOADING:
      return showLoading(root, action.text);
    case types.HIDE_LOADING:
      return hideLoading(root);
    case types.SAVE_PORT:
      return savePort(root, action.port);
    default:
  }
  return root;
}, initRoot());

export default root;