import express, { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import CONFIG from './config.js';
import callbackRouter from './routes/callback.js';
import pinRouter from './routes/pin.js';

// -- STARTUP --

declare module 'express-session' {
  interface SessionData {
    oauthToken?: string;
    oauthSecret?: string;
  }
}

// Create express app
const app = express();

// Configure session - needed to store secret token between requests
app.use(session({
  secret: 'twitter-api-v2-test',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
}));

// Just configure the render engine
app.set('view engine', 'ejs');

// -- ROUTES --

app.use(callbackRouter);
app.use(pinRouter);

// -- MISC --
app.use('/src/', express.static('src'));

// Error handler
app.use((err: any, _: Request, res: Response, __: NextFunction) => {
  console.error(err);
  res.status(500).render('error');
});
console.log('map ky domain ' +process.env.GOOGLE_MAPS_API_KEY +' '+ process.env.MAPS_API_DOMAIN)
console.log('twitr ky secrt ' +process.env.CONSUMER_TOKEN +' ' + process.env.CONSUMER_SECRET)
console.log('env oauth ' +process.env.NODE_ENV +' ' + process.env.OAUTH_DOMAIN)
// Start server
app.listen(Number(CONFIG.PORT), () => {
  console.log(`App is listening on port ${CONFIG.PORT} `);
});
