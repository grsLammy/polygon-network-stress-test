import {ethers} from 'ethers';
import {abi, address} from '../deployments/mumbai/TestERC721.json';
import {tokenMinter} from './utils/tokenMinter'; // import the mintToken function
import {redisClient} from './utils/redisClient';
import {redisReceiptStore} from './utils/redisReceiptStore';
import {receiptSaver} from './utils/receiptSaver';
import PromisePool from 'es6-promise-pool';
import readline from 'readline';
import {web3ProviderSetup} from './utils/web3ProviderSetup';
import {transactionDataMapper} from './utils/transactionDataMapper';

async function main() {
  console.log('\n-----------------------------------------');
  console.log('STRESS TEST - ERC721 MINT');
  console.log('-----------------------------------------\n');
  /*
    INITIALIZE PROVIDER AND CONTRACT
  */
  const {provider, accounts} = await web3ProviderSetup();

  /*
    INITIALIZE CONTRACT INSTANCE
  */
  const contractInstance = new ethers.Contract(address, abi, provider);

  /*
    CONNECT TO REDIS
  */
  const client = await redisClient();

  /*
    ASK USER INPUT
  */
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (query) =>
    new Promise((resolve) => rl.question(query, resolve));

  const tokensPerAccount = await askQuestion('How many tokens per account? ');
  const numberOfAccounts = await askQuestion('How many accounts? ');

  rl.close();

  /*
    GENERATE AN ARRAY OF PROMISES FOR EACH MINT OPERATION
  */
  function* createMintOperations() {
    for (let i = 0; i < Number(numberOfAccounts); i++) {
      const account = accounts[i];
      for (let j = 0; j < Number(tokensPerAccount); j++) {
        yield tokenMinter(account, provider, contractInstance);
      }
    }
  }

  const mintOperations = createMintOperations();

  /*
    USE PROMISE POOL TO CONCURRENTLY MINT TOKENS WITH A MAIMUM CONCURRENCY
  */
  const pool = new PromisePool(() => mintOperations.next().value, 10);

  const mintPromises: Promise<ethers.providers.TransactionReceipt>[] = [];
  let result;
  while (!(result = mintOperations.next()).done) {
    mintPromises.push(result.value);
  }

  await Promise.all(
    mintPromises.map((mintPromise) =>
      mintPromise
        .then((txReceipt) => transactionDataMapper(txReceipt))
        .then((mappedReceipt) => {
          redisReceiptStore(mappedReceipt, client);
          return mappedReceipt;
        })
        .then((mappedReceipt) => receiptSaver(mappedReceipt))
        .catch((err) => console.log(err))
    )
  );

  console.log(`\nNFTs have been minted`);
}

main()
  .then(() => {
    console.log('\n\n---------- ENDING ALL PROCESS ----------\n\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('error', error);
    process.exit(1);
  });
