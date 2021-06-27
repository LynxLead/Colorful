import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';

import { shortAddress } from '../../utils/security';
import { toast } from 'react-toastify';

export const Transfer = (props) => {
  const { wallet } = props;

  const [showReceiverModal, setShowReceiverModal] = useState(false);

  console.log('Transfer', wallet);
  const copyInfo = (type) => {
    if (type === 'address') {
      navigator.clipboard.writeText(wallet.address);
      toast.success('Address is copied');
    }
    else if (type === 'publicKey') {
      navigator.clipboard.writeText(wallet.publicKey);
      toast.success('Public Key is copied');
    }
  };

  return (
    <div className='w-full flex flex-col items-center relative'>
      { showReceiverModal &&
        <div className='absolute top-20 w-full'>
          <div className='w-1/2 mx-auto relative bg-white z-50 border rounded'>
            <FontAwesomeIcon icon={fa.faTimes} size='xl' className='text-cb-pink absolute top-5 right-5 cursor-pointer' onClick={ () => setShowReceiverModal(false) } />
            <div className='flex flex-col items-center space-y-3 text-lg pt-30'>
              <p>Copy to clipboard</p>
              <p className='cursor-pointer text-center' onClick={ () => copyInfo('address') }>
                <span className='font-semibold'>Address: </span>
                <span className='text-sm'>{wallet.address}</span>
              </p>
              <p className='cursor-pointer text-center' onClick={ () => copyInfo('publicKey') }>
                <span className='font-semibold'>Public Key: </span>
                <span className='text-sm'>{wallet.publicKey}</span>
              </p>
            </div>
          </div>
        </div>
      }
      <div data-role='account title' className='w-full border-b flex flex-col items-center py-3'>
        <p className='text-lg'>Wallet 1</p>
        <span>{shortAddress(wallet.address)}</span>
      </div>
      <div data-role='account brief' className='flex flex-col items-center'>
        <img src='/img/kda_logo.png' className='w-10 my-5 rounded-full' alt='kda logo' />
        <div className='text-3xl font-bold'>{wallet.balance.coin} KDA</div>
        <div className='flex items-center space-x-16 my-6'>
          <button className='border-none flex flex-col items-center space-y-2' onClick={ () => setShowReceiverModal(true) }>
            <FontAwesomeIcon icon={fa.faDownload} size='2x' className='text-cb-pink' />
            <span className='text-lg'>Receive</span>
          </button>
          <Link className='border-none flex flex-col items-center space-y-2' to='/send'>
            <FontAwesomeIcon icon={fa.faUpload} size='2x' className='text-cb-pink' />
            <span className='text-lg'>Send</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

Transfer.propTypes = {
  props: PropTypes
};

const mapStateToProps = (state) => ({
  
});

const mapDispatchToProps = {
  
};

export default connect(mapStateToProps, mapDispatchToProps)(Transfer);
