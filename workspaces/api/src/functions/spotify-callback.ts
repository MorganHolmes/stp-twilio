import { response } from "@zingdev/serverless-helpers";
import type {
  ServerlessEventObject,
  ServerlessFunctionSignature,
} from "@twilio-labs/serverless-runtime-types/types";
import { SpotifyContext } from "../types";

interface CallbackEvent {
  code?: string;
  error?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}

interface TokenErrorResponse {
  error: string;
  error_description: string;
}

type Event = ServerlessEventObject<CallbackEvent>;

export const handler: ServerlessFunctionSignature<SpotifyContext, Event> =
  async (context, event, callback) => {
    try {
      const code = event.code;
      const error = event.error;

      if (error) {
        console.error("Spotify authorization denied:", error);
        return callback(
          null,
          response(`Authorization failed. Spotify returned error: ${error}`, 400),
        );
      }

      if (!code) {
        return callback(
          null,
          response("Authorization failed. No authorization code received.", 400),
        );
      }

      const clientId = context.SPOTIFY_CLIENT_ID;
      const clientSecret = context.SPOTIFY_CLIENT_SECRET;
      const redirectUri = context.SPOTIFY_REDIRECT_URI;

      const tokenResponse = await fetch(
        "https://accounts.spotify.com/api/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
              "Basic " +
              Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUri,
          }),
        },
      );

      if (!tokenResponse.ok) {
        const errorBody = (await tokenResponse.json()) as TokenErrorResponse;
        console.error("Token exchange failed:", errorBody);
        return callback(
          null,
          response(
            `Token exchange error: ${errorBody.error_description || errorBody.error}`,
            500,
          ),
        );
      }

      const tokenData = (await tokenResponse.json()) as TokenResponse;

      const htmlResponse = new Twilio.Response();
      htmlResponse.setStatusCode(200);
      htmlResponse.appendHeader("Content-Type", "text/html");
      htmlResponse.setBody(`<!DOCTYPE html>
<html>
<head><title>Spotify Authorization Complete</title></head>
<body>
  <h1>Spotify Authorization Complete</h1>
  <p>Copy the refresh token below and set it as the <code>SPOTIFY_REFRESH_TOKEN</code> environment variable in your Twilio Functions configuration.</p>
  <h3>Refresh Token:</h3>
  <textarea readonly rows="4" cols="80" onclick="this.select()">${tokenData.refresh_token}</textarea>
  <h3>Instructions:</h3>
  <ol>
    <li>Copy the refresh token above.</li>
    <li>Go to the <a href="https://console.twilio.com/us1/develop/functions/services" target="_blank">Twilio Functions Console</a>.</li>
    <li>Open your service and navigate to <strong>Environment Variables</strong>.</li>
    <li>Set <code>SPOTIFY_REFRESH_TOKEN</code> to the copied value.</li>
    <li>Deploy the service for the change to take effect.</li>
  </ol>
</body>
</html>`);

      return callback(null, htmlResponse);
    } catch (err) {
      console.error("Error in Spotify callback:", err);
      return callback(null, response("An unexpected error occurred during authorization.", 500));
    }
  };
