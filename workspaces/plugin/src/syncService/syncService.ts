import * as Flex from "@twilio/flex-ui";
import { ServiceBase } from "@zingdev/buildnow-core";
import { envConfig } from "../helpers/config";
import { apiService } from "helpers/api";

export class SyncService extends ServiceBase {
  protected readonly baseUrl = envConfig.FLEX_APP_API_BASE_URL || "";

  protected readonly functionName = "sync-token";

  protected readonly apiService = apiService;
}

// global event listeners
function onMapItemAdded(item: unknown) {
  const { store } = Flex.Manager.getInstance();
  //store.dispatch(yourAction);
}

function onMapItemUpdated(item: unknown) {
  const { store } = Flex.Manager.getInstance();
  //store.dispatch(yourAction);
}
function onMapItemRemoved(key: string) {
  const { store } = Flex.Manager.getInstance();
  //store.dispatch(yourAction);
}

export const loadSyncData = async () => {
  // Create a sync service with your listeners
  const syncService = new SyncService({
    onMapItemAdded,
    onMapItemUpdated,
    onMapItemRemoved,
  });
  const { store } = Flex.Manager.getInstance();
  try {
    // Get initial and save to redux
    //const items = await syncService.getMapItems();
    //store.dispatch();
    //return items;
  } catch (error) {
    console.error(error);
    // Handle Error
  } finally {
    // Wrap up
  }
};
