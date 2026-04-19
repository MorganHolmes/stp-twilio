# Operation - User Guide

## Overview

This solution provides Twilio Serverless Functions that integrate with Spotify to automatically move recently played tracks from a source playlist to a destination playlist. The functions are designed to be called from a Twilio Studio flow.

## Functions

### `spotify-auth` (Public)

**URL:** `https://<your-domain>/spotify-auth`

Initiates the Spotify OAuth authorization flow. Open this URL in a browser to authorize the application with your Spotify account.

### `spotify-callback` (Public)

**URL:** `https://<your-domain>/spotify-callback`

Handles the Spotify OAuth callback. After authorization, displays the refresh token for manual configuration. This URL is set as the redirect URI in your Spotify app settings.

### `process-recently-played` (Protected)

**URL:** `https://<your-domain>/process-recently-played`

The main function called from the Twilio Studio flow. It:

1. Uses the configured refresh token to obtain a fresh Spotify access token.
2. Fetches tracks played within the lookback window (default: 60 minutes).
3. Checks which of those tracks exist in the source playlist.
4. Moves matching tracks to the destination playlist.

**Response format:**

```json
{
  "tracksProcessed": 5,
  "tracksMoved": 2,
  "tracksSkipped": 3,
  "movedTracks": [
    { "uri": "spotify:track:abc123", "name": "Track Name" }
  ]
}
```

This function is protected and requires Twilio authentication (e.g. called from a Studio flow or with valid Twilio credentials).

## Initial Setup: Spotify Authorization

After the first deployment, you must complete the Spotify authorization flow to obtain a refresh token:

1. Open `https://<your-domain>/spotify-auth` in your browser.
2. Log in to Spotify and authorize the application.
3. The callback page will display your refresh token.
4. Copy the refresh token and set it as the `SPOTIFY_REFRESH_TOKEN` environment variable:
   - **Via GitHub:** Set the `<ENVIRONMENT>_SPOTIFY_REFRESH_TOKEN` variable and redeploy.
   - **Via Twilio Console:** Go to Functions > Services > your service > Environment Variables, set `SPOTIFY_REFRESH_TOKEN`, and deploy.

## Studio Flow Integration

To call the `process-recently-played` function from a Twilio Studio flow:

1. Add a **Run Function** widget to your flow.
2. Select the deployed service and the `process-recently-played` function.
3. The function returns a JSON response that can be used in subsequent flow widgets.
4. Use `widgets.<widget_name>.parsed.tracksMoved` to access the number of moved tracks in flow logic.

## Troubleshooting

| Issue                                     | Resolution                                                                                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `SPOTIFY_REFRESH_TOKEN is not configured` | Complete the `/spotify-auth` authorization flow and set the token.                                                                       |
| `Token refresh failed`                    | The refresh token may have expired or been revoked. Re-run the `/spotify-auth` flow to get a new one.                                    |
| `Spotify API error 429`                   | Rate limited by Spotify. The function has built-in retry logic with exponential backoff. If this persists, reduce call frequency.        |
| `Spotify API error 401`                   | Access token or credentials are invalid. Verify `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are correct, and re-authorize if needed. |
| Warning about new refresh token           | Spotify rotated the refresh token. Update the `SPOTIFY_REFRESH_TOKEN` env var with the new value from the function response.             |
