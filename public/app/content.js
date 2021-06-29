// content.js

// create port between content and background
const port = chrome.runtime.connect({name: 'colorful.auth'}); 

port.onMessage.addListener(async (msg) => {
  if (msg.source === 'colorful.background') {
    window.postMessage({
      ...msg,
      source: 'colorful.content'
    });
  }
});

window.addEventListener('message', (event) => {
  const data = event.data;
  if (data.source === 'colorblock.webpage') {
    port.postMessage({
      ...data,
      source: 'colorful.content'
    });
  }
});