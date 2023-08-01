import {ethers} from 'ethers';

export interface GasData {
  maxFee: number;
  maxPriorityFee: number;
}

export interface GasApiResponse {
  safeLow: {
    maxPriorityFee: number;
    maxFee: number;
  };
  standard: {
    maxPriorityFee: number;
    maxFee: number;
  };
  fast: {
    maxPriorityFee: number;
    maxFee: number;
  };
  estimatedBaseFee: number;
  blockTime: number;
  blockNumber: number;
}

export interface Setup {
  provider: ethers.providers.InfuraProvider;
  accounts: ethers.Wallet[];
}

export interface MappedReceipt {
  status?: number;
  type: number;
  from: string;
  to: string;
  blockHash: string;
  blockNumber: number;
  transactionHash: string;
  cumulativeGasUsed: string;
  effectiveGasPrice: string;
  gasUsed: string;
}
