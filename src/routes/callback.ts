// @ts-nocheck TODO remove when fixed
import { Router } from 'express';
import { TwitterApi } from 'twitter-api-v2';
import CONFIG, { requestClient, TOKENS } from '../config.js';
import { asyncWrapOrError } from '../utils.js';
import  got  from 'got';
import exifr from 'exifr';

export const callbackRouter = Router();

// -- FLOW 1: --
// -- Callback flow --

// Serve HTML index page with callback link that tests txt only post api(twtr)
callbackRouter.get('/', asyncWrapOrError(async (req, res) => {
  let link;
    console.log('link per ', process.env.NODE_ENV);
  if (process.env.NODE_ENV === 'development') {
    link = await requestClient.generateAuthLink(`http://localhost:${CONFIG.PORT}/callback`);
  } else {
    link = await requestClient.generateAuthLink(`https://pure-dusk-35729.herokuapp.com/callback`);
  }
  req.session.oauthToken = link.oauth_token;
  req.session.oauthSecret = link.oauth_token_secret;

  res.render('index', { authLink: link.url, authMode: 'callback' });

  //var hostpath = (process.env.NODE_ENV == 'production' ) ? 'https://pure-dusk-35729.herokuapp.com':'http://localhost:5000';

  //const link = await requestClient.generateAuthLink(hostpath +'/callback');

}));

/*
session.store url from aws bucket request from diff application
for auth service, access_token and twitter api *post.status* with media_id
*/
callbackRouter.get('/photo/:url', asyncWrapOrError(async (req, res) => {
  let link;
    console.log('link per ', process.env.NODE_ENV);
  if (process.env.NODE_ENV === 'development') {
    link = await requestClient.generateAuthLink(`http://localhost:${CONFIG.PORT}/callbk`);
  } else {
    link = await requestClient.generateAuthLink(`https://pure-dusk-35729.herokuapp.com/callbk`);
  }

  // Save token secret to use it after callback
  req.session.oauthToken = link.oauth_token;
  req.session.oauthSecret = link.oauth_token_secret;
  req.session.photoUrl = decodeURI(req.params.url);
  console.log('index sesn url ' +req.session.photoUrl)
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

  console.log('Client entry ' +token);
  // await tmpClient.v1.tweet('Hello, this is a test.');
  const homeTimeline = await client.v1.tweet('testing sts api');
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
  console.log(savedUrl);
  if (!savedToken || !savedSecret || savedToken !== token) {
    res.status(400).render('error', { error: 'OAuth token is not known or invalid. Your request may have expire. Please renew the auth process.' });
    return;
  }
  // Build a temporary client to get access token
  const tempClient = new TwitterApi({ ...TOKENS, accessToken: token, accessSecret: savedSecret });
  // Ask for definitive access token
  const {  accessToken, accessSecret, client, screenName, userId } = await tempClient.login(verifier);
  // You can store & use accessToken + accessSecret to create a new client and make API calls!
  const myBuff = await got({ url: savedUrl }).buffer(); //fetch photo as buffer from AWS bucket
  let {latitude, longitude} = await exifr.gps(myBuff);  // api -> get EXIF latlng from buffer(photo)
  // api from gps.latLng to street address
  const rsult = await got.get(
  `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${CONFIG.MAPKEY}`).json();
  const mapAddr = rsult.results[0].formatted_address;  // parse street.addr
  const myId :string = await client.v1.uploadMedia(myBuff,  { type: "png" }); // supply photo to twitr API
  const mytweet = await client.v1.tweet(`Hello, testing addr ${mapAddr}` , {media_ids: myId}); // submit tweet w media -> photo
  const stsLink = mytweet.full_text;
  //console.log(mytweet)
  // parse *mytweet.full_text* for a link to new tweet
  //full_text: 'Hello, testing addr 1129 Florida St, San Francisco, CA 94110, USA https://t.co/S99YhWLhfX',
  res.render('callback', { accessToken, accessSecret, latitude, longitude, screenName, stsLink, userId });
}));

// Read data from Twitter callback
callbackRouter.get('/callback/:photo', asyncWrapOrError(async (req, res) => {
  // Invalid request
  if (!req.query.oauth_token || !req.query.oauth_verifier) {
    res.status(400).render('error', { error: 'Bad request, or you denied application access. Please renew your request.' });
    return;
  }
const _url = decodeURI(req.params.photo);

  const token = req.query.oauth_token as string;
  const verifier = req.query.oauth_verifier as string;
  const savedToken = req.session.oauthToken;
  const savedSecret = req.session.oauthSecret;

  // Build a temporary client to get access token
  const tempClient = new TwitterApi({ ...TOKENS, accessToken: token, accessSecret: savedSecret });
  // Ask for definitive access token
  const {  accessToken, accessSecret, client, screenName, userId } = await tempClient.login(verifier);
  // You can store & use accessToken + accessSecret to create a new client and make API calls!
  //const _url = 'https://bubble-yaya-tst.s3.amazonaws.com/photo/-4n8Kx9DXgupJtQ5G-i9C/fred_fwrd_5yr.png';
  const myBuff = await got({ url: _url }).buffer();
  const myId :string = await client.v1.uploadMedia(myBuff,  { type: "png" });
  await client.v1.tweet('Hello, testing' , {media_ids: myId});

  res.render('callback', { accessToken, accessSecret, screenName, userId });
}));


export default callbackRouter;
