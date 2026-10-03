/**
 * Sequential Request Queue for Image Generation
 * Ensures operations on a shared browser worker tab run sequentially without collision.
 */
class ImageGenerationQueue {
  constructor(concurrency = 1) {
    this.concurrency = concurrency;
    this.queue = [];
    this.activeCount = 0;
  }

  /**
   * Enqueue an async task function
   * @param {Function} taskFn - () => Promise<any>
   * @param {string} label - Optional label for logging
   * @returns {Promise<any>} Resolves with the result of taskFn
   */
  enqueue(taskFn, label = '') {
    return new Promise((resolve, reject) => {
      this.queue.push({
        taskFn,
        label,
        resolve,
        reject,
        enqueuedAt: Date.now(),
      });
      this._processNext();
    });
  }

  async _processNext() {
    if (this.activeCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    this.activeCount++;

    try {
      const result = await item.taskFn();
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    } finally {
      this.activeCount--;
      this._processNext();
    }
  }

  get pendingCount() {
    return this.queue.length;
  }

  get isBusy() {
    return this.activeCount > 0 || this.queue.length > 0;
  }

  clear() {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      item.reject(new Error('Queue cleared'));
    }
  }
}

module.exports = ImageGenerationQueue;
