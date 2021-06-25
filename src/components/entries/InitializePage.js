import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useHistory } from 'react-router';
import { Route, Link, Redirect } from 'react-router-dom';
import { toast } from 'react-toastify';
import Pact from 'pact-lang-api';

import { createWalletConfig, serverUrl } from '../../config';
import { showLoading, hideLoading } from '../../store/actions/actionCreartor';
import { savePassword, encryptKey } from '../../utils/security';
import { mkReq } from '../../utils/tools';

/* global chrome */

export const InitializePage = (props) => {

  const [keyPairs, setKeyPairs] = useState({
    publicKey: null,
    secretKey: null
  });
  const [createFormData, setCreateFormData] = useState({});

  const history = useHistory();

  const { showLoading, hideLoading } = props;

  const header = (
    <div className='flex items-center'>
      <img src='/img/colorful_logo.svg' className='w-16 my-5' alt='colorful logo' />
      <span className='text-xl text-cb-pink font-bold'>Colorful</span>
    </div>
  );

  const createWallet = async () => {
    if (!createFormData.address) {
      createFormData.address = keyPairs.publicKey;
    }
    const { address, password, repeatedPassword } = createFormData;
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
    console.log('finish check2');
    // check existance
    showLoading();

    const url = `${serverUrl}/colorful/create-wallet`;
    const postData = {
      address,
      public_key: keyPairs.publicKey
    };
    const result = await fetch(url, mkReq(postData))
      .then(res => res.json())
      .catch(error => {
        console.log(error);
        toast.error(error.message);
      });
    hideLoading();

    if (result) {
      // encrypt keys with password
      const encryptedPublicKey = encryptKey(keyPairs.publicKey, password);
      const encryptedSecretKey = encryptKey(keyPairs.secretKey, password);
      const account = {
        wallets: [{
          address,
          encrypted: {
            publicKey: encryptedPublicKey,
            secretKey: encryptedSecretKey
          }
        }],
        activeWalletIndex: 0,
        passwordHash: savePassword(password)
      };

      // start hearbeat
      chrome.runtime.sendMessage({ 'authStatus': 'success' }, (response) => {
        console.log(response);
        // set account into storage
        chrome.storage.local.set({ 'account': account });
        
        history.push('/finish');
      });
    }
  };


  useEffect(() => {
    const genKeyPairs = () => {
      const newKeyPairs = Pact.crypto.genKeyPair();
      setKeyPairs(newKeyPairs);
    };

    genKeyPairs();
  }, []);

  return (
    <div className='w-full'>
      <Redirect from='/' to='/welcome' /> 
      <Route path='/welcome'>
        <div data-role='app container' className='flex flex-col items-center pt-5 font-work w-120 mx-auto'>
          <img src='/img/colorful_logo.svg' className='w-32 my-10' alt='colorful logo' />
          <p className='text-xl font-medium'>InitializePage To Colorful</p>
          <div className='text-center my-5'>
            <p>You will connect to Kadena network through Colorful.</p>
            <p>Glad to see you.</p>
          </div>
          <Link to='/select-action'>
            <button className='px-8 py-2 bg-cb-pink text-white rounded mt-10'>
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
            <label className='mt-5 mb-2'>Your public key</label>
            <input type='text' className='bg-gray-300' value={keyPairs.publicKey} readOnly />
            <label className='mt-5 mb-2'>Set Your address <span className='text-xs text-green-500 ml-5'>Default same with public key, but you can set a custom one.</span></label>
            <input type='text' defaultValue={keyPairs.publicKey} onChange={ (e) => setCreateFormData({...createFormData, address: e.target.value}) } />
            <label className='mt-5 mb-2'>Your private key <span className='text-xs text-red-500 ml-5'>You must store it in safe place.</span></label>
            <input type='text' className='bg-gray-300' value={keyPairs.secretKey} readOnly />
            <label className='mt-5 mb-2'>Set password for your account</label>
            <input type='password' onChange={ (e) => setCreateFormData({...createFormData, password: e.target.value}) } />
            <label className='mt-5 mb-2'>Confirm your password</label>
            <input type='password' onChange={ (e) => setCreateFormData({...createFormData, repeatedPassword: e.target.value}) } />
            <button className='px-8 py-2 bg-cb-pink text-white rounded mt-20' onClick={ () => createWallet() }>Generate</button>
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
  loading: state.root.loading
});

const mapDispatchToProps = dispatch => ({
  showLoading: () => dispatch(showLoading()),
  hideLoading: () => dispatch(hideLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(InitializePage);