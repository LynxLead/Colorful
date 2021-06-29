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
import { createBaseMsg, hideLoading, showLoading } from '../../store/actions/actionCreartor';
import * as types from '../../store/actions/actionTypes';
import { fetchLocal } from '../../utils/chainweb';
import { firstUrl, secondUrl } from '../../utils/tools';

/* global chrome */

export const HomePage = (props) => {

  const [account, setAccount] = useState(undefined);
  const [tabType, setTabType] = useState('assets');
  const [signingMsg, setSigningMsg] = useState(null);
  const [signingCmd, setSigningCmd] = useState(null);

  const passwordRef = useRef();
  const history = useHistory();

  const { port, showLoading, hideLoading, baseHash } = props;

  const getWallet = () => {
    const { wallets } = account;
    const wallet = wallets && wallets.length > 0 ? wallets[0] : {};
    return wallet;
  };

  const updateAccount = () => {
    const msg = createBaseMsg();
    port.postMessage({ 
      ...msg,
      action: types.GET_ACCOUNT,
      context: 'home'
    });
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
    const msg = createBaseMsg();
    port.postMessage({ 
      ...msg,
      passwordHash,
      action: types.UNLOCK_ACCOUNT,
      context: 'home'
    });
  };

  const lockAccount = () => {
    const msg = createBaseMsg();
    port.postMessage({ 
      ...msg,
      action: types.LOCK_ACCOUNT,
      context: 'home'
    });
  };

  const confirmSigning = () => {
    const msg = createBaseMsg();
    port.postMessage({
      ...signingMsg,
      ...msg,
      buffer: true
    });
    checkResult();
  };
  const cancelSigning = () => {
    const msg = createBaseMsg();
    // broadcast in window
    port.postMessage({ 
      ...msg,
      action: types.CANCEL_SIGNING,
      buffer: true
    });
    checkResult();
  };

  const checkResult = async () => {
    console.log('in check buff result');
    const msg = createBaseMsg();
    setInterval(() => port.postMessage({ 
      ...msg,
      scene: 'buffer'
    }), 1000);
  };

  const clickLogout = () => {
    if (window.confirm('Confirm logging out?')) {
      chrome.tabs.create({ url: '/index.html#/initialize' });
      window.close();
      const msg = createBaseMsg();
      port.postMessage({ 
        ...msg,
        action: types.DELETE_ACCOUNT,
        context: 'home'
      });
    }
  };

  useEffect(() => {
    // set up port
    const setupPort = () => {
      console.log('port onmessage', port.onMessage);
      port.onMessage.addListener(handleMessage);
    };
    const handleMessage = async (msg) => {
      if (msg.source !== 'colorful.background') {
        return;
      }
      if (msg.scene === 'buffer' && msg.status === 'success') {
        window.close();
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
      else if (msg.action === types.SIGN_CMD) {
        console.log('get response in signCmd', msg);
        setSigningMsg(msg);
        const cmd = JSON.parse(msg.cmd);
        console.log('get response in signCmd. cmd = ', cmd);
        setSigningCmd(cmd);
      }
    };

    setupPort();
    updateAccount();   // load account

    return () => {
      // Unbind the event listener on clean up
      port.onMessage.removeListener(handleMessage);
    };
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
            account.wallets ? (
              <div>
                <button onClick={ () => lockAccount() } className='px-2 py-2 bg-cb-pink text-white rounded mr-4'>Lock</button>
                <button className='px-2 py-2 bg-cb-pink text-white rounded mr-4'><Link to='/secret'>SecretKey</Link></button>
                <button className='px-2 py-2 bg-cb-pink text-white rounded mr-4'><a onClick={ () => clickLogout() }>Logout</a></button>
              </div>
            ) :
            <button className='px-2 py-2 bg-cb-pink text-white rounded mr-4'><a onClick={ () => clickLogout() }>Reset</a></button>
          }
        </div>
        {
          account.wallets ? (
            signingCmd ? (
              <div data-role='signing page' className='w-full px-6 h-11/12 border rounded flex flex-col items-center pb-20 text-center'>
                { signingMsg.itemUrls && <img 
                  src={firstUrl(signingMsg.itemUrls)} 
                  className='w-1/2' 
                  onError={ (e) => {
                    e.target.onerror = null; 
                    e.target.src = secondUrl(signingMsg.itemUrls);
                  } } 
                  alt='preview'
                />
                }
                <p className='text-lg font-semibold mt-4'>Code</p>
                <p>{signingCmd.payload.exec.code}</p>

                <p className='text-lg font-semibold mt-4'>Caps</p>
                {signingCmd.signers[0].clist.map(cap => (
                  <div>
                    <p>Name: {cap.name}</p>
                    <p>Arguments: {JSON.stringify(cap.args)}</p>
                  </div>
                ))}

                <p className='text-lg font-semibold mt-4'>Meta</p>
                {Object.entries(signingCmd.meta).map(([key, value]) => (
                    <p>{key}: {value}</p>
                ))}

                <div className='w-full flex justify-between px-6 mt-10'>
                  <button className='px-8 py-2 bg-cb-pink text-white rounded mt-5' onClick={ () => cancelSigning() }>Cancel</button>
                  <button className='px-8 py-2 bg-cb-pink text-white rounded mt-5' onClick={ () => confirmSigning() }>Confirm</button>
                </div>
              </div>
            ) : (
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
            )
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
  showLoading: (text=null) => dispatch(showLoading(text)),
  hideLoading: () => dispatch(hideLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
