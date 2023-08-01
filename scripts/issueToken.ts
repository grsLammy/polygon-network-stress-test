import {abi, address} from '../deployments/mumbai/TestERC721.json';
import {Setup} from './utils/types';
import {setup} from './utils/setup';
import {ethers} from 'ethers';
import dotenv from 'dotenv';
import crypto from 'crypto';
import ps, {Prompt} from 'prompt-sync';
import {dataMapping} from './utils/dataMapping';
import {redisDB} from './utils/redisDB';
import {saveReceipt} from './utils/saveReceipt';
const prompt: Prompt = ps();
dotenv.config();

const issueToken = async () => {
  try {
    console.log('\n-----------------------------------------');
    console.log('STRESS TEST - ERC721 MINT');
    console.log('-----------------------------------------\n');
    /* ---------------------------- INPUT ------------------------------ */

    const loop: number = prompt(
      'Enter the total number of times you want to mint: '
    );
    if (!loop) return console.log('Input cannot be null');

    /* ---------------------------- SETUP ------------------------------ */

    const {provider, signer, nonce, maxFee, maxPriorityFee}: Setup =
      await setup();

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
      const hash: string = crypto.randomBytes(20).toString('hex');

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
      await mintResponse.wait(1); // wait for 1 block confirmation
      const txReceipt: ethers.providers.TransactionReceipt =
        await provider.getTransactionReceipt(mintResponse.hash);

      if (txReceipt !== null && txReceipt !== undefined) {
        // success transaction receipt gets mapped here
        const mappedReceipt = await dataMapping(txReceipt);

        // saves the mapped transaction receipt in local JSON log file
        await saveReceipt(mappedReceipt);

        // saves the transaction receipt in redisDB
        await redisDB(mappedReceipt);
      }
    }
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
