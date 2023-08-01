import {abi, address} from '../deployments/mumbai/TestERC721.json';
import {redisReceiptStore} from './utils/redisReceiptStore';
import {tokenMinter} from './utils/tokenMinter'; // import the mintToken function
import {redisClient} from './utils/redisClient';
import {ethers} from 'ethers';
import readline from 'readline';
import PromisePool from 'es6-promise-pool';
import {web3Setup} from './utils/web3Setup';
import {receiptSaver} from './utils/receiptSaver';
import {CONCURRENCY_LEVEL} from './utils/constants';
import {transactionDataMapper} from './utils/transactionDataMapper';

async function main() {
  console.clear();

  console.log('\n----------------------------------------------');
  console.log('STRESS TEST - ERC721 MINT');
  console.log('----------------------------------------------\n');

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

  const tokensPerAccount = Number(
    await askQuestion('How many tokens per account? ')
  );
  const numberOfAccounts = Number(await askQuestion('How many accounts? '));

  rl.close();

  /*
    INITIALIZE PROVIDER AND CONTRACT
  */
  const {provider, wallets} = await web3Setup(numberOfAccounts);

  /*
    INITIALIZE CONTRACT INSTANCE
  */
  const contractInstance = new ethers.Contract(address, abi, provider);

  /*
      GENERATE AN ARRAY OF PROMISES FOR EACH MINT OPERATION
  */
  function* createMintOperations() {
    for (let i = 0; i < Number(numberOfAccounts); i++) {
      const wallet = wallets[i];
      for (let j = 0; j < Number(tokensPerAccount); j++) {
        yield tokenMinter(wallet, provider, contractInstance);
      }
    }
  }

  const mintOperations = createMintOperations();

  /*
      USE PROMISE POOL TO CONCURRENTLY MINT TOKENS WITH A MAXIMUM CONCURRENCY
  */
  new PromisePool(() => mintOperations.next().value, CONCURRENCY_LEVEL);

  const mintPromises: Promise<ethers.providers.TransactionReceipt>[] = [];
  let result;
  while (!(result = mintOperations.next()).done) {
    mintPromises.push(result.value);
  }
  console.log('\n----------------------------------------------');
  console.log('STRESS TEST - START MINTING');
  console.log('----------------------------------------------\n');

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

  console.log(
    `\n${tokensPerAccount * numberOfAccounts} NFTs have been minted `
  );
}

main()
  .then(() => {
    console.log('\n\n-------------- ENDING ALL PROCESS --------------\n\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('error', error);
    process.exit(1);
  });
