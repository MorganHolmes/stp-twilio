import { response } from "@zingdev/serverless-helpers";
import type { ServerlessEventObject, ServerlessFunctionSignature } from "@twilio-labs/serverless-runtime-types/types";
import { BaseContext } from "../types";
import z from "zod";

const eventSchema = z.object({
  payload: z.object({
    AccountSid: z.string(),
    WorkspaceSid: z.string(),
    TaskSid: z.string().optional(),
  }),
});

type Event = ServerlessEventObject<z.infer<typeof eventSchema>>;

export const handlerFunction: ServerlessFunctionSignature<BaseContext, Event> = async (context, event, callback) => {
  try {
    console.log(`The Protected function ${context.DOMAIN_NAME}${context.PATH} was invoked!`);

    const eventValidation = eventSchema.safeParse(event);
    if (!eventValidation.success) {
      return callback(null, response(eventValidation.error.errors, 400));
    }

    return callback(null, response("Payload received", 200));
  } catch (err) {
    console.error(err);
    return callback(null, response(undefined, 403));
  }
};

// This Function is protected and needs no additional Authentication
export const handler = handlerFunction;
