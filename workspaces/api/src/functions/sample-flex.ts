import {
  FlexTokenEvent,
  ParsedFlexTokenEvent,
  response,
  withFlexTokenValidation,
  withPreflightCheck,
} from "@zingdev/serverless-helpers";
import type { ServerlessFunctionSignature } from "@twilio-labs/serverless-runtime-types/types";
import { BaseContext } from "../types";
import { z } from "zod";

const eventSchema = z.object({
  gift: z.string(),
});

type Event = FlexTokenEvent<z.infer<typeof eventSchema>>;

export const handlerFunction: ServerlessFunctionSignature<BaseContext, ParsedFlexTokenEvent<Event>> = async (
  context,
  event,
  callback,
) => {
  try {
    const eventValidation = eventSchema.safeParse(event);
    if (!eventValidation.success) {
      console.log(eventValidation.error.errors);
      return callback(null, response("You need to bring a gift!", 400));
    }

    const identity = event.parsedToken.identity;
    const isSupervisor = event.parsedToken.roles.includes("supervisor");
    if (isSupervisor) {
      console.log(`${identity} is a Supervisor!`);
    }

    return callback(null, response({ greeting: `Hello ${identity}, thanks for your ${event.gift}!` }, 200));
  } catch (err) {
    console.error(err);
    return callback(null, response(undefined, 403));
  }
};

// Authenticate with Flex Token
export const handler = withPreflightCheck(withFlexTokenValidation<BaseContext, Event>(handlerFunction));
