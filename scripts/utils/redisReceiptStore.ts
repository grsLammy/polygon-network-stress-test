import {MappedReceipt} from './dataTypes';
import {RedisClientType} from 'redis';

// Function to save mapped receipt to redis database
export async function redisReceiptStore(
  mappedReceipt: MappedReceipt,
  redisClient: RedisClientType
): Promise<void> {
  try {
    const hsetObject: Record<string, string> = {
      type: mappedReceipt.type.toString(),
      from: mappedReceipt.from,
      to: mappedReceipt.to,
      blockHash: mappedReceipt.blockHash,
      blockNumber: mappedReceipt.blockNumber.toString(),
      cumulativeGasUsed: mappedReceipt.cumulativeGasUsed,
      effectiveGasUsed: mappedReceipt.effectiveGasPrice,
      gasUsed: mappedReceipt.gasUsed,
    };

    // Only add the status property if it's defined
    if (typeof mappedReceipt.status !== 'undefined') {
      hsetObject.status = mappedReceipt.status.toString();
    } else {
      console.log('undefined transaction status');
      process.exit(1);
    }

    await redisClient.HSET(mappedReceipt.transactionHash, hsetObject);
  } catch (error) {
    console.log(`Error in redisDB: ${error}`);
    process.exit(1);
  }
}
