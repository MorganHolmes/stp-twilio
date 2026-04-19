import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getAppSetting } from "../appsettings";
import { setRefreshToken } from "../spotify/tokenManager";

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

export async function spotifyCallback(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      context.error("Spotify authorization denied:", error);
      return {
        status: 400,
        headers: { "Content-Type": "text/html" },
        body: `<html><body><h1>Authorization Failed</h1><p>Spotify returned error: ${error}</p></body></html>`,
      };
    }

    if (!code) {
      return {
        status: 400,
        headers: { "Content-Type": "text/html" },
        body: "<html><body><h1>Authorization Failed</h1><p>No authorization code received.</p></body></html>",
      };
    }

    const clientId = getAppSetting("SPOTIFY_CLIENT_ID");
    const clientSecret = getAppSetting("SPOTIFY_CLIENT_SECRET");
    const redirectUri = getAppSetting("SPOTIFY_REDIRECT_URI");

    const response = await fetch("https://accounts.spotify.com/api/token", {
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
    });

    if (!response.ok) {
      const errorBody = (await response.json()) as TokenErrorResponse;
      context.error("Token exchange failed:", errorBody);
      return {
        status: 500,
        headers: { "Content-Type": "text/html" },
        body: `<html><body><h1>Authorization Failed</h1><p>Token exchange error: ${errorBody.error_description || errorBody.error}</p></body></html>`,
      };
    }

    const tokenData = (await response.json()) as TokenResponse;

    await setRefreshToken(tokenData.refresh_token);

    context.log("Spotify authorization completed. Refresh token stored in Key Vault.");

    return {
      status: 200,
      headers: { "Content-Type": "text/html" },
      body: `<html><body>
        <h1>Spotify Authorization Complete</h1>
        <p>Your refresh token has been securely stored in Azure Key Vault.</p>
        <p>The timer function will now automatically process your recently played tracks.</p>
      </body></html>`,
    };
  } catch (error) {
    context.error("Error in Spotify callback:", error);
    return {
      status: 500,
      headers: { "Content-Type": "text/html" },
      body: "<html><body><h1>Authorization Failed</h1><p>An unexpected error occurred.</p></body></html>",
    };
  }
}

app.http("spotifyCallback", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "callback",
  handler: spotifyCallback,
});
