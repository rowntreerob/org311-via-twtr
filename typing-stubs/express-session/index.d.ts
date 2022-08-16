import session from 'express-session';

declare module 'express-session' {
  export interface SessionData {
    oauthToken?: string;
    oauthSecret?: string;
    photoUrl?: string;
  }
}
