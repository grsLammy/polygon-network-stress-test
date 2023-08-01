import {ethers} from 'ethers';
import PQueue from 'p-queue';
import dotenv from 'dotenv';
import crypto from 'crypto';
import {gasPriceFetcher} from './gasPriceFetcher';

dotenv.config();

/* 
  INITIALIZE A QUEUE FOR EACH ACCOUNT, THIS ENSURES THAT TRANSACTIONS
  FOR EACH ACCOUNT ARE CREATED SEQUENTIALLY, WHICH SIMPLIFIES NONCE MANGEMENT
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
  account: ethers.Wallet,
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
  const contract: ethers.Contract = contractInstance.connect(account);
  const accountData = {};
  /* 
    CHECK THE USERS NONCE MAP FIRST
  */
  if (!(account.address in accountData)) {
    /* 
      IF THERE IS NO ENTRY FOR THIS ACCOUNT, FETCH THE NONCE FROM THE PROVIDER
    */
    accountData[account.address] = await provider.getTransactionCount(
      account.address
    );
  } else {
    /* 
      IF THERE IS AN ENTRY FOR THIS ACCOUNT, INCREMENT THE NONCE
    */
    accountData[account.address]++;
  }

  const gasEstimate = await contract.estimateGas.issueToken(
    account.address,
    hash,
    {
      nonce: accountData[account.address].nonce,
      gasLimit: 14_999_999,
      maxFeePerGas: maxFee,
      maxPriorityFeePerGas: maxPriorityFee,
    }
  );

  /* 
    ADD THE TRANSACTION TO THE ACCOUNT'S QUEUE
  */
  txQueues[account.address] =
    txQueues[account.address] || new PQueue({concurrency: 1});

  /* 
    THIS WILL ENSURE THAT TRANSACTIONS FOR EACH ACCOUNT ARE CREATED SEQUENTIALLY
    THUS, EACH TRANSACTION WILL HAVE CORRECT NONCE
  */
  return txQueues[account.address].add(() =>
    retryOperation(async () => {
      return contract.issueToken(account.address, hash, {
        nonce: accountData[account.address].nonce,
        gasLimit: gasEstimate,
        maxFeePerGas: maxFee,
        maxPriorityFeePerGas: maxPriorityFee,
      });
    }, provider)
  );
}
