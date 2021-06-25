import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Pact from 'pact-lang-api';

import { chainsCount, gasPrice, gasLimit, ttl, networkId, apiHost } from '../../config';
import { getTimestamp } from '../../utils/tools';
import { hideLoading, showLoading } from '../../store/actions/actionCreartor';
import { toast } from 'react-toastify';

export const SendPage = (props) => {

  const { wallet, showLoading, hideLoading } = props;
  const [txData, setTxData] = useState({
    sender: wallet.address,
    senderChainId: '0',
    receiverChainId: '0',
  });

  const chainIds = Array(chainsCount).fill(0).map((_, i) => `${i}`);

  const changeReceiver = async (receiver) => {
    const cmd = {
      pactCode: `(coin.get-balance "${receiver}")`,
      envData: {},
      meta: Pact.lang.mkMeta('', '', gasPrice, gasLimit, 0, ttl),
      networkId
    };
    await Pact.fetch.local(cmd, apiHost).then(data => {
      const result = data.result;
      if (result.status !== 'success') {
        toast.warning('Receiver is not existing');
      }
    });
    setTxData({...txData, receiver});
  };

  const clickTransfer = () => {
    console.log(txData);
    const { sender, receiver, senderChainId, receiverChainId, amount } = txData;
    const cmd = {
      keyPairs: {
        publicKey: wallet.real.publicKey,
        secretKey: wallet.real.secretKey,
        clist: [
          Pact.lang.mkCap('gas', 'pay gas', 'coin.GAS')['cap'],
          Pact.lang.mkCap('transfer', 'transfer coin', 'coin.TRANSFER', [sender, receiver, amount])['cap']
        ]
      },
      pactCode: `(coin.transfer "${sender}" "${receiver}" (read-decimal "amount"))`,
      envData: {
        amount
      },
      meta: Pact.lang.mkMeta(sender, senderChainId, gasPrice, gasLimit, getTimestamp(), ttl),
      networkId
    };
    console.log('cmd', cmd);
    showLoading();
    Pact.fetch.send(cmd, apiHost).then(data => {
      console.log(data);
      const requestKey = data.requestKeys[0];
      const listenCmd = {
        'listen': requestKey
      };
      Pact.fetch.listen(listenCmd, apiHost).then((data) => {
        console.log(data);
        hideLoading();
      });
    });
  };

  return (
    <div className='w-full flex flex-col items-center'>
      <label className='text-lg font-bold mt-10 mb-2'>Sender</label>
      <div className='w-full flex items-center justify-center h-12'>
        <input type='text' className='w-1/2 h-full border px-2' value={wallet.address} readOnly />
        <select className='w-1/4 h-full border' onChange={ (e) => setTxData({...txData, senderChainId: chainIds[e.target.selectedIndex]}) }>
          { chainIds.map(chainId => (
              <option>
                { `Chain ${chainId}` }
              </option>
            ))
          }
        </select>
      </div>
      <label className='text-lg font-bold mt-10 mb-2'>Receiver</label>
      <div className='w-full flex items-center justify-center h-12'>
        <input type='text' className='w-1/2 h-full border' onChange={ (e) => changeReceiver(e.target.value) } />
        <select className='w-1/4 h-full border' onChange={ (e) => setTxData({...txData, receiverChainId: chainIds[e.target.selectedIndex]}) }>
          { chainIds.map(chainId => (
              <option>
                { `Chain ${chainId}` }
              </option>
            ))
          }
        </select>
      </div>
      <label className='text-lg font-bold mt-10 mb-2'>Amount</label>
      <div className='w-full flex items-center justify-center h-12'>
        <input type='number' className='w-3/4 h-full border' onChange={ (e) => setTxData({...txData, amount: parseFloat(e.target.value)}) } />
      </div>
      <button className='w-36 flex items-center justify-center h-12' onClick={ () => clickTransfer() }>
        Make Transfer
      </button>
    </div>
  );
};

SendPage.propTypes = {
  props: PropTypes
};

const mapStateToProps = (state) => ({
  
});

const mapDispatchToProps = dispatch => ({
  showLoading: () => dispatch(showLoading()),
  hideLoading: () => dispatch(hideLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(SendPage);
