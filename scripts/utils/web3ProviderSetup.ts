import {getInfuraProjectID} from './environmentConfig';
import {accountLoader} from './accountLoader'; // function to load your accounts from file or environment
import {ethers} from 'ethers';
import {Setup} from './dataTypes';
import dotenv from 'dotenv';
dotenv.config();

const infuraProjectID = getInfuraProjectID();

export async function web3ProviderSetup(): Promise<Setup> {
  try {
    /* 
      USING INFURA PROVIDER
    */
    const provider: ethers.providers.InfuraProvider =
      new ethers.providers.InfuraProvider('maticmum', infuraProjectID);

    /* 
      LOAD ACCOUNTS
    */
    const accounts = accountLoader(provider);

    return {provider, accounts};
  } catch (error) {
    console.log('Error in setup', error);
    process.exit(1);
  }
}
