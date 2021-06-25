import produce from 'immer';
import * as types from '../actions/actionTypes';

const initRoot = () => {
  const root = {
    loading: false,
    port: null
  };
  return root;
};

const showLoading = (root) => {
  root.loading = true;
  return root;
};

const hideLoading = (root) => {
  root.loading = false;
  return root;
};

const savePort = (root, port) => {
  root.port = port;
  return root;
};

const root = produce((root, action) => {
  switch (action.type) {
    case types.SHOW_LOADING:
      return showLoading(root);
    case types.HIDE_LOADING:
      return hideLoading(root);
    case types.SAVE_PORT:
      return savePort(root, action.port);
    default:
  }
  return root;
}, initRoot());

export default root;