import fetch, {Response} from 'node-fetch';
import {GAS_STATION_API_URL} from './constants';
import {GasData, GasApiResponse} from './dataTypes';

export async function gasPriceFetcher(): Promise<GasData> {
  try {
    const response: Response = await fetch(GAS_STATION_API_URL);
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
    throw new Error(`Error in fetchGasPrice: ${error}`);
  }
}
