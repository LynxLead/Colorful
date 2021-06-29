import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useLocation, useHistory } from 'react-router';
import { HashRouter as Router, Route, Link, Redirect, Switch } from 'react-router-dom';
import { toast } from 'react-toastify';
import Pact from 'pact-lang-api';

import { createWalletConfig, serverUrl } from '../../config';
import { showLoading, hideLoading, createBaseMsg } from '../../store/actions/actionCreartor';
import { encryptPassword } from '../../utils/security';
import * as types from '../../store/actions/actionTypes';
import { fetchLocal } from '../../utils/chainweb';
import { mkReq } from '../../utils/tools';

export const InitializePage = (props) => {

  const [keyPairs, setKeyPairs] = useState({});

  const addressRef = useRef();
  const publicKeyRef = useRef();
  const secretKeyRef = useRef();
  const passwordRef = useRef();
  const repeatedPasswordRef = useRef();

  const history = useHistory();

  const { showLoading, hideLoading, port } = props;

  const header = (
    <div className='flex items-center'>
      <img src='/img/colorful_logo.svg' className='w-16 my-5' alt='colorful logo' />
      <span className='text-xl text-cb-pink font-bold'>Colorful</span>
    </div>
  );

  const createWallet = async (fromImport=false) => {
    const { address, publicKey, secretKey, password, repeatedPassword } = getRefValues();
    if (address.length < createWalletConfig.minAddressLength) {
      toast.warn('Address is too short');
      return;
    }
    if (address.length > createWalletConfig.maxAddressLength) {
      toast.warn('Address is too long');
      return;
    }
    if (!password) {
      toast.warn('Please enter your password');
      return;
    }
    if (password.length < createWalletConfig.minPasswordLength) {
      toast.warn('Password is too short');
      return;
    }
    if (password.length > createWalletConfig.maxPasswordLength) {
      toast.warn('Password is too long');
      return;
    }
    if (!repeatedPassword) {
      toast.warn('Please enter your password');
      return;
    }
    if (repeatedPassword !== password) {
      toast.warn('Password is not matched');
      return;
    }

    let result;
    if (fromImport) {
      result = {
        status: 'success'
      };
    } else {
      // create
      showLoading('Creating wallet on Kadena network. Please wait 30 ~ 90 seconds...');
      const url = `${serverUrl}/colorful/create-wallet`;
      const postData = {
        address,
        public_key: publicKey
      };
      result = await fetch(url, mkReq(postData))
        .then(res => res.json())
        .catch(error => {
          console.log(error);
          toast.error(error.message);
        });
      hideLoading();
    }

    if (result) {
      if (result.status === 'success') {
        // encrypt keys with password
        const passwordHash = encryptPassword(password);
        const account = {
          passwordHash,
          wallets: [{
            address,
            publicKey,
            secretKey
          }]
        };

        const msg = createBaseMsg();
        port.postMessage({ 
          ...msg,
          account,
          action: types.CREATE_ACCOUNT,
          context: 'initialize'
        });
      } else {
        toast.error(result.data);
      }
    }
  };

  const importWallet = async () => {
    const secretKey = secretKeyRef.current.value;
    let publicKey;
    try {
      publicKey = Pact.crypto.restoreKeyPairFromSecretKey(secretKey).publicKey;
    } catch (e) {
      console.log(e);
      toast.warning(e.message);
      return;
    }
    publicKeyRef.current.value = publicKey;
    const address = addressRef.current.value;
    console.log(publicKey);
    console.log('now fetch ', publicKey);
    const code = `(coin.details "${address}")`;
    const request = fetchLocal(code);
    const details = await request.then(data => {
      const result = data.result;
      if (result.status === 'success') {
        return result.data;
      } else {
        return null;
      }
    });
    console.log(details);
    if (details) {
      console.log(details);
      createWallet(true);
    } else {
      toast.warning('Address is not existing');
    }
  };

  const getRefValues = () => {
    return {
      address: addressRef.current.value,
      publicKey: publicKeyRef.current.value,
      secretKey: secretKeyRef.current.value,
      password: passwordRef.current.value,
      repeatedPassword: repeatedPasswordRef.current.value
    }
  };

  const clearRefValues = () => {
    addressRef.current.value = null;
    publicKeyRef.current.value = null;
    secretKeyRef.current.value = null;
    passwordRef.current.value = null;
  };

  useEffect(() => {
    // set up port
    const setupPort = () => {
      port.onMessage.addListener(handleMessage);
    };

    const handleMessage = async (msg) => {
      if (msg.context !== 'initialize') {
        return;
      }
      if (msg.action === types.CREATE_ACCOUNT) {
        console.log('get response in createAccount', msg);
        clearRefValues();
        history.push('/finish');
      }
    };

    setKeyPairs(Pact.crypto.genKeyPair());
    setupPort();
    
    return () => {
      // Unbind the event listener on clean up
      port.onMessage.removeListener(handleMessage);
    };
  }, []);

  return (
    <div className='w-1/2 mx-auto'>
      <Router basename='/initialize'>
        <Switch>
          <Route path='/welcome'>
            <div data-role='app container' className='flex flex-col items-center pt-5 font-work w-120 mx-auto'>
              <img src='/img/colorful_logo.svg' className='w-32 my-10' alt='colorful logo' />
              <p className='text-xl font-medium'>Initialize Page To Colorful</p>
              <div className='text-center my-5'>
                <p>You will connect to Kadena network through Colorful.</p>
                <p>Glad to see you.</p>
              </div>
              <Link to='/select-action'>
                <button type='button' className='px-8 py-2 bg-cb-pink text-white rounded mt-10'>
                  Start Using
                </button>
              </Link>
            </div>
          </Route>
          <Route path='/select-action'>
            {header}
            <div>
              <p className='my-10 text-center text-xl font-semibold'>Using Colorful for the first time?</p>
              <div className='flex h-80'>
                <div className='w-1/2 h-full px-5'>
                  <div className='h-full border rounded flex flex-col items-center pt-10'>
                    <img src='/img/download.png' className='w-16 h-16' alt='download' />
                    <p className='text-lg mt-5'>NO, I have existing private key.</p>
                    <p className='text-xs my-2 text-gray-500'>Import your existing private key</p>
                    <Link to='/import-wallet'>
                      <button className='px-8 py-2 bg-cb-pink text-white rounded mt-10'>Import Wallet</button>
                    </Link>
                  </div>
                </div>
                <div className='w-1/2 h-full px-5'>
                  <div className='h-full border rounded flex flex-col items-center pt-10'>
                    <img src='/img/add.png' className='w-16 h-16' alt='download' />
                    <p className='text-lg mt-5'>First time, setup right now!</p>
                    <p className='text-xs my-2 text-gray-500'>Will create private key for your new wallet</p>
                    <Link to='/create-wallet'>
                      <button className='px-8 py-2 bg-cb-pink text-white rounded mt-10'>Create Wallet</button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Route>
          <Route path='/create-wallet'>
            {header}
            <div>
              <form data-role='register kda account' className='flex flex-col'>
                <label className='mt-5 mb-2'>Set Your address <span className='text-xs text-green-500 ml-5'>Default same with public key, but you can set a custom one.</span></label>
                <input type='text' defaultValue={keyPairs.publicKey} ref={addressRef} />
                <label className='mt-5 mb-2'>Your public key</label>
                <input type='text' className='bg-gray-300' value={keyPairs.publicKey} ref={publicKeyRef} readOnly />
                <label className='mt-5 mb-2'>Your private key <span className='text-xs text-red-500 ml-5'>You must store it in safe place.</span></label>
                <input type='text' className='bg-gray-300' value={keyPairs.secretKey} ref={secretKeyRef} readOnly />
                <label className='mt-5 mb-2'>Set password for your account</label>
                <input type='password' ref={passwordRef} />
                <label className='mt-5 mb-2'>Confirm your password</label>
                <input type='password' ref={repeatedPasswordRef} />
                <button type='button' className='px-8 py-2 bg-cb-pink text-white rounded mt-20' onClick={ () => createWallet() }>Generate</button>
              </form>
            </div>
          </Route>
          <Route path='/import-wallet'>
            {header}
            <div>
              <form data-role='register kda account' className='flex flex-col'>
                <label className='mt-5 mb-2'>Set Your address</label>
                <input type='text' ref={addressRef} />
                <div hidden>
                  <input type='text' className='bg-gray-300'  ref={publicKeyRef} />
                </div>
                <label className='mt-5 mb-2'>Your private key</label>
                <input type='text' ref={secretKeyRef} />
                <label className='mt-5 mb-2'>Set password for your account</label>
                <input type='password' ref={passwordRef} />
                <label className='mt-5 mb-2'>Confirm your password</label>
                <input type='password' ref={repeatedPasswordRef} />
                <button type='button' className='px-8 py-2 bg-cb-pink text-white rounded mt-20' onClick={ () => importWallet() }>Import</button>
              </form>
            </div>
          </Route>
          <Route path='/finish'>
            {header}
            <div className='mt-10 flex flex-col items-center'>
              <p className='text-lg'>Congratulations!</p>
              <p>You have finished wallet registration.</p>
              <button className='px-8 py-2 bg-cb-pink text-white rounded mt-10'>
                <a href='/index.html'>Done</a>
              </button>
            </div>
          </Route>
          <Redirect from='/' to='/welcome' /> 
        </Switch>
      </Router>
    </div>
  );
};

InitializePage.propTypes = {
  wallet: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  showLoading: PropTypes.func.isRequired,
  hideLoading: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  loading: state.root.loading,
  loadingText: state.root.loadingText,
  port: state.root.port
});

const mapDispatchToProps = dispatch => ({
  showLoading: (text=null) => dispatch(showLoading(text)),
  hideLoading: () => dispatch(hideLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(InitializePage);