/**
 * Mini App Lifecycle Manager
 * Manages lifecycle events for Mini Apps (focus, blur, background, foreground)
 */

type LifecycleEvent = 'focus' | 'blur' | 'background' | 'foreground';
type LifecycleListener = () => void;

export class MiniAppLifecycleManager {
  private listeners: Map<string, Map<LifecycleEvent, Set<LifecycleListener>>> = new Map();
  private activeMiniApp: string | null = null;

  /**
   * Register a lifecycle listener for a Mini App
   */
  addEventListener(
    miniAppName: string,
    event: LifecycleEvent,
    listener: LifecycleListener
  ): () => void {
    if (!this.listeners.has(miniAppName)) {
      this.listeners.set(miniAppName, new Map());
    }

    const appListeners = this.listeners.get(miniAppName)!;
    if (!appListeners.has(event)) {
      appListeners.set(event, new Set());
    }

    appListeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.removeEventListener(miniAppName, event, listener);
    };
  }

  /**
   * Remove a lifecycle listener
   */
  removeEventListener(
    miniAppName: string,
    event: LifecycleEvent,
    listener: LifecycleListener
  ) {
    const appListeners = this.listeners.get(miniAppName);
    if (appListeners) {
      const eventListeners = appListeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener);
      }
    }
  }

  /**
   * Emit a lifecycle event for a Mini App
   */
  private emit(miniAppName: string, event: LifecycleEvent) {
    const appListeners = this.listeners.get(miniAppName);
    if (appListeners) {
      const eventListeners = appListeners.get(event);
      if (eventListeners) {
        eventListeners.forEach(listener => {
          try {
            listener();
          } catch (error) {
            console.error(`[MiniAppLifecycle] Error in ${event} listener:`, error);
          }
        });
      }
    }
  }

  /**
   * Notify that a Mini App has gained focus
   */
  onMiniAppFocus(miniAppName: string) {
    if (this.activeMiniApp && this.activeMiniApp !== miniAppName) {
      // Previous Mini App lost focus
      this.emit(this.activeMiniApp, 'blur');
    }

    this.activeMiniApp = miniAppName;
    this.emit(miniAppName, 'focus');
    console.log(`[MiniAppLifecycle] ${miniAppName} focused`);
  }

  /**
   * Notify that a Mini App has lost focus
   */
  onMiniAppBlur(miniAppName: string) {
    if (this.activeMiniApp === miniAppName) {
      this.activeMiniApp = null;
    }
    this.emit(miniAppName, 'blur');
    console.log(`[MiniAppLifecycle] ${miniAppName} blurred`);
  }

  /**
   * Notify that the app went to background
   */
  onAppBackground() {
    if (this.activeMiniApp) {
      this.emit(this.activeMiniApp, 'background');
      console.log(`[MiniAppLifecycle] ${this.activeMiniApp} backgrounded`);
    }
  }

  /**
   * Notify that the app came to foreground
   */
  onAppForeground() {
    if (this.activeMiniApp) {
      this.emit(this.activeMiniApp, 'foreground');
      console.log(`[MiniAppLifecycle] ${this.activeMiniApp} foregrounded`);
    }
  }

  /**
   * Get the currently active Mini App
   */
  getActiveMiniApp(): string | null {
    return this.activeMiniApp;
  }

  /**
   * Clear all listeners for a Mini App (cleanup on unmount)
   */
  clearMiniAppListeners(miniAppName: string) {
    this.listeners.delete(miniAppName);
  }
}

export const miniAppLifecycleManager = new MiniAppLifecycleManager();
