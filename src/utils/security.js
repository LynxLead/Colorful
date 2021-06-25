import ph from 'password-hash';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';

export const savePassword = (password) => {
  return ph.generate(password);
};

export const verifyPassword = (password, passwordHash) => {
  return ph.verify(password, passwordHash);
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