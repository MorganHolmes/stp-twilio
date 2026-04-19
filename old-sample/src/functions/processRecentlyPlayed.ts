import { app, InvocationContext, Timer } from "@azure/functions";
import { getAppSetting } from "../appsettings";
import {
  getAccessToken,
  getLastProcessedTimestamp,
  setLastProcessedTimestamp,
} from "../spotify/tokenManager";
import {
  getRecentlyPlayed,
  getPlaylistItems,
  addItemsToPlaylist,
  removeItemsFromPlaylist,
} from "../spotify/client";

export async function processRecentlyPlayed(
  timer: Timer,
  context: InvocationContext
): Promise<void> {
  context.log("Processing recently played Spotify tracks...");

  const sourcePlaylistId = getAppSetting("SPOTIFY_SOURCE_PLAYLIST_ID");
  const destinationPlaylistId = getAppSetting("SPOTIFY_DESTINATION_PLAYLIST_ID");

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (error) {
    context.error(
      "Failed to get Spotify access token. Ensure the /api/auth flow has been completed.",
      error
    );
    return;
  }

  // Get cursor position (default to 30 minutes ago for first run)
  let lastProcessed = await getLastProcessedTimestamp();
  if (lastProcessed === undefined) {
    lastProcessed = Date.now() - 30 * 60 * 1000;
    context.log(
      `No previous cursor found. Using default: ${new Date(lastProcessed).toISOString()}`
    );
  }

  // Fetch recently played tracks
  const recentlyPlayed = await getRecentlyPlayed(accessToken, lastProcessed);

  if (!recentlyPlayed.items || recentlyPlayed.items.length === 0) {
    context.log("No recently played tracks found since last check.");
    return;
  }

  context.log(
    `Found ${recentlyPlayed.items.length} recently played track(s).`
  );

  // Deduplicate track URIs from recently played
  const recentUris = [
    ...new Set(recentlyPlayed.items.map((item) => item.track.uri)),
  ];

  // Get all track URIs in the source playlist
  const sourcePlaylistUris = await getPlaylistItems(
    accessToken,
    sourcePlaylistId
  );
  const sourceUriSet = new Set(sourcePlaylistUris);

  // Find recently played tracks that exist in the source playlist
  const matchingUris = recentUris.filter((uri) => sourceUriSet.has(uri));

  if (matchingUris.length === 0) {
    context.log(
      "No recently played tracks found in the source playlist. Nothing to move."
    );
  } else {
    context.log(
      `Moving ${matchingUris.length} track(s) from source to destination playlist.`
    );

    // Add to destination FIRST (safer on partial failure)
    await addItemsToPlaylist(accessToken, destinationPlaylistId, matchingUris);
    context.log(
      `Added ${matchingUris.length} track(s) to destination playlist.`
    );

    // Then remove from source
    await removeItemsFromPlaylist(accessToken, sourcePlaylistId, matchingUris);
    context.log(
      `Removed ${matchingUris.length} track(s) from source playlist.`
    );
  }

  // Update cursor to the most recent played_at timestamp
  const mostRecentPlayedAt = recentlyPlayed.items.reduce(
    (latest, item) => {
      const playedAt = new Date(item.played_at).getTime();
      return Math.max(playedAt, latest);
    },
    0
  );

  if (mostRecentPlayedAt > 0) {
    await setLastProcessedTimestamp(mostRecentPlayedAt);
    context.log(
      `Updated cursor to ${new Date(mostRecentPlayedAt).toISOString()}`
    );
  }

  context.log(
    `Done. ${matchingUris.length} track(s) moved, ${recentUris.length - matchingUris.length} skipped.`
  );
}

app.timer("processRecentlyPlayed", {
  schedule: "0 */30 * * * *",
  handler: processRecentlyPlayed,
});
