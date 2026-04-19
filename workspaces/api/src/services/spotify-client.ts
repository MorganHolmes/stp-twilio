export class SpotifyApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(`Spotify API error ${status}: ${message}`);
    this.name = "SpotifyApiError";
  }
}

interface SpotifyErrorResponse {
  error: { status: number; message: string };
}

export interface RecentlyPlayedResponse {
  items: {
    track: { uri: string; name: string; id: string };
    played_at: string;
  }[];
  cursors?: { after?: string; before?: string };
  next?: string | null;
}

interface PlaylistItemsResponse {
  items: {
    item?: { uri: string } | null;
    track?: { uri: string; type: string } | null;
  }[];
  next: string | null;
  total: number;
}

const BASE_URL = "https://api.spotify.com/v1";
const MAX_RETRIES = 3;

async function spotifyFetch(
  url: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    ...(options.headers as Record<string, string>),
  };

  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, { ...options, headers });
    lastResponse = response;

    if (response.status !== 429 || attempt === MAX_RETRIES) {
      break;
    }

    const retryAfter = response.headers.get("Retry-After");
    const waitSeconds = retryAfter
      ? Number.parseInt(retryAfter, 10)
      : Math.pow(2, attempt + 1);
    await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
  }

  const finalResponse = lastResponse as Response;

  if (!finalResponse.ok) {
    let message = `HTTP ${finalResponse.status}`;
    try {
      const errorBody = (await finalResponse.json()) as SpotifyErrorResponse;
      message = errorBody.error?.message || message;
    } catch {
      // Use default message if JSON parsing fails
    }
    throw new SpotifyApiError(finalResponse.status, message);
  }

  return finalResponse;
}

export async function getRecentlyPlayed(
  accessToken: string,
  after?: number,
  limit = 50,
): Promise<RecentlyPlayedResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (after !== undefined) {
    params.set("after", after.toString());
  }

  const response = await spotifyFetch(
    `${BASE_URL}/me/player/recently-played?${params}`,
    accessToken,
  );
  return (await response.json()) as RecentlyPlayedResponse;
}

export async function getPlaylistItems(
  accessToken: string,
  playlistId: string,
): Promise<string[]> {
  const uris: string[] = [];
  let url: string | null =
    `${BASE_URL}/playlists/${encodeURIComponent(playlistId)}/items?` +
    new URLSearchParams({
      fields: "items(item(uri)),next",
      limit: "50",
    });

  while (url) {
    const response = await spotifyFetch(url, accessToken);
    const data = (await response.json()) as PlaylistItemsResponse;

    for (const item of data.items) {
      const trackItem = item.item || item.track;
      if (trackItem?.uri) {
        uris.push(trackItem.uri);
      }
    }

    url = data.next;
  }

  return uris;
}

export async function addItemsToPlaylist(
  accessToken: string,
  playlistId: string,
  uris: string[],
): Promise<void> {
  for (let i = 0; i < uris.length; i += 100) {
    const batch = uris.slice(i, i + 100);
    await spotifyFetch(
      `${BASE_URL}/playlists/${encodeURIComponent(playlistId)}/items`,
      accessToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uris: batch }),
      },
    );
  }
}

export async function removeItemsFromPlaylist(
  accessToken: string,
  playlistId: string,
  uris: string[],
): Promise<void> {
  for (let i = 0; i < uris.length; i += 100) {
    const batch = uris.slice(i, i + 100);
    await spotifyFetch(
      `${BASE_URL}/playlists/${encodeURIComponent(playlistId)}/items`,
      accessToken,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: batch.map((uri) => ({ uri })),
        }),
      },
    );
  }
}
