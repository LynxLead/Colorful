import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { HashRouter as Router, Route, Link, useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';

import { encryptPassword } from '../../utils/security';
import Transfer from '../common/Transfer';
import AssetRows from '../common/AssetRows';
import ActivityRows from '../common/ActivityRows';
import SendPage from '../pages/SendPage';
import SecretPage from '../pages/SecretPage';
import AssetPage from '../pages/AssetPage';
import { hideLoading, showLoading } from '../../store/actions/actionCreartor';
import * as types from '../../store/actions/actionTypes';
import { fetchLocal } from '../../utils/chainweb';

/* global chrome */

export const HomePage = (props) => {

  const [account, setAccount] = useState(undefined);
  const [tabType, setTabType] = useState('assets');

  const passwordRef = useRef();
  const history = useHistory();

  const { port, showLoading, hideLoading, baseHash } = props;

  const getWallet = () => {
    const { wallets } = account;
    const wallet = wallets && wallets.length > 0 ? wallets[0] : {};
    return wallet;
  };

  const updateAccount = () => {
    const action = types.GET_ACCOUNT;
    port.postMessage({ action, context: 'home' });
  };

  const updateBalance = async (account) => {
    const fetchedWallets = account.wallets.map(async (wallet) => {
      console.log('now fetch ', wallet);
      const code = `(coin.get-balance "${wallet.address}")`;
      const request = fetchLocal(code);
      return await request.then(data => {
        const result = data.result;
        console.log(result);
        wallet.balance = {
          coin: result.data
        }
        return wallet;
      });
    });
    const wallets = await Promise.all(fetchedWallets);

    // update wallets
    console.log('wallets', wallets);
    account.wallets = wallets;
  };

  const authAccount = () => {
    const password = passwordRef.current.value;
    const passwordHash = encryptPassword(password);
    const action = types.UNLOCK_ACCOUNT;
    port.postMessage({ action, passwordHash, context: 'home' });
  };

  const lockAccount = () => {
    const action = types.LOCK_ACCOUNT;
    port.postMessage({ action, context: 'home' });
  };

  useEffect(() => {
    // set up port
    const setupPort = () => {
      port.onMessage.addListener(async (msg) => {
        if (msg.context !== 'home') {
          return;
        }
        if (msg.action === types.GET_ACCOUNT) {
          console.log('get response in getAccount', msg);
          if (msg.status === 'success') {
            const account = msg.data;
            console.log('now update account: ', account)
            showLoading();
            await updateBalance(account);
            hideLoading();
            setAccount(account);
          } else if (msg.data === 'Account is not initialized') {
            history.push('/initialize');
          } else {
            setAccount({});
          }
        }
        else if (msg.action === types.UNLOCK_ACCOUNT) {
          console.log('get response in unlockAccount', msg);
          if (msg.status === 'success') {
            toast.success('welcome back!');
            updateAccount();
          } else {
            toast.error(msg.data);
          }
        }
        else if (msg.action === types.LOCK_ACCOUNT) {
          console.log('get response in lockAccount', msg);
          toast.success('Account is locked');
          setAccount({});
        }
      });
    };

    setupPort();
    updateAccount();   // load account
  }, []);

  return account === undefined ? <></> : (
    <Router basename={`/${baseHash}`}>
      <div data-role='homepage container' className={baseHash === 'popup' ? 'w-120' : 'w-300 mx-auto'}>
        <div data-role='header' className='w-full flex items-center justify-between'>
          <Link to='/'>
            <div className='flex items-center'>
              <img src='/img/colorful_logo.svg' className='w-16 my-5' alt='colorful logo' />
              <span className='text-xl text-cb-pink font-bold'>Colorful</span>
            </div>
          </Link>
          {
            account.wallets && (
              <div>
                <button onClick={ () => lockAccount() } className='px-4 py-2 bg-cb-pink text-white rounded mr-5'>Lock</button>
                <button className='px-4 py-2 bg-cb-pink text-white rounded mr-10'><Link to='/secret'>SecretKey</Link></button>
              </div>
            )
          }
        </div>
        {
          account.wallets ? (
            <div data-role='homepage body' className='w-full h-11/12 border rounded flex flex-col items-center pb-20'>
              <Route path='/' exact>
                <Transfer wallet={getWallet()} />
                <div data-role='asset and tx tabs' className='w-full flex text-lg'>
                  <button 
                    className={`w-1/2 py-2 text-center border-b-2 ${tabType === 'assets' ? 'border-pink-500' : 'border-black'}`}
                    onClick={ () => setTabType('assets') }
                  >
                    Assets
                  </button>
                  <button 
                    className={`w-1/2 py-2 text-center border-b-2 ${tabType === 'activities' ? 'border-pink-500' : 'border-black'}`}
                    onClick={ () => setTabType('activities') }
                  >
                    Activities
                  </button>
                </div>
                { tabType === 'assets' ?
                  <AssetRows wallet={getWallet()} /> :
                  <ActivityRows wallet={getWallet()} />
                }
              </Route>
              <Route path='/send'>
                <SendPage wallet={getWallet()} />
              </Route>
              <Route path='/secret'>
                <SecretPage wallets={account.wallets} />
              </Route>
              <Route path='/asset-kda'>
                <AssetPage wallet={getWallet()} />
              </Route>
            </div>
          ) : (
            <div data-role='homepage body' className='w-full h-11/12 border rounded flex flex-col items-center pb-20'>
              <img src='/img/colorful_logo.svg' className='w-32 my-5' alt='colorful logo' />
              <p className='text-xl font-semibold mb-10'>Welcore Back!</p>
              <label className='mb-2'>Password</label>
              <input type='password' className='w-1/3 px-3 py-2 border rounded' ref={passwordRef} />
              <button className='px-8 py-2 bg-cb-pink text-white rounded mt-5' onClick={ () => authAccount() }>Unlock</button>
            </div>
          )
        }
      </div>
    </Router>
  );
};

HomePage.propTypes = {
  props: PropTypes
};

const mapStateToProps = (state) => ({
  port: state.root.port
});

const mapDispatchToProps = dispatch => ({
  showLoading: () => dispatch(showLoading()),
  hideLoading: () => dispatch(hideLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
