export class Logger {
  private static prefix = '[PWA_SYNC_DEBUG]';

  static info(message: string, data?: any) {
    if (data) {
      console.log(`${this.prefix} ℹ️ ${message}`, data);
    } else {
      console.log(`${this.prefix} ℹ️ ${message}`);
    }
  }

  static warn(message: string, data?: any) {
    if (data) {
      console.warn(`${this.prefix} ⚠️ ${message}`, data);
    } else {
      console.warn(`${this.prefix} ⚠️ ${message}`);
    }
  }

  static error(message: string, error?: any) {
    if (error) {
      console.error(`${this.prefix} ❌ ${message}`, error);
    } else {
      console.error(`${this.prefix} ❌ ${message}`);
    }
  }
}
