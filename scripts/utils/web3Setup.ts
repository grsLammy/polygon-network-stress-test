import {getInfuraProjectID, getMnemonics} from './environmentConfig';
import {ethers, Wallet} from 'ethers';
import {Setup} from './dataTypes';
import dotenv from 'dotenv';
dotenv.config();
const mnemonics = getMnemonics();
const infuraProjectID = getInfuraProjectID();

/*  
  - get the balances of the wallet addresses used for testing.
  - checks if any of the wallet addresses balance is 0
  - if any wallet addresses balance is 0 then terminate.
*/
const balance: ethers.BigNumber[] = [];
async function getBalances(
  numberOfAccounts: number,
  wallets: Wallet[],
  provider: ethers.providers.InfuraProvider
): Promise<void> {
  try {
    for (let i = 0; i < numberOfAccounts; i++) {
      balance[i] = await provider.getBalance(wallets[i].address);
      const balanceInEth = ethers.utils.formatEther(balance[i]);
      console.log(
        `Wallet[#${i + 1}]: ${wallets[
          i
        ].address.toLowerCase()} ==> ${balanceInEth} MATIC`
      );
    }
  } catch (error) {
    console.log('\nError while getting balance: ', error);
  }
}

async function checkBalances(
  numberOfAccounts: number,
  wallets: Wallet[],
  provider: ethers.providers.InfuraProvider
): Promise<void> {
  try {
    console.log('\n----------------------------------------------');
    console.log('CHECKING WALLET BALANCES');
    console.log('----------------------------------------------\n');

    await getBalances(numberOfAccounts, wallets, provider);
    const zero = ethers.BigNumber.from(0);
    for (let i = 0; i < balance.length; i++) {
      if (balance[i].eq(zero)) {
        console.log(
          '\nTerminating the operation since one or more wallet address has 0 balance'
        );
        process.exit(0);
      }
    }
  } catch (error) {
    console.log('\nError while getting balance: ', error);
  }
}

export async function web3Setup(numberOfAccounts: number): Promise<Setup> {
  try {
    console.log('\n----------------------------------------------');
    console.log('USING BELOW WALLETS');
    console.log('----------------------------------------------\n');
    const wallets: Wallet[] = [];
    /* 
      USING INFURA PROVIDER
    */
    const provider: ethers.providers.InfuraProvider =
      new ethers.providers.InfuraProvider('maticmum', infuraProjectID);

    const HDNode = ethers.utils.HDNode.fromMnemonic(mnemonics);
    for (let i = 0; i < numberOfAccounts; i++) {
      const derivedNode = HDNode.derivePath(`m/44'/60'/0'/0/${i}`);
      // convert to ethers.js Wallet instances
      wallets.push(new Wallet(derivedNode.privateKey, provider));
      console.log(`wallets[#${i + 1}]: ${wallets[i].address.toLowerCase()}`);
    }
    await checkBalances(numberOfAccounts, wallets, provider);
    return {provider, wallets};
  } catch (error) {
    console.log('Error in setup', error);
    process.exit(1);
  }
}
