/* 
  Basic function to map the necessary data from the
  transaction receipt generated and return the newly mapped data .
 */
import {ethers} from 'ethers';
import {MappedReceipt} from './dataTypes';

export async function transactionDataMapper(
  txReceipt: ethers.providers.TransactionReceipt
): Promise<MappedReceipt> {
  try {
    const mappedReceipt = {
      status: txReceipt.status,
      type: txReceipt.type,
      from: txReceipt.from,
      to: txReceipt.to,
      blockHash: txReceipt.blockHash,
      blockNumber: txReceipt.blockNumber,
      transactionHash: txReceipt.transactionHash,
      cumulativeGasUsed: txReceipt.cumulativeGasUsed.toString(),
      effectiveGasPrice: txReceipt.effectiveGasPrice.toString(),
      gasUsed: txReceipt.gasUsed.toString(),
    };
    return mappedReceipt;
  } catch (error) {
    console.log(`Error while mapping data of transaction receipt: ${error}`);
    process.exit(1);
  }
}
