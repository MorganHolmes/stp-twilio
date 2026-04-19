import { response } from "@zingdev/serverless-helpers";
import { randomBytes } from "node:crypto";
import type {
  ServerlessEventObject,
  ServerlessFunctionSignature,
} from "@twilio-labs/serverless-runtime-types/types";
import { SpotifyContext } from "../types";

const SCOPES = [
  "user-read-recently-played",
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
].join(" ");

type Event = ServerlessEventObject<Record<string, never>>;

export const handler: ServerlessFunctionSignature<SpotifyContext, Event> =
  async (context, _event, callback) => {
    try {
      const clientId = context.SPOTIFY_CLIENT_ID;
      const redirectUri = context.SPOTIFY_REDIRECT_URI;

      if (!clientId || !redirectUri) {
        return callback(
          null,
          response(
            "SPOTIFY_CLIENT_ID and SPOTIFY_REDIRECT_URI must be configured.",
            400,
          ),
        );
      }

      const state = randomBytes(16).toString("hex");

      const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        scope: SCOPES,
        redirect_uri: redirectUri,
        state: state,
      });

      const authorizeUrl = `https://accounts.spotify.com/authorize?${params}`;

      const res = new Twilio.Response();
      res.setStatusCode(302);
      res.appendHeader("Location", authorizeUrl);

      return callback(null, res);
    } catch (err) {
      console.error("Error initiating Spotify auth:", err);
      return callback(null, response("Failed to initiate Spotify authorization.", 500));
    }
  };
