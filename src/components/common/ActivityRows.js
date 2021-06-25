import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

export const ActivityRows = (props) => {
  return (
    <div className='text-center h-96'>
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
