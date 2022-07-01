import { Router } from 'express';
import { TwitterApi } from 'twitter-api-v2';
import CONFIG, { requestClient, TOKENS } from '../config';
import { asyncWrapOrError } from '../utils';

export const callbackRouter = Router();

// -- FLOW 1: --
// -- Callback flow --

// Serve HTML index page with callback link
callbackRouter.get('/', asyncWrapOrError(async (req, res) => {
  const link = await requestClient.generateAuthLink(`http://localhost:${CONFIG.PORT}/callbaknw`);
  // Save token secret to use it after callback
  req.session.oauthToken = link.oauth_token;
  req.session.oauthSecret = link.oauth_token_secret;

  res.render('index', { authLink: link.url, authMode: 'callback' });
}));

// Read data from Twitter callback
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
 console.log('Client entry ' +token);
  if (!savedToken || !savedSecret || savedToken !== token) {
    res.status(400).render('error', { error: 'OAuth token is not known or invalid. Your request may have expire. Please renew the auth process.' });
    return;
  }

  // Build a temporary client to get access token
  const tempClient = new TwitterApi({ ...TOKENS, accessToken: token, accessSecret: savedSecret });
/* when wher to get the api client_base
return {
    accessToken: oauth_result.oauth_token,
    accessSecret: oauth_result.oauth_token_secret,
    userId: oauth_result.user_id,
    screenName: oauth_result.screen_name,
    client,

*/
  // Ask for definitive access token
  const { accessToken, accessSecret, screenName, userId } = await tempClient.login(verifier);
  // You can store & use accessToken + accessSecret to create a new client and make API calls!
  const tmpClient = new TwitterApi({ ...TOKENS,
  accessToken: token,
  accessSecret: savedSecret
  });

//  const user = await roClient.v2.userByUsername('plhery');
// await tmpClient.v1.tweet('Hello, this is a test.');

  res.render('callback', { accessToken, accessSecret, screenName, userId, api:TwitterApi });
}));

callbackRouter.get('/callbaknw', asyncWrapOrError(async (req, res) => {
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

  // Build a temporary client to get access token
  const tempClient = new TwitterApi({ ...TOKENS, accessToken: token, accessSecret: savedSecret });
  // Ask for definitive access token
  const { accessToken, accessSecret, screenName, userId } = await tempClient.login(verifier);
  // You can store & use accessToken + accessSecret to create a new client and make API calls!
  const tmpClient = new TwitterApi({ ...TOKENS,
  accessToken: token,
  accessSecret: savedSecret
  });

  res.json(
    {
       accessToken: accessToken,
       accessSecret: accessSecret,
       userId: userId,
       screenName: screenName
   }
  );

}));
export default callbackRouter;
