import fs from 'fs';
import {ethers, Wallet} from 'ethers';
import {ACCOUNTS_JSON_PATH} from './constants';

export function accountLoader(
  provider: ethers.providers.InfuraProvider
): Wallet[] {
  // load json file
  const data = fs.readFileSync(ACCOUNTS_JSON_PATH, 'utf-8');

  // parse json
  const accounts = JSON.parse(data);

  // Here we define a type for `account`
  type Account = {
    privateKey: string;
  };

  // convert to ethers.js Wallet instances
  const wallets = accounts.map((account: Account) => {
    return new Wallet(account.privateKey, provider);
  });

  return wallets;
}
