import {ethers} from 'ethers';
import PQueue from 'p-queue';
import dotenv from 'dotenv';
import crypto from 'crypto';
import {gasPriceFetcher} from './gasPriceFetcher';

dotenv.config();

/* 
  INITIALIZE A QUEUE FOR EACH WALLET, THIS ENSURES THAT TRANSACTIONS
  FOR EACH WALLET ARE CREATED SEQUENTIALLY, WHICH SIMPLIFIES NONCE MANGEMENT
*/
const txQueues = {};
/* 
  THIS FUNCTION TAKES A TRANSACTION REQUEST (A PROMISE THAT RESOLVES TO A TRANSACTION)
  AND A PROVIDER, AND WAITS UNTIL THE TRANSACTION IS MINED
*/
async function waitForTransaction(
  txRequestPromise,
  provider: ethers.providers.JsonRpcProvider
) {
  const txResponse = await txRequestPromise;
  return await provider.waitForTransaction(txResponse.hash);
}
/* 
  THIS FUNCTION TAKES A FUNCTION THAT RETUNRS A TRANSACTION REQUEST (A PROMISE THAT RESOLVES TO A TRANSACTION)
  AND A PROVIDER, AND RETRIES THE TRANSACTION 3 TIMES IF FAILED
*/
async function retryOperation(
  operation,
  provider: ethers.providers.JsonRpcProvider,
  retries = 3
) {
  for (let i = 0; i < retries; i++) {
    try {
      return await waitForTransaction(operation(), provider);
    } catch (error) {
      console.log(
        `Transaction failed with error: ${error}. Retrying ${
          retries - i - 1
        } more times.`
      );
    }
  }

  throw new Error('Transaction failed after ' + retries + ' retries');
}

export async function tokenMinter(
  wallet: ethers.Wallet,
  provider: ethers.providers.JsonRpcProvider,
  contractInstance: ethers.Contract
): Promise<ethers.providers.TransactionReceipt> {
  /*
    GENERATE RANDOM HASH
  */
  const hash = crypto.randomBytes(20).toString('hex');

  /*
    FETCH FAST GAS PRICE
  */
  const {maxFee, maxPriorityFee} = await gasPriceFetcher();

  /* 
    CONNECT WITH SIGNER
  */
  const contract: ethers.Contract = contractInstance.connect(wallet);
  const walletData = {};
  /* 
    CHECK THE USERS NONCE MAP FIRST
  */
  if (!(wallet.address in walletData)) {
    /* 
      IF THERE IS NO ENTRY FOR THIS WALLET, FETCH THE NONCE FROM THE PROVIDER
    */
    walletData[wallet.address] = await provider.getTransactionCount(
      wallet.address
    );
  } else {
    /* 
      IF THERE IS AN ENTRY FOR THIS WALLET, INCREMENT THE NONCE
    */
    walletData[wallet.address]++;
  }

  const gasEstimate = await contract.estimateGas.issueToken(
    wallet.address,
    hash,
    {
      nonce: walletData[wallet.address].nonce,
      gasLimit: 14_999_999,
      maxFeePerGas: maxFee,
      maxPriorityFeePerGas: maxPriorityFee,
    }
  );

  /* 
    ADD THE TRANSACTION TO THE WALLET'S QUEUE
  */
  txQueues[wallet.address] =
    txQueues[wallet.address] || new PQueue({concurrency: 1});

  /* 
    THIS WILL ENSURE THAT TRANSACTIONS FOR EACH WALLET ARE CREATED SEQUENTIALLY
    THUS, EACH TRANSACTION WILL HAVE CORRECT NONCE
  */
  return txQueues[wallet.address].add(() =>
    retryOperation(async () => {
      return contract.issueToken(wallet.address, hash, {
        nonce: walletData[wallet.address].nonce,
        gasLimit: gasEstimate,
        maxFeePerGas: maxFee,
        maxPriorityFeePerGas: maxPriorityFee,
      });
    }, provider)
  );
}
