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
  const [confirmStatus, setConfirmStatus] = useState('');

  const cancelTransfer = () => {
    setConfirmStatus('');
  };

  const confirmTransfer = () => {
    clickTransfer(true);
  };

  const clickTransfer = async (confirmed=false) => {
    const { sender, receiver, receiverKey, amount } = txData;
    
    // validate receiver
    if (!confirmed) {
      const code = `(coin.get-balance "${receiver}")`;
      const requestForLocal = fetchLocal(code);
      const result = await requestForLocal.then(data => {
        const result = data.result;
        if (result.status !== 'success') {
          toast.warning('Receiver is not existing');
          setConfirmStatus('confirming');
        } else {
          return result.data;
        }
      });
      if (!result) {
        return;
      }
    } 

    let pactCode;
    if (confirmed) {
      pactCode = `(coin.transfer-create "${sender}" "${receiver}" (read-keyset "ks") (read-decimal "amount"))`
    } else {
      pactCode = `(coin.transfer "${sender}" "${receiver}" (read-decimal "amount"))`
    }

    const cmd = {
      keyPairs: {
        publicKey: wallet.publicKey,
        clist: [
          Pact.lang.mkCap('gas', 'pay gas', 'coin.GAS')['cap'],
          Pact.lang.mkCap('transfer', 'transfer coin', 'coin.TRANSFER', [sender, receiver, amount])['cap']
        ]
      },
      pactCode,
      envData: {
        amount,
        ks: [receiverKey]
      },
      sender
    };
    const unsignedCmd = getSendCmd(cmd);

    const requestForSend = fetchSend(unsignedCmd);
    showLoading('Please wait 30~90 seconds');
    requestForSend.then(data => {
      const requestKey = data.requestKeys[0];
      const listenCmd = {
        'listen': requestKey
      };
      const requestForListen = fetchListen(listenCmd);
      requestForListen.then((data) => {
        hideLoading();
        setConfirmStatus('');
      });
    });
  
  };

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
      { confirmStatus !== '' && <label className='text-lg font-bold mt-10 mb-2'>Receiver Key <span className='text-xs text-green-500 ml-5'>On Chain {chainId}</span></label> }
      { confirmStatus !== '' &&
      <div className='w-full flex items-center justify-center h-12'>
        <input type='text' className='w-3/4 h-full border px-3' onChange={ (e) => setTxData({...txData, receiverKey: e.target.value}) } />
      </div>
      }
      <label className='text-lg font-bold mt-10 mb-2'>Amount</label>
      <div className='w-full flex items-center justify-center h-12'>
        <input type='number' className='w-3/4 h-full border px-3' onChange={ (e) => setTxData({...txData, amount: parseFloat(e.target.value)}) } />
      </div>
      {
        confirmStatus === '' ? 
        <button className='px-8 py-2 bg-cb-pink text-white rounded mt-10' onClick={ () => clickTransfer() }>
          Make Transfer
        </button> :
        <div className='flex justify-between'>
          <button className='w-5/12 px-8 py-2 bg-gray-700 text-white rounded mt-10' onClick={ () => cancelTransfer() }>
            Cancel
          </button>
          <button className='w-5/12 px-8 py-2 bg-cb-pink text-white rounded mt-10' onClick={ () => confirmTransfer() }>
            Confirm Transfer
          </button>
        </div>
      }
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
  showLoading: (text=null) => dispatch(showLoading(text)),
  hideLoading: () => dispatch(hideLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(SendPage);
