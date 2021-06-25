console.log('Hello background');

(() => {
  let toRecordHeartbeat = false;

  chrome.runtime.onConnect.addListener((port) => {
    console.log('in connect', port);
    console.assert(port.name === 'heartbeat');
    port.onMessage.addListener((msg) => {
      console.log('in background onMessage', msg);
      if (msg.status === 'open') {
        toRecordHeartbeat = true;
        chrome.storage.local.set({ 'heartbeat': new Date().getTime() });
      } else {
        toRecordHeartbeat = false;
        chrome.storage.local.set({ 'heartbeat': -1 });
      }
    });
  });

  // loop and record heartbeat
  setInterval(() => {
    console.log('toRecordHeartbeat', toRecordHeartbeat);
    if (toRecordHeartbeat) {
      chrome.storage.local.set({ 'heartbeat': new Date().getTime() });
    }
  }, 1000);
})();