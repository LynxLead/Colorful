import produce from 'immer';
import * as types from '../actions/actionTypes';

const initAccount = () => {
  const account = {
    passwordHash: null
  };
  return account;
};

const setAccounts = (account, accounts) => {
  account.accounts = accounts;
  return account;
};

const account = produce((account, action) => {
  switch (action.type) {
    case types.SET_WALLETS:
      return setAccounts(account, action.accounts);
    default:
  }
  return account;
}, initAccount());

export default account;