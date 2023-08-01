import {abi, address} from '../deployments/mumbai/TestERC721.json';
import {Setup, GasData} from './utils/types';
import {setup} from './utils/setup';
import {ethers} from 'ethers';
import dotenv from 'dotenv';
import crypto from 'crypto';
import ps, {Prompt} from 'prompt-sync';
import {dataMapping} from './utils/dataMapping';
import {saveReceipt} from './utils/saveReceipt';
import {fetchGasPrice} from './utils/fetchGasPrice';
import {connectToRedis} from './utils/connectToRedis';
import {storeReceiptInRedis} from './utils/storeReceiptInRedis';
const prompt: Prompt = ps();
dotenv.config();

const issueToken = async () => {
  try {
    /*
      ESTABLISH REDIS CONNECTION
    */
    const redisClient = await connectToRedis();

    console.log('\n-----------------------------------------');
    console.log('STRESS TEST - ERC721 MINT');
    console.log('-----------------------------------------\n');
    /* ---------------------------- INPUT ------------------------------ */

    const loop: number = prompt(
      'Enter the total number of times you want to mint: '
    );
    if (!loop) return console.log('Input cannot be null');

    /* ---------------------------- SETUP ------------------------------ */

    const {provider, signer}: Setup = await setup();

    // Calculate the end time for the loop
    const endTime = Date.now() + 60000; // 60 seconds (60,000 milliseconds)

    // Initialize a variable to keep track of the number of NFTs minted
    let mintedCount = 0;

    /* ---------------------------- issueToken ---------------------------- */

    /* 
      INITIALIZE TESTERC721 INSTANCE AND CONNECT WITH SIGNER
    */
    const testERC721Instance: ethers.Contract = new ethers.Contract(
      address,
      abi,
      provider
    );
    const testERC721: ethers.Contract = testERC721Instance.connect(signer);

    /* 
      MINT ERC721 
    */
    console.log('\n-----------------------------------------');
    console.log(`MINTING ${loop} ERC721 NFTs...`);
    console.log('-----------------------------------------\n');

    for (let i = 0; i < loop; i++) {
      /*
        GENERATE RANDOM HASH
      */
      const hash: string = crypto.randomBytes(20).toString('hex');

      /*
        GET SIGNER NONCE
      */
      const nonce: number = await provider.getTransactionCount(signer.address);

      // Fetch the latest gas price data from the polygon v2 gas station API
      const {maxFee, maxPriorityFee}: GasData = await fetchGasPrice();

      /*
        ESTIMATE GAS
      */
      const estimatedGasLimit: ethers.BigNumber =
        await testERC721.estimateGas.issueToken(signer.address, hash, {
          gasLimit: 14_999_999,
          nonce: nonce,
          maxFeePerGas: maxFee,
          maxPriorityFeePerGas: maxPriorityFee,
        });

      /*
        MINT NFT
      */
      const mintResponse: ethers.ContractTransaction =
        await testERC721.issueToken(signer.address, hash, {
          gasLimit: estimatedGasLimit,
          nonce: nonce,
          maxFeePerGas: maxFee,
          maxPriorityFeePerGas: maxPriorityFee,
        });
      await mintResponse.wait();
      const txReceipt: ethers.providers.TransactionReceipt =
        await provider.getTransactionReceipt(mintResponse.hash);

      if (txReceipt !== null && txReceipt !== undefined) {
        // Increment the mintedCount for each successful mint
        mintedCount++;

        // success transaction receipt gets mapped here
        const mappedReceipt = await dataMapping(txReceipt);

        // saves the mapped transaction receipt in local JSON log file
        await saveReceipt(mappedReceipt);

        // saves the transaction receipt in redisDB
        await storeReceiptInRedis(mappedReceipt, redisClient);
      }
      // If the elapsed time exceeds 60 seconds, break the loop
      if (Date.now() >= endTime) {
        console.log(
          `Loop stopped after minting ${mintedCount} NFTs in 60 seconds.`
        );
        break;
      }
    }
    console.log(
      `${mintedCount} NFTs minted and logs stored at local and Redis`
    );
  } catch (error) {
    console.log('Error in issueToken', error);
    process.exit(1);
  }
};

issueToken()
  .then(() => {
    console.log('\n\n---------- ENDING ALL PROCESS ----------\n\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('error', error);
    process.exit(1);
  });
