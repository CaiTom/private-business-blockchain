//overrides metamask v0.2 for our 1.0 version.
//1.0 lets us use async and await instead of promises
import Web3 from 'web3';

const web3 = new Web3(window.web3.currentProvider);
//web3.setProvider(new web3.providers.HttpProvider("http://127.0.0.1:7545"));
export default web3;
