import fetch, {Response} from 'node-fetch';
import {GasData, GasApiResponse} from './types';

export async function fetchGasPrice(): Promise<GasData> {
  try {
    const response: Response = await fetch(
      'https://gasstation-testnet.polygon.technology/v2'
    );

    const gasData: GasApiResponse = await response.json(); // Extract JSON data from the response

    // Get the maxFee and maxPriorityFee for fast
    const maxFeeInGWEI = gasData.fast.maxFee;
    const maxPriorityFeeInGWEI = gasData.fast.maxPriorityFee;

    /* Convert the fetched GWEI gas price to WEI after converting ignore the decimal value
     * as the transaction payload only accepts whole number
     */
    const maxFee = Math.trunc(maxFeeInGWEI * 10 ** 9);
    const maxPriorityFee = Math.trunc(maxPriorityFeeInGWEI * 10 ** 9);
    return {maxFee, maxPriorityFee};
  } catch (error) {
    console.log(`Error in fetchGasPrice: ${error}`);
    process.exit(1);
  }
}
