import { EventEmitter } from 'events';
import { ftpService } from './ftp-service';
import { diffSnapshots } from './diff-engine';
import { FileSnapshot } from '../types/ftp';

export class PollingService extends EventEmitter {
  private interval: number;
  private lastSnapshot: FileSnapshot = [];
  private timer: NodeJS.Timeout | null = null;
  private isPollingIdling: boolean = false;

  constructor(defaultInterval: number = 5000) {
    super();
    this.interval = defaultInterval;
  }

  public getInterval(): number {
    return this.interval;
  }

  public setInterval(newInterval: number) {
    this.interval = newInterval;
    if (this.timer) {
      this.stop();
      this.start();
    }
  }

  public async start() {
    if (this.timer) return;

    // Perform initial scan
    try {
      this.lastSnapshot = await ftpService.listRecursive('/');
      this.emit('snapshot', this.lastSnapshot);
    } catch (error) {
      console.error('Initial FTP scan failed:', error);
    }

    this.timer = setInterval(async () => {
      if (this.isPollingIdling) return;
      this.isPollingIdling = true;

      try {
        const currentSnapshot = await ftpService.listRecursive('/');
        const diff = diffSnapshots(this.lastSnapshot, currentSnapshot);

        if (diff.added.length > 0 || diff.modified.length > 0 || diff.deleted.length > 0) {
          this.emit('diff', diff);
          this.lastSnapshot = currentSnapshot;
        }
      } catch (error) {
        console.error('FTP polling error:', error);
      } finally {
        this.isPollingIdling = false;
      }
    }, this.interval);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public getSnapshot(): FileSnapshot {
    return this.lastSnapshot;
  }
}

export const pollingService = new PollingService(
  process.env.POLLING_INTERVAL_MS ? parseInt(process.env.POLLING_INTERVAL_MS) : 5000
);
