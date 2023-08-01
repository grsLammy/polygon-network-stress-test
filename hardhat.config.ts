import {HardhatUserConfig} from 'hardhat/config';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import dotenv from 'dotenv';
import 'solidity-coverage';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import {
  getExplorerApiKey,
  getInfuraProjectID,
  getPrivateKey,
} from './scripts/utils/config';
import '@nomiclabs/hardhat-etherscan';
dotenv.config();

const privateKey = getPrivateKey();
const explorerApiKey = getExplorerApiKey();
const infuraProjectID = getInfuraProjectID();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.7',
      },
      {
        version: '0.6.6',
      },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    deployer: 0,
    admin: 1,
    admin1: 2,
    user: 3,
    user1: 4,
  },
  networks: {
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${infuraProjectID}`,
      gasPrice: 'auto',
      accounts: privateKey !== undefined ? [privateKey] : [],
    },
  },
  paths: {
    sources: 'src',
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  typechain: {
    outDir: 'src/types',
    target: 'ethers-v5',
  },
  etherscan: {
    apiKey: explorerApiKey || '',
  },
};

export default config;
