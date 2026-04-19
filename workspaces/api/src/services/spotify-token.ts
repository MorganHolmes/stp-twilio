interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

interface TokenErrorResponse {
  error: string;
  error_description: string;
}

export interface RefreshResult {
  accessToken: string;
  newRefreshToken?: string;
}

export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<RefreshResult> {
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
    let errorMessage = `Token refresh failed with status ${response.status}`;
    try {
      const errorBody = (await response.json()) as TokenErrorResponse;
      errorMessage = `Token refresh failed: ${errorBody.error_description || errorBody.error}`;
    } catch {
      // Use default message
    }
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as TokenResponse;

  return {
    accessToken: data.access_token,
    newRefreshToken: data.refresh_token,
  };
}
