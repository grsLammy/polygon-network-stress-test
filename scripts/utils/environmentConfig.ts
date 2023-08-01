import {config} from 'dotenv';
config();

export const getPrivateKey = (): string => {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is not set.');
  }

  return privateKey;
};

export const getInfuraProjectID = (): string => {
  const infuraProjectID = process.env.INFURA_PROJECT_ID;

  if (!infuraProjectID) {
    throw new Error('INFURA_PROJECT_ID environment variable is not set.');
  }

  return infuraProjectID;
};

export const getExplorerApiKey = (): string => {
  const explorerApiKey = process.env.EXPLORER_API_KEY;

  if (!explorerApiKey) {
    throw new Error('EXPLORER_API_KEY environment variable is not set.');
  }

  return explorerApiKey;
};
