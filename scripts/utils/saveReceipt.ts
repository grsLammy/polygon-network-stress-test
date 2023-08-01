import fs from 'fs';
import {MappedReceipt} from './types';

// Function to save receipt locally as a JSON log file
export async function saveReceipt(mappedReceipt: MappedReceipt): Promise<void> {
  try {
    if (fs.existsSync('log/log.json')) {
      const existingLog = fs.readFileSync('log/log.json', 'utf-8');
      const parseLog = JSON.parse(existingLog);
      parseLog.push(mappedReceipt);
      const appendExistingLog = await JSON.stringify(parseLog, null, 2);
      fs.writeFileSync('log/log.json', appendExistingLog, 'utf-8');
      return;
    }
    fs.writeFileSync('log/log.json', '[]', 'utf-8');
    const emptyArrayLog = fs.readFileSync('log/log.json', 'utf-8');
    const parseLog = JSON.parse(emptyArrayLog);
    parseLog.push(mappedReceipt);
    const newLog = await JSON.stringify(parseLog, null, 2);
    fs.writeFileSync('log/log.json', newLog, 'utf-8');
  } catch (error) {
    console.log(`Error in saveReceipt: ${error}`);
  }
}
