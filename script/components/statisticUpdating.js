const { dbConnect } = require("../events/dbConnection.js");
const db = dbConnect();
const Increment = require("./models/statistics/increment.js");
const Retrieve = require("./models/statistics/retrieve.js");

class StatisticTracking {
  constructor(service) {
    this.service = service;
  }

  async incrementUploadCount() {
    const Retriever = new Retrieve(this.service, "upload");
    const statisticCount = await Retriever.collect();

    const Incrementer = new Increment(this.service, statisticCount);
    const statisticResult = await Incrementer.uploadCount();

    return;
  }

  async incrementUpdateCount() {
    const Retriever = new Retrieve(this.service, "update");
    const statisticCount = await Retriever.collect();

    const Incrementer = new Increment(this.service, statisticCount);
    const statisticResult = await Incrementer.updateCount();

    return;
  }

  async incrementFailCount() {
    const Retriever = new Retrieve(this.service, "fail");
    const statisticCount = await Retriever.collect();

    const Incrementer = new Increment(this.service, statisticCount);
    const statisticResult = await Incrementer.failCount();

    return;
  }
}

module.exports = StatisticTracking;
