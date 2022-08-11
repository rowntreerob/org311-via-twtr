import fs from 'fs';
import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';



import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const CONFIG = dotenv.parse(fs.readFileSync(__dirname + '/../.env'));

export const TOKENS = {
  appKey: CONFIG.CONSUMER_TOKEN,
  appSecret: CONFIG.CONSUMER_SECRET,
};

// Create client used to generate auth links only
export const requestClient = new TwitterApi({ ...TOKENS });

export default CONFIG;
