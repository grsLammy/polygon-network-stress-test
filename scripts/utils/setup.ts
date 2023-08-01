import {getInfuraProjectID, getPrivateKey} from './config';
import {ethers} from 'ethers';
import {Setup} from './types';
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

    return {provider, signer};
  } catch (error) {
    console.log('Error in setup', error);
    process.exit(1);
  }
}
