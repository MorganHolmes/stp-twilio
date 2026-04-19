import { Manager } from "@twilio/flex-ui";
import { z } from "zod";

const configSchema = z.object({
  RepoNameConfig: z.object({
    FLEX_APP_API_BASE_URL: z.string(),
    FLEX_APP_DEBUG: z.boolean(),
  }),
});

const localEnvSchema = z.object({
  FLEX_APP_API_BASE_URL: z.string(),
  FLEX_APP_DEBUG: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export const getEnvConfig = () => {
  try {
    if (process.env.FLEX_APP_LOCAL_DEV) {
      return localEnvSchema.parse(process.env);
    }
    return configSchema.parse(Manager.getInstance().configuration).RepoNameConfig;
  } catch (error) {
    // Handle validation error
    throw new Error("Invalid configuration:" + error);
  }
};

export const envConfig = getEnvConfig();
