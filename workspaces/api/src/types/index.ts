import { EnvironmentVariables } from "@twilio-labs/serverless-runtime-types/types";

// Add Twilio Functions Variables here
export interface BaseContext extends EnvironmentVariables {
  ACCOUNT_SID: string;
  AUTH_TOKEN: string;
}

export interface SpotifyContext extends BaseContext {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  SPOTIFY_REDIRECT_URI: string;
  SPOTIFY_REFRESH_TOKEN: string;
  SPOTIFY_SOURCE_PLAYLIST_ID: string;
  SPOTIFY_DESTINATION_PLAYLIST_ID: string;
  SPOTIFY_LOOKBACK_MINUTES: string;
}
