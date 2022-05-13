class UploadDelay {
  constructor(service, startid, endid) {
    this.service = service;
    this.startid = startid;
    this.endid = endid;
  }

  async calculateUploadDelay() {
    const serviceUploadCount = this.endid - this.startid;

    // 24 hours / X a day * 60 min * 60 sec * convert to milliseconds | will grant an accurate delay in milliseconds for a set interval function
    const uploadDelay = (24 / serviceUploadCount) * 60 * 60 * 1000;
    const fixedDelay = parseInt(uploadDelay.toFixed(0));

    return fixedDelay;
  }
}

module.exports = UploadDelay;
