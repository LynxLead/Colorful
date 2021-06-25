import { combineReducers } from 'redux';
import wallet from './wallet';
import root from './root';
import account from './account';

const reducer = combineReducers({
  wallet,
  root,
  account
});

export default reducer;