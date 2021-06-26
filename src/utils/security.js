import SHA3 from 'crypto-js/sha3';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';

export const encryptPassword = (password) => {
  return SHA3(password).toString();
};

export const encryptKey = (key, secret) => {
  return AES.encrypt(key, secret).toString();
};

export const decryptKey = (key, secret) => {
  return AES.decrypt(key, secret).toString(Utf8);
};

export const shortAddress = (address) => {
  return address.slice(0, 4) + '****' + address.slice(-4);
};