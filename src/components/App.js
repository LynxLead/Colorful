import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Route, Redirect, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';
import ReactLoading from 'react-loading';

import InitializePage from './entries/InitializePage';
import HomePage from './entries/HomePage';
import { createBaseMsg, hideLoading, savePort } from '../store/actions/actionCreartor';

/* global chrome */
export const App = (props) => {

  const { loading, loadingText, port, savePort, hide } = props;

  if (!port) {
    console.log('create new port');
    const newPort = chrome.runtime.connect({name: 'colorful.auth'});
    savePort(newPort);
    const msg = createBaseMsg();
    newPort.postMessage({ 
      ...msg,
      scene: 'repost'
    });
  }

  return (
    <div data-role='app-container' className='relative'>
      <Router basename='/'>
        <ToastContainer position='top-center' />
        { loading && 
          <div 
            className='absolute top-36 w-full'
          >
            <div className='w-80 h-80 mx-auto mt-32 flex flex-col items-center justify-center relative border mb-20 p-10'>
              <ReactLoading type='cubes' color='rgb(254, 94, 174)' height='60px' width='60px' className='mt-10' />
              <span className='text-lg mt-5'>{ loadingText || '' }</span>
              <div className='absolute top-4 right-4 text-gray-300 flex items-center cursor-pointer' onClick={ () => hideLoading() }>
                <FontAwesomeIcon icon={fa.faTimes} size='lg' />
              </div>
            </div>
          </div>
        }
        <Switch>
          <Route path='/initialize'>
            <InitializePage />
          </Route>
          <Route path='/home'>
            <HomePage baseHash='home' />
          </Route>
          <Route path='/popup'>
            <HomePage baseHash='popup' />
          </Route>
          <Redirect from='/' to='/home' />
        </Switch>
      </Router>
    </div>
  );
};


App.propTypes = {
  loading: PropTypes.bool.isRequired
};

const mapStateToProps = state => ({
  loading: state.root.loading,
  loadingText: state.root.loadingText,
  port: state.root.port
});

const mapDispatchToProps = dispatch => ({
  savePort: (port) => dispatch(savePort(port)),
  hideLoading: () => dispatch(hideLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(App);