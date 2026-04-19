import { response } from "@zingdev/serverless-helpers";
import type {
  ServerlessEventObject,
  ServerlessFunctionSignature,
} from "@twilio-labs/serverless-runtime-types/types";
import { SpotifyContext } from "../types";
import { refreshAccessToken } from "../services/spotify-token";
import {
  getRecentlyPlayed,
  getPlaylistItems,
  addItemsToPlaylist,
  removeItemsFromPlaylist,
  SpotifyApiError,
} from "../services/spotify-client";

type Event = ServerlessEventObject<Record<string, never>>;

export const handler: ServerlessFunctionSignature<SpotifyContext, Event> =
  async (context, _event, callback) => {
    try {
      const {
        SPOTIFY_CLIENT_ID: clientId,
        SPOTIFY_CLIENT_SECRET: clientSecret,
        SPOTIFY_REFRESH_TOKEN: refreshToken,
        SPOTIFY_SOURCE_PLAYLIST_ID: sourcePlaylistId,
        SPOTIFY_DESTINATION_PLAYLIST_ID: destinationPlaylistId,
      } = context;

      const lookbackMinutes = Number.parseInt(
        context.SPOTIFY_LOOKBACK_MINUTES || "60",
        10,
      );

      if (!refreshToken) {
        return callback(
          null,
          response(
            "SPOTIFY_REFRESH_TOKEN is not configured. Complete the /spotify-auth flow first.",
            400,
          ),
        );
      }

      if (!sourcePlaylistId || !destinationPlaylistId) {
        return callback(
          null,
          response(
            "SPOTIFY_SOURCE_PLAYLIST_ID and SPOTIFY_DESTINATION_PLAYLIST_ID must be configured.",
            400,
          ),
        );
      }

      // Refresh access token
      const { accessToken, newRefreshToken } = await refreshAccessToken(
        clientId,
        clientSecret,
        refreshToken,
      );

      if (newRefreshToken) {
        console.warn(
          "Spotify returned a new refresh token. Update SPOTIFY_REFRESH_TOKEN environment variable with:",
          newRefreshToken,
        );
      }

      // Calculate lookback window
      const after = Date.now() - lookbackMinutes * 60 * 1000;

      // Fetch recently played tracks
      const recentlyPlayed = await getRecentlyPlayed(accessToken, after);

      if (!recentlyPlayed.items || recentlyPlayed.items.length === 0) {
        return callback(
          null,
          response(
            {
              tracksProcessed: 0,
              tracksMoved: 0,
              tracksSkipped: 0,
              movedTracks: [],
            },
            200,
          ),
        );
      }

      console.log(
        `Found ${recentlyPlayed.items.length} recently played track(s).`,
      );

      // Deduplicate track URIs
      const recentTrackMap = new Map<
        string,
        { uri: string; name: string }
      >();
      for (const item of recentlyPlayed.items) {
        if (!recentTrackMap.has(item.track.uri)) {
          recentTrackMap.set(item.track.uri, {
            uri: item.track.uri,
            name: item.track.name,
          });
        }
      }

      console.log('Recent Track Map:', recentTrackMap);

      // Get source playlist tracks
      const sourcePlaylistUris = await getPlaylistItems(
        accessToken,
        sourcePlaylistId,
      );
      const sourceUriSet = new Set(sourcePlaylistUris);

      console.log('Source:' + Array.from(sourceUriSet).join(', '));

      // Find intersection
      const matchingTracks = [...recentTrackMap.values()].filter((track) =>
        sourceUriSet.has(track.uri),
      );

      if (matchingTracks.length === 0) {
        console.log(
          "No recently played tracks found in the source playlist.",
        );
        return callback(
          null,
          response(
            {
              tracksProcessed: recentTrackMap.size,
              tracksMoved: 0,
              tracksSkipped: recentTrackMap.size,
              movedTracks: [],
            },
            200,
          ),
        );
      }

      const matchingUris = matchingTracks.map((t) => t.uri);

      console.log('Matching URIs:' + matchingUris.join(', '));

      console.log(
        `Moving ${matchingTracks.length} track(s) from source to destination playlist.`,
      );

      // Add to destination FIRST (safer on partial failure)
      await addItemsToPlaylist(accessToken, destinationPlaylistId, matchingUris);
      console.log(
        `Added ${matchingTracks.length} track(s) to destination playlist.`,
      );

      // Then remove from source
      await removeItemsFromPlaylist(accessToken, sourcePlaylistId, matchingUris);
      console.log(
        `Removed ${matchingTracks.length} track(s) from source playlist.`,
      );

      return callback(
        null,
        response(
          {
            tracksProcessed: recentTrackMap.size,
            tracksMoved: matchingTracks.length,
            tracksSkipped: recentTrackMap.size - matchingTracks.length,
            movedTracks: matchingTracks,
            ...(newRefreshToken
              ? { newRefreshToken: newRefreshToken }
              : {}),
          },
          200,
        ),
      );
    } catch (err) {
      if (err instanceof SpotifyApiError) {
        console.error(`Spotify API error: ${err.message}`);
        const statusCode = err.status === 401 ? 401 : 500;
        return callback(null, response(err.message, statusCode));
      }
      console.error("Unexpected error processing recently played:", err);
      return callback(
        null,
        response("An unexpected error occurred while processing tracks.", 500),
      );
    }
  };
