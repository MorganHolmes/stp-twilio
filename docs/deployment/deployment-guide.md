# Deployment Guide

## GitHub Variable/Secret Setup

> This step requires admin permissions on the GitHub repository.

### How to Add Variables/Secrets

1. From the GitHub repository page, navigate to **Settings > Secrets and variables > Actions**.
2. Select the **Secrets** or **Variables** tab based on the type of value you are adding. Note that values added to **Variables** are not secured.
3. Click **New repository secret/variable**
4. Enter the **Name** and **Value** fields for your [required variable/secret](#required-variablessecrets).
5. Click **Add secret/variable**

### Required Variables/Secrets

Every variable/secret must be prefixed with the name of the Environment you are deploying to (casing is ignored). This can be `develop`, `uat`, or `production`.

The following table lists the variables/secrets you should add if you are deploying to the `production` environment:

#### Twilio Configuration

| Name                             | Description                                                                                                                            | Is Secret | Note                |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------- |
| PRODUCTION_TWILIO_ACCOUNT_SID    | The Twilio Account SID. Found in the [Twilio Console](https://console.twilio.com)                                                      | No        | Starts with `AC...` |
| PRODUCTION_TWILIO_API_KEY        | The SID of a Twilio API Key. Can be created and viewed in [Api Keys](https://console.twilio.com/us1/account/keys-credentials/api-keys) | No        | Starts with `SK...` |
| **PRODUCTION_TWILIO_API_SECRET** | The Secret Value of the Api Key specified in PRODUCTION_TWILIO_API_KEY. Can only be viewed on creation of the Api Key.                 | **Yes**   |                     |

#### Spotify Configuration

| Name                                       | Description                                                                                                     | Is Secret | Note                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------- |
| PRODUCTION_SPOTIFY_CLIENT_ID               | The Spotify App Client ID. Found in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)  | No        |                                                      |
| **PRODUCTION_SPOTIFY_CLIENT_SECRET**       | The Spotify App Client Secret. Found in the Spotify Developer Dashboard.                                        | **Yes**   |                                                      |
| PRODUCTION_SPOTIFY_REDIRECT_URI            | The OAuth callback URL for Spotify auth. Must be HTTPS. Format: `https://<your-twilio-domain>/spotify-callback` | No        | Must be registered in Spotify app redirect URIs      |
| PRODUCTION_SPOTIFY_REFRESH_TOKEN           | The Spotify refresh token obtained after completing the auth flow. Initially leave empty.                       | No        | Set manually after running the auth flow (see below) |
| PRODUCTION_SPOTIFY_SOURCE_PLAYLIST_ID      | The Spotify playlist ID to check for recently played tracks.                                                    | No        | Found in the playlist URL or Spotify URI             |
| PRODUCTION_SPOTIFY_DESTINATION_PLAYLIST_ID | The Spotify playlist ID where matched tracks are moved to.                                                      | No        | Found in the playlist URL or Spotify URI             |
| PRODUCTION_SPOTIFY_LOOKBACK_MINUTES        | How far back (in minutes) to check for recently played tracks. Defaults to `60`.                                | No        | Optional                                             |

If you are deploying to a different Environment, replace `PRODUCTION` with the name of the Environment. E.g. to deploy to the UAT Environment you must set the `UAT_TWILIO_ACCOUNT_SID` variable (and do the same for the rest of the table).

## Spotify App Setup

Before deploying, you must create a Spotify application:

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Click **Create App**.
3. Set a name and description.
4. Add a **Redirect URI** matching the format: `https://<your-twilio-functions-domain>/spotify-callback`. You will get the exact domain after the first deployment.
5. Note the **Client ID** and **Client Secret** for the GitHub variables/secrets above.

## Triggering Deployment

From the GitHub repository page, navigate to the **Actions** page. On the left you will see a list of **workflows**. For a first-time deployment, trigger the workflows in the following order:

### 1. Build Code

1. Select the **Build Code Components** Workflow
2. Click **Run workflow** and wait for completion

### 2. Deploy Solution

1. Select the **Deploy Solution** Workflow
2. Click **Run workflow**
3. Select the Environment you want to deploy to (Develop/UAT/Production)
4. Select the code components to also deploy. (For a first-time deploy select **all**)
5. Run and wait for completion

### 3. Complete Spotify Authorization

After the first deployment, you need to obtain a Spotify refresh token:

1. Open your browser and navigate to `https://<your-twilio-functions-domain>/spotify-auth`.
2. You will be redirected to Spotify to authorize the application.
3. After authorizing, you will be shown a refresh token on the callback page.
4. Copy the refresh token.
5. Set the `PRODUCTION_SPOTIFY_REFRESH_TOKEN` GitHub variable (or the equivalent for your environment) to the copied value.
6. Re-run the **Deploy Solution** workflow to apply the variable update.
