// What login and refresh hand back to the api app.
export type SessionTokens = {
  readonly accessToken: string;
  readonly accessTokenExpiresAt: Date;
  // For the cookie; never returned in the body.
  readonly refreshToken: string;
  // When the session ends if it is never refreshed.
  readonly refreshTokenExpiresAt: Date;
};
