import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Pact from 'pact-lang-api';

import { createBaseMsg, hideLoading, showLoading } from '../../store/actions/actionCreartor';
import { toast } from 'react-toastify';
import { fetchListen, fetchLocal, fetchSend, getSendCmd } from '../../utils/chainweb';
import { chainId } from '../../config';
import * as types from '../../store/actions/actionTypes';

export const SendPage = (props) => {

  const { wallet, port, showLoading, hideLoading } = props;
  const [txData, setTxData] = useState({
    sender: wallet.address
  });

  const clickTransfer = async () => {
    console.log(txData);
    const { sender, receiver, amount } = txData;
    
    // validate receiver
    const code = `(coin.get-balance "${receiver}")`;
    const requestForLocal = fetchLocal(code);
    const result = await requestForLocal.then(data => {
      const result = data.result;
      if (result.status !== 'success') {
        toast.warning('Receiver is not existing');
      } else {
        return result.data;
      }
    });
    if (!result) {
      return;
    }

    const cmd = {
      keyPairs: {
        publicKey: wallet.publicKey,
        clist: [
          Pact.lang.mkCap('gas', 'pay gas', 'coin.GAS')['cap'],
          Pact.lang.mkCap('transfer', 'transfer coin', 'coin.TRANSFER', [sender, receiver, amount])['cap']
        ]
      },
      pactCode: `(coin.transfer "${sender}" "${receiver}" (read-decimal "amount"))`,
      envData: {
        amount
      },
      sender
    };
    console.log('cmd', cmd);
    const unsignedCmd = getSendCmd(cmd);
    const msg = createBaseMsg();
    port.postMessage({ 
      ...msg,
      cmd: unsignedCmd.cmd, 
      walletIndex: 0,
      action: types.SIGN_CMD,
      context: 'send'
    });
  };

  useEffect(() => {
    // set up port
    const setupPort = () => {
      port.onMessage.addListener(handleMessage);
    };

    const handleMessage = async (msg) => {
      if (msg.context !== 'send') {
        return;
      }
      if (msg.action === types.SIGN_CMD) {
        console.log('get response in signCmd', msg);
        const requestForSend = fetchSend(msg.data);
        showLoading();
        requestForSend.then(data => {
          console.log(data);
          const requestKey = data.requestKeys[0];
          const listenCmd = {
            'listen': requestKey
          };
          const requestForListen = fetchListen(listenCmd);
          requestForListen.then((data) => {
            console.log(data);
            hideLoading();
          });
        });
      }
    };

    setupPort();

    return () => {
      // Unbind the event listener on clean up
      port.onMessage.removeListener(handleMessage);
    };
  }, []);

  return (
    <div className='w-120 mx-auto flex flex-col items-center'>
      <label className='text-lg font-bold mt-10 mb-2'>Sender <span className='text-xs text-green-500 ml-5'>On Chain {chainId}</span></label>
      <div className='w-full flex items-center justify-center h-12'>
        <input type='text' className='w-3/4 h-full border px-3' value={wallet.address} readOnly />
      </div>
      <label className='text-lg font-bold mt-10 mb-2'>Receiver <span className='text-xs text-green-500 ml-5'>On Chain {chainId}</span></label>
      <div className='w-full flex items-center justify-center h-12'>
        <input type='text' className='w-3/4 h-full border px-3' onChange={ (e) => setTxData({...txData, receiver: e.target.value}) } />
      </div>
      <label className='text-lg font-bold mt-10 mb-2'>Amount</label>
      <div className='w-full flex items-center justify-center h-12'>
        <input type='number' className='w-3/4 h-full border px-3' onChange={ (e) => setTxData({...txData, amount: parseFloat(e.target.value)}) } />
      </div>
      <button className='px-8 py-2 bg-cb-pink text-white rounded mt-10' onClick={ () => clickTransfer() }>
        Make Transfer
      </button>
    </div>
  );
};

SendPage.propTypes = {
  props: PropTypes
};

const mapStateToProps = (state) => ({
  port: state.root.port
});

const mapDispatchToProps = dispatch => ({
  showLoading: () => dispatch(showLoading()),
  hideLoading: () => dispatch(hideLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(SendPage);
