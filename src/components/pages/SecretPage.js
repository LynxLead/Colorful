import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { toast } from 'react-toastify';

import { encryptPassword } from '../../utils/security';
import * as types from '../../store/actions/actionTypes';
import { createBaseMsg } from '../../store/actions/actionCreartor';

export const SecretPage = (props) => {

  const { wallets, port } = props;

  const [hasUnlocked, setHasUnlocked] = useState(false);

  const walletSelectRef = useRef();
  const passwordRef = useRef();

  const authAccount = () => {
    const password = passwordRef.current.value;
    const passwordHash = encryptPassword(password);
    const walletIndex = walletSelectRef.current.value;
    console.log('walletIndex', walletIndex);
    const msg = createBaseMsg();
    port.postMessage({ 
      ...msg,
      passwordHash, 
      walletIndex,
      action: types.UNLOCK_SECRET,
      context: 'secret'
    });
  };

  useEffect(() => {
    // set up port
    const setupPort = () => {
      port.onMessage.addListener(handleMessage);
    };

    const handleMessage = async (msg) => {
      if (msg.context !== 'secret') {
        return;
      }
      if (msg.action === types.UNLOCK_SECRET) {
        console.log('get response in unlockAccount', msg);
        if (msg.status === 'success') {
          toast.success('Unlock successfully!');
          navigator.clipboard.writeText(msg.data);
          setHasUnlocked(true);
        } else {
          toast.error(msg.data);
        }
      }
    };

    setupPort();

    return () => {
      // Unbind the event listener on clean up
      port.onMessage.removeListener(handleMessage);
    };
  }, []);

  return (
    <div data-role='secret body' className='w-full flex flex-col items-center'>
      <img src='/img/colorful_logo.svg' className='w-32 my-5' alt='colorful logo' />
      {
        hasUnlocked === false ? (
          <div className='w-full flex flex-col items-center'>
            <p className='text-xl font-semibold mb-10'>Choose Wallet</p>
            <select className='w-1/3 px-3 py-2 border rounded' ref={walletSelectRef}>
              {
                wallets.map((_, index) => (
                  <option value={index}>Wallet {index}</option>
                ))
              }
            </select>
            <label className='mt-5 mb-2'>Password</label>
            <input type='password' className='w-1/3 px-3 py-2 border rounded' ref={passwordRef} />
            <button className='px-8 py-2 bg-cb-pink text-white rounded mt-5' onClick={ () => authAccount() }>Unlock</button>
          </div>
        ) : (
          <div className='text-xl font-semibold'>
            Secret is copied to clipboard.
          </div>
        )
      }
    </div>
  );
};

SecretPage.propTypes = {
  props: PropTypes
};

const mapStateToProps = (state) => ({
  port: state.root.port
});

const mapDispatchToProps = {
  
};

export default connect(mapStateToProps, mapDispatchToProps)(SecretPage);
