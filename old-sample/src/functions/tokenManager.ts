import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { getAppSetting } from "../appsettings";

const REFRESH_TOKEN_SECRET = "spotify-refresh-token";
const LAST_PROCESSED_SECRET = "spotify-last-processed-timestamp";

let secretClient: SecretClient | undefined;

function getSecretClient(): SecretClient {
  if (!secretClient) {
    const vaultName = getAppSetting("KEY_VAULT_NAME");
    const vaultUrl = `https://${vaultName}.vault.azure.net`;
    secretClient = new SecretClient(vaultUrl, new DefaultAzureCredential());
  }
  return secretClient;
}

export async function getRefreshToken(): Promise<string> {
  const client = getSecretClient();
  const secret = await client.getSecret(REFRESH_TOKEN_SECRET);
  if (!secret.value) {
    throw new Error(
      "Spotify refresh token not found in Key Vault. Please complete the /api/auth flow first."
    );
  }
  return secret.value;
}

export async function setRefreshToken(token: string): Promise<void> {
  const client = getSecretClient();
  await client.setSecret(REFRESH_TOKEN_SECRET, token);
}

export async function getLastProcessedTimestamp(): Promise<number | undefined> {
  const client = getSecretClient();
  try {
    const secret = await client.getSecret(LAST_PROCESSED_SECRET);
    if (secret.value) {
      return Number.parseInt(secret.value, 10);
    }
  } catch (error: any) {
    if (error.statusCode === 404) {
      return undefined;
    }
    throw error;
  }
  return undefined;
}

export async function setLastProcessedTimestamp(
  timestamp: number
): Promise<void> {
  const client = getSecretClient();
  await client.setSecret(LAST_PROCESSED_SECRET, timestamp.toString());
}

export async function getAccessToken(): Promise<string> {
  const clientId = getAppSetting("SPOTIFY_CLIENT_ID");
  const clientSecret = getAppSetting("SPOTIFY_CLIENT_SECRET");
  const refreshToken = await getRefreshToken();

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to refresh Spotify access token: ${response.status} ${errorBody}`
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
  };

  // Spotify may rotate the refresh token
  if (data.refresh_token) {
    await setRefreshToken(data.refresh_token);
  }

  return data.access_token;
}
