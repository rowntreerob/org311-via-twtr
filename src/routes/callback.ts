// @ts-nocheck TODO remove when fixed
import { Router } from 'express';
import { TwitterApi } from 'twitter-api-v2';
import CONFIG, { requestClient, TOKENS } from '../config.js';
import { asyncWrapOrError } from '../utils.js';
import  got  from 'got';
import exifr from 'exifr';
import mime from'mime-types';

export const callbackRouter = Router();

// -- FLOW 1: --
// -- Callback flow --

// Serve HTML index page with callback link that tests txt only post api(twtr)
callbackRouter.get('/', asyncWrapOrError(async (req, res) => {
  let link;
  if (process.env.NODE_ENV === 'development') {
     link = await requestClient.generateAuthLink(`http://localhost:${CONFIG.PORT}/callback`);
	 // link = await requestClient.generateAuthLink(`http://localhost:${CONFIG.PORT}/callback/photo`);
  } else {
    link = await requestClient.generateAuthLink(`${CONFIG.OAUTH_DOMAIN}callback`);
  }
  req.session.oauthToken = link.oauth_token;
  req.session.oauthSecret = link.oauth_token_secret;
  res.render('index', { authLink: link.url, authMode: 'callback' });
}));

/*
session.store url from aws bucket request from diff application
for auth service, access_token and twitter api *post.status* with media_id
route belo called by bubble front end in WF for button.upload
*/
callbackRouter.get('/photo/:url/tag/:hashtg', asyncWrapOrError(async (req, res) => {
  
  let link;
  if (process.env.NODE_ENV === 'development') {
    link = await requestClient.generateAuthLink(`http://localhost:${CONFIG.PORT}/callbk`);
  } else {
    link = await requestClient.generateAuthLink(`${CONFIG.OAUTH_DOMAIN}callbk`);
  }

  // Save token secret to use it after callback
  req.session.oauthToken = link.oauth_token;
  req.session.oauthSecret = link.oauth_token_secret;
  req.session.photoUrl = decodeURI(req.params.url);
  req.session.hashTag = req.params.hashtg;// TODO decoder for URI path
//  console.log('index sesn url ' +req.session.photoUrl)
  res.render('index', { authLink: link.url, authMode: 'callback' });
  }));

  callbackRouter.get('/callback', asyncWrapOrError(async (req, res) => {
    // Invalid request
    if (!req.query.oauth_token || !req.query.oauth_verifier) {
      res.status(400).render('error', { error: 'Bad request, or you denied application access. Please renew your request.' });
      return;
    }
    const token = req.query.oauth_token as string;
    const verifier = req.query.oauth_verifier as string;
    const savedToken = req.session.oauthToken;
    const savedSecret = req.session.oauthSecret;

    if (!savedToken || !savedSecret || savedToken !== token) {
      res.status(400).render('error', { error: 'OAuth token is not known or invalid. Your request may have expire. Please renew the auth process.' });
      return;
    }
    const tempClient = new TwitterApi({ ...TOKENS, accessToken: token, accessSecret: savedSecret });
    // Ask for definitive access token
    const { accessToken, accessSecret, client, screenName, userId } = await tempClient.login(verifier);
	 console.log('client logon exit')
    const homeTimeline = await client.v2.tweet('testing sts api');
    res.render('callback', { accessToken, accessSecret, screenName, userId });
  }));

// Read data from Twitter *authorize* callback
callbackRouter.get('/callbk', asyncWrapOrError(async (req, res) => {
  // Invalid request
  if (!req.query.oauth_token || !req.query.oauth_verifier) {
    res.status(400).render('error', { error: 'Bad request, or you denied application access. Please renew your request.' });
    return;
  }
  const token = req.query.oauth_token as string;
  const verifier = req.query.oauth_verifier as string;
  const savedToken = req.session.oauthToken;
  const savedSecret = req.session.oauthSecret;
  const savedUrl = req.session.photoUrl;
  const savedTag = req.session.hashTag;
  const myArray = savedUrl.split(".");
  const val =  myArray[myArray.length - 1]   
  const mimeTyp = mime.lookup(val)
  if (!savedToken || !savedSecret || savedToken !== token) {
    res.status(400).render('error', { error: 'OAuth token is not known or invalid. Your request may have expire. Please renew the auth process.' });
    return;
  }
  // Build a temporary client to get access token
  const tempClient = new TwitterApi({ ...TOKENS, accessToken: token, accessSecret: savedSecret });
  // Ask for definitive access token
  const {  accessToken, accessSecret, client, screenName, userId } = await tempClient.login(verifier);
  const v1Client = client.v1;
  const v2Client = client.v2;
  const myBuff = await got({ url: savedUrl }).buffer(); //fetch photo as buffer from AWS bucket
  let {latitude, longitude} = await exifr.gps(myBuff);  // api -> get EXIF latlng from buffer(photo)
  // api from gps.latLng to street address
  const rsult = await got.get(
  `${CONFIG.MAP.GEOCD}?latlng=${latitude},${longitude}&key=${CONFIG.MAP.KEY}`).json();
  const mapAddr = rsult.results[0].formatted_address;  // parse street.addr
  const myId :string = await v1Client.uploadMedia(myBuff,  { mimeType: mimeTyp }); // supply photo to twitr API
  const data = await 
    v2Client.tweet(`@yayatvapp  reporting streets issue via picture  ${mapAddr} #${savedTag} ` , {media: {media_ids: [myId]}});
  const statusId  = data.data.id; 
  res.render('callback', {  latitude, longitude, screenName, statusId});
}));

// Read data from Twitter callback
callbackRouter.get('/callback/photo', asyncWrapOrError(async (req, res) => {
  // Invalid request
  if (!req.query.oauth_token || !req.query.oauth_verifier) {
    res.status(400).render('error', { error: 'Bad request, or you denied application access. Please renew your request.' });
    return;
  }
  const _url = 'https://bubble-yaya-tst.s3.amazonaws.com/photo/-4n8Kx9DXgupJtQ5G-i9C/fred_fwrd_5yr.png'
//const _url = decodeURI(req.params.photo);

  const token = req.query.oauth_token as string;
  const verifier = req.query.oauth_verifier as string;
  const savedToken = req.session.oauthToken;
  const savedSecret = req.session.oauthSecret;

  // Build a temporary client to get access token
  const tempClient = new TwitterApi({ ...TOKENS, accessToken: token, accessSecret: savedSecret });
  // Ask for definitive access token
  const {  accessToken, accessSecret, client, screenName, userId } = await tempClient.login(verifier);
const v1Client = client.v1;
const v2Client = client.v2;
  
  const myBuff = await got({ url: _url }).buffer();
  const myId :string = await v1Client.uploadMedia(myBuff,  { type: "png" });
  
  await v2Client.tweet(' testing streets reporting via picture  #savethedrop' , {media: {media_ids: [myId]}});
  
  res.render('callback', { accessToken, accessSecret, screenName, userId });
}));

function parseLnk(tweet , match) {
  const part = tweet.indexOf(match);
  //console.log('idx' , part)
  return 'https:'+ tweet.substring(part + 1);
}

export default callbackRouter;
