import { networkId, apiHost, gasPrice, gasLimit, ttl, chainId } from '../config';
import Pact from 'pact-lang-api';
import { getTimestamp } from '../utils/tools';

export const fetchLocal = (code) => {
  const localCmd = {
    pactCode: code,
    envData: {},
    meta: Pact.lang.mkMeta('', '', gasPrice, gasLimit, 0, ttl),
    networkId
  };
  return Pact.fetch.local(localCmd, apiHost);
};

const mkReq = (cmd) => {
  return {
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify(cmd)
  };
};

export const fetchSend = (cmd) => {
  return fetch(`${apiHost}/api/v1/send`, mkReq(Pact.api.mkPublicSend(cmd)));
};

export const getSendCmd = (cmd) => {
  const meta = Pact.lang.mkMeta(cmd.sender, chainId, gasPrice, gasLimit, getTimestamp(), ttl);
  const sendCmd = Pact.api.prepareExecCmd(cmd.keyPairs, undefined, cmd.pactCode, cmd.envData, meta, networkId);
  return sendCmd;
};

export const fetchListen = (cmd) => {
  return Pact.fetch.listen(cmd, apiHost);
};