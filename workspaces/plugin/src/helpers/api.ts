import { Manager } from "@twilio/flex-ui";
import { envConfig } from "./config";

export interface ApiResponse<T> {
  statusCode: number;
  responseObj?: T;
  error?: string;
}

export class APIService {
  protected readonly baseUrl = envConfig.FLEX_APP_API_BASE_URL || "";

  protected readonly syncTokenFunctionName = "sync-token";

  private async callTwilioFunction<T>(
    baseUrl: string,
    functionName: string,
    requestData?: object,
    skipReadingResponseBody?: boolean,
    suppressCodes?: number[],
  ): Promise<ApiResponse<T>> {
    try {
      let body: Record<string, unknown> = {};
      if (requestData) {
        body = { ...requestData };
      }
      body.Token = this.getFlexToken();

      const res = await fetch(`${baseUrl}/${functionName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        try {
          const resData = skipReadingResponseBody ? undefined : ((await res.json()) as T); //NOTE: not runtime safe
          return await Promise.resolve({
            statusCode: res.status,
            responseObj: resData,
          });
        } catch (err) {
          console.error(err);
          const error = err as Error;
          return Promise.reject({
            statusCode: res.status,
            error: {
              message: error.message || "failed to parse response returned by server",
            },
          });
        }
      }
      try {
        const errObj = await res.json();
        if (
          typeof errObj === "object" &&
          typeof errObj.error === "string" &&
          (typeof errObj.info === "object" || typeof errObj.info === "undefined")
        ) {
          if (!suppressCodes?.includes(res.status)) {
            console.error(
              `(ApiError) Twilio Function Call ${baseUrl}/${functionName}: [${res.status}] ${errObj.error}`,
            );
          }
          return await Promise.reject({
            statusCode: res.status,
            error: {
              message: errObj.error,
              info: errObj.info,
            },
          });
        }
      } catch (err) {
        console.error(err);
        // skip error
      }
      return await Promise.reject({
        statusCode: res.status,
        error: { message: `${res.status} - ${res.statusText || ""}` },
      });
    } catch (err) {
      console.error(err);
      let errorMessage = "failed to call API";
      if (err && typeof err === "object" && Object.prototype.hasOwnProperty.call(err, "message")) {
        errorMessage = `${errorMessage} - ${(err as { message: string }).message}`;
      }
      return await Promise.reject({
        statusCode: 0,
        error: { message: errorMessage },
      });
    }
  }

  private getFlexToken(): string {
    return Manager.getInstance().store.getState().flex.session.ssoTokenPayload.token ?? "";
  }

  public async getSyncToken() {
    return this.callTwilioFunction<{ token: string }>(this.baseUrl, this.syncTokenFunctionName);
  }
}

export const apiService = new APIService();
