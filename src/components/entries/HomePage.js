import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Route } from 'react-router-dom';
import { toast } from 'react-toastify';

import { networkId, apiHost, modules, heartbeatValidity, gasPrice, gasLimit, ttl } from '../../config';
import { encryptPassword } from '../../utils/security';
import Transfer from '../common/Transfer';
import AssetRows from '../common/AssetRows';
import ActivityRows from '../common/ActivityRows';
import { hideLoading, showLoading } from '../../store/actions/actionCreartor';
import SendPage from '../pages/SendPage';
import * as types from '../../store/actions/actionTypes';
import { fetchLocal } from '../../utils/chainweb';

/* global chrome */

export const HomePage = (props) => {

  const [account, setAccount] = useState(undefined);
  const [tabType, setTabType] = useState('assets');

  const passwordRef = useRef();

  const { port, showLoading, hideLoading } = props;

  const getWallet = () => {
    const { wallets } = account;
    const wallet = wallets && wallets.length > 0 ? wallets[0] : {};
    return wallet;
  };

  const updateAccount = () => {
    const action = types.GET_ACCOUNT;
    port.postMessage({ action });
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
    port.postMessage({ action, passwordHash });
  };

  const lockAccount = () => {
    const action = types.LOCK_ACCOUNT;
    port.postMessage({ action });
  };

  useEffect(() => {
    // set up port
    const setupPort = () => {
      port.onMessage.addListener(async (msg) => {
        if (msg.action === types.GET_ACCOUNT) {
          console.log('get response in getAccount', msg);
          if (msg.status === 'success') {
            const account = msg.data;
            console.log('now update account: ', account)
            showLoading();
            await updateBalance(account);
            hideLoading();
            setAccount(account);
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
    <div data-role='homepage container' className='w-full'>
      <div data-role='header' className='w-full flex items-center justify-between'>
        <div className='flex items-center'>
          <img src='/img/colorful_logo.svg' className='w-16 my-5' alt='colorful logo' />
          <span className='text-xl text-cb-pink font-bold'>Colorful</span>
        </div>
        <button onClick={ () => lockAccount() }>Lock</button>
      </div>
      {
        account.wallets ? (
          <div data-role='homepage body' className='w-full h-11/12 border rounded flex flex-col items-center'>
            <Route path='/' exact>
              <Transfer wallet={getWallet()} />
              <div data-role='asset and tx tabs' className='w-full flex text-lg'>
                <div 
                  className={`w-1/2 py-2 text-center border-b-2 ${tabType === 'assets' ? 'border-pink-500' : 'border-white'}`}
                  onClick={ () => setTabType('assets') }
                >
                  Assets</div>
                <div 
                  className={`w-1/2 py-2 text-center border-b-2 ${tabType === 'activities' ? 'border-pink-500' : 'border-white'}`}
                  onClick={ () => setTabType('activities') }
                >
                  Activities
                </div>
              </div>
              { tabType === 'assets' ?
                <AssetRows wallet={getWallet()} /> :
                <ActivityRows wallet={getWallet()} />
              }
            </Route>
            <Route path='/send'>
              <SendPage wallet={getWallet()} />
            </Route>
          </div>
        ) : (
          <div data-role='homepage body' className='w-full h-11/12 border rounded flex flex-col items-center'>
            <img src='/img/colorful_logo.svg' className='w-32 my-5' alt='colorful logo' />
            <p>Welcore Back!</p>
            <label>Password</label>
            <input type='password' className='w-1/3 px-3 py-2 border rounded' ref={passwordRef} />
            <button className='px-8 py-2 bg-cb-pink text-white rounded mt-20' onClick={ () => authAccount() }>Unlock</button>
          </div>
        )
      }
    </div>
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
