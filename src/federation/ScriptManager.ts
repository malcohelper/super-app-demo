import { Platform } from "react-native";
import { ScriptManager } from "@callstack/repack/client";
import { getMiniAppUrl, REMOTES } from "./remotes.config";

/**
 * Script Manager for Dynamic Module Federation
 * Handles loading and caching of remote Mini App bundles
 */

const isDev = __DEV__;

// Initialize the script manager with a resolver
ScriptManager.shared.addResolver(async (scriptId, caller) => {
  // Case 1: Resolve main container
  if (!caller && REMOTES[scriptId]) {
    try {
      const url = getMiniAppUrl(scriptId, isDev);

      return {
        url,
        cache: !isDev,
        query: {
          platform: Platform.OS,
          ...(isDev && { t: Date.now().toString() }),
        },
        verifyScriptSignature: "off",
      };
    } catch (error) {
      console.error(`[ScriptManager] Failed to resolve ${scriptId}:`, error);
      throw error;
    }
  }

  // Case 2: Resolve chunks from a remote container
  if (caller && REMOTES[caller]) {
    try {
      const baseUrl = getMiniAppUrl(caller, isDev);
      // Construct chunk URL relative to container URL
      const chunkUrl = baseUrl.replace(/[^/]+$/, `${scriptId}.chunk.bundle`);

      return {
        url: chunkUrl,
        cache: !isDev,
        query: {
          platform: Platform.OS,
          ...(isDev && { t: Date.now().toString() }),
        },
        verifyScriptSignature: "off",
      };
    } catch (error) {
      console.error(
        `[ScriptManager] Failed to resolve chunk ${scriptId} for ${caller}:`,
        error
      );
      throw error;
    }
  }

  return undefined;
});

// Event listeners for script loading not supported in this version of Re.Pack ScriptManager types
// ScriptManager.shared.on('resolving', ...);

export { ScriptManager };
