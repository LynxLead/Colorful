import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';

/* global chrome */

export const ActivityRows = (props) => {

  const [records, setRecords] = useState([]);

  const { wallet, baseHash } = props;

  useEffect(() => {
    const fetchActivities = async () => {
      const url = `https://estats.chainweb.com/txs/search?search=${wallet.address}&offset=0&limit=20`
      const data = await fetch(url).then(res => res.json());
      console.log(data);
      setRecords(data);
    };

    fetchActivities();
  }, []);

  return records.length > 0 ? (
    <div className='w-full'>
      { records.map(record => (
          <div className='w-full h-12 flex items-center justify-between space-x-3 px-10 border-b'>
            <div className='w-2/12 flex justify-center'>
              <FontAwesomeIcon icon={record.result === 'TxFailed' ? fa.faTimes : fa.faCheck} size='2x' className='text-cb-pink' />
            </div>
            <span className='w-3/12 flex justify-center'>{record.creationTime}</span>
            <p className='w-4/12 truncate text-left'>{record.code.slice(0, 100)}</p>
            <div className='w-3/12 flex justify-center'><button onClick={ () => chrome.tabs.create({ url: `https://explorer.chainweb.com/mainnet/chain/${record.chain}/block/${record.blockHash}/txs`}) }><FontAwesomeIcon icon={fa.faCube} size='2x' /></button></div>
          </div>
        ))
      }
    </div>
  ) : (
    <div className='text-center h-24 pt-10 text-lg'>
      No Activities
    </div>
  );
};

ActivityRows.propTypes = {
  props: PropTypes
};

const mapStateToProps = (state) => ({
  
});

const mapDispatchToProps = {
  
};

export default connect(mapStateToProps, mapDispatchToProps)(ActivityRows);
