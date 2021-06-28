// content.js

// create port between content and background
const port = chrome.runtime.connect({name: 'colorful.auth'}); 

port.onMessage.addListener(async (msg) => {
  if (msg.source === 'colorful.background') {
    console.log('in content.js, receive and post [PORT] msg', msg);
    window.postMessage({
      ...msg,
      source: 'colorful.content'
    });
  }
});

window.addEventListener('message', (event) => {
  const data = event.data;
  if (data.source === 'colorblock.webpage') {
    console.log('in content.js, receive and post [WINDOW] msg', data);
    port.postMessage({
      ...data,
      source: 'colorful.content'
    });
  }
});