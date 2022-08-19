import fs from 'fs';
import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
// export const CONFIG = dotenv.parse(fs.readFileSync(__dirname + '/../.env'));
let CONFIG = {};
export const TOKENS = {
  appKey: process.env.CONSUMER_TOKEN!,
  appSecret: process.env.CONSUMER_SECRET!,
};
// Create client used to generate auth links only
export const requestClient = new TwitterApi({ ...TOKENS });
export default CONFIG ={PORT: process.env.PORT!, MAPKEY: process.env.GOOGLE_MAPS_API_KEY!};
