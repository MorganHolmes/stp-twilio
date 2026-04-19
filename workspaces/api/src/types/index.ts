import { EnvironmentVariables } from "@twilio-labs/serverless-runtime-types/types";

// Add Twilio Functions Variables here
export interface BaseContext extends EnvironmentVariables {
  ACCOUNT_SID: string;
  AUTH_TOKEN: string;
}
