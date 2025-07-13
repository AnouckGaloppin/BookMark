// Cross-tab synchronization using BroadcastChannel API
export class CrossTabSync {
  private channel: BroadcastChannel;
  private tabId: string;

  constructor(channelName: string) {
    this.channel = new BroadcastChannel(channelName);
    this.tabId = this.generateTabId();
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Send a message to other tabs
  send(message: ProgressUpdateMessage | ProgressSyncMessage | ProgressSyncResponse) {
    this.channel.postMessage({
      ...message,
      tabId: this.tabId,
      timestamp: Date.now()
    });
  }

  // Listen for messages from other tabs
  onMessage(callback: (message: ProgressUpdateMessage | ProgressSyncMessage | ProgressSyncResponse) => void) {
    this.channel.onmessage = (event) => {
      const message = event.data;
      // Ignore messages from the same tab
      if (message.tabId !== this.tabId) {
        callback(message);
      }
    };
  }

  // Close the channel
  close() {
    this.channel.close();
  }
}

// Progress-specific cross-tab sync
export const progressSync = new CrossTabSync('booktracker-progress');

// Message types
export interface ProgressUpdateMessage {
  type: 'PROGRESS_UPDATE';
  bookId: string;
  pages: number;
  userId: string;
}

export interface ProgressSyncMessage {
  type: 'PROGRESS_SYNC_REQUEST';
  userId: string;
}

export interface ProgressSyncResponse {
  type: 'PROGRESS_SYNC_RESPONSE';
  progress: { [bookId: string]: number };
  userId: string;
} 