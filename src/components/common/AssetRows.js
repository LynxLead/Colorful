import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

export const AssetRows = (props) => {
  const { wallet } = props;
  console.log('AssetRows', wallet);
  return (
    <div data-role='asset rows' className='w-full h-96 flex flex-col items-center'>
      <div className='w-full h-24 flex justify-between items-center border-b px-6'>
        <div className='flex items-center space-x-5 text-lg'>
          <img src='/img/colorful_logo.svg' className='w-12' alt='colorful logo' />
          {wallet.balance.coin} KDA
        </div>
        <div>
          <Link to='/asset-kda'>
            <FontAwesomeIcon icon={fa.faArrowRight} size='2x' className='text-cb-pink cursor-pointer' />
          </Link>
        </div>
      </div>
    </div>
  );
};

AssetRows.propTypes = {
  props: PropTypes
};

const mapStateToProps = (state) => ({
  
});

const mapDispatchToProps = {
  
};

export default connect(mapStateToProps, mapDispatchToProps)(AssetRows);
