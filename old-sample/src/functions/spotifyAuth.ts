import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { randomBytes } from "node:crypto";
import { getAppSetting } from "../appsettings";

const SCOPES = [
  "user-read-recently-played",
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
].join(" ");

export async function spotifyAuth(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const clientId = getAppSetting("SPOTIFY_CLIENT_ID");
    const redirectUri = getAppSetting("SPOTIFY_REDIRECT_URI");
    const state = randomBytes(16).toString("hex");

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope: SCOPES,
      redirect_uri: redirectUri,
      state: state,
    });

    const authorizeUrl = `https://accounts.spotify.com/authorize?${params}`;

    return {
      status: 302,
      headers: {
        Location: authorizeUrl,
      },
    };
  } catch (error) {
    context.error("Error initiating Spotify auth:", error);
    return {
      status: 500,
      body: "Failed to initiate Spotify authorization.",
    };
  }
}

app.http("spotifyAuth", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "auth",
  handler: spotifyAuth,
});
