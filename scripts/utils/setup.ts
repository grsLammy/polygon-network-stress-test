import {getInfuraProjectID, getPrivateKey} from './config';
import {fetchGasPrice} from './fetchGasPrice';
import {ethers} from 'ethers';
import {GasData, Setup} from './types';
import dotenv from 'dotenv';
dotenv.config();

const privateKey = getPrivateKey();
const infuraProjectID = getInfuraProjectID();

export async function setup(): Promise<Setup> {
  try {
    /* 
    USING INFURA PROVIDER
  */
    const provider: ethers.providers.InfuraProvider =
      new ethers.providers.InfuraProvider('maticmum', infuraProjectID);

    /* 
    INITIALIZE SIGNER 
  */
    const signer: ethers.Wallet = new ethers.Wallet(privateKey, provider);

    /*
    GET SIGNER NONCE
  */
    const nonce: number = await provider.getTransactionCount(signer.address);

    // Fetch the latest gas price data from the polygon v2 gas station API
    const {maxFee, maxPriorityFee}: GasData = await fetchGasPrice();

    return {provider, signer, nonce, maxFee, maxPriorityFee};
  } catch (error) {
    console.log('Error in setup', error);
    process.exit(1);
  }
}
