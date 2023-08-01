import {
  getInfuraProjectID,
  getMnemonics,
  getPrivateKey,
} from './environmentConfig';
import dotenv from 'dotenv';
const mnemonics = getMnemonics();
import {Setup} from './dataTypes';
import {FUND} from './constants';
import {ethers, Wallet} from 'ethers';
const infuraProjectID = getInfuraProjectID();
dotenv.config();

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
        if (FUND === 1) {
          console.log('\n----------------------------------------------');
          console.log('FUNDING WALLET WITH 0 BALANCES');
          console.log('----------------------------------------------\n');
          // Fund account if balance is zero
          await fundAccountIfBalanceZero(wallets[i], provider);
        } else {
          console.log(
            '\nTerminating the operation since one or more wallet address has 0 balance'
          );
          process.exit(0);
        }
      }
    }
  } catch (error) {
    console.log('\nError while getting balance: ', error);
  }
}

async function fundAccountIfBalanceZero(
  wallet: Wallet,
  provider: ethers.providers.JsonRpcProvider
) {
  try {
    const balance = await provider.getBalance(wallet.address);
    if (balance.isZero()) {
      console.log(`Funding account ${wallet.address} with 2 MATIC`);
      const fundingWallet: ethers.Wallet = new ethers.Wallet(
        getPrivateKey(),
        provider
      );
      const transaction = {
        to: wallet.address,
        value: ethers.utils.parseEther('2'),
      };
      await fundingWallet.sendTransaction(transaction);
    }
  } catch (error) {
    console.log('Error in while funding', error);
    process.exit(1);
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
