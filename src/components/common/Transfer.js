import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';

import { shortAddress } from '../../utils/security';

export const Transfer = (props) => {
  const { wallet } = props;

  console.log('Transfer', wallet);
  const clickReceive = () => {

  };

  return (
    <div className='w-full flex flex-col items-center'>
      <div data-role='account title' className='w-full border-b flex flex-col items-center py-3'>
        <p className='text-lg'>Account 1</p>
        <span>{shortAddress(wallet.address)}</span>
      </div>
      <div data-role='account brief' className='flex flex-col items-center'>
        <img src='/img/kda_logo.png' className='w-10 my-5 rounded-full' alt='kda logo' />
        <div className='text-3xl font-bold'>{wallet.balance.coin} KDA</div>
        <div className='flex items-center space-x-16 my-6'>
          <button className='border-none flex flex-col items-center space-y-2' onClick={ () => clickReceive() }>
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
