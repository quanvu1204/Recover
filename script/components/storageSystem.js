const { dbConnect } = require("../events/dbConnection.js");
const db = dbConnect();
const PostCreate = require("./models/posts/create.js");
const DelayPost = require("./models/posts/delay.js");
const DeletePost = require("./models/posts/delete.js");
const PrunePost = require("./models/posts/prune.js");
const PostRetrial = require("./models/posts/retrial.js");
const StorageValidator = require("../components/storageValidator.js");

class StorageSystem {
  constructor(
    service,
    remoteid,
    rating,
    source,
    parentid,
    uploadurl,
    fileformat,
    tags
  ) {
    this.service = service;
    this.remoteid = remoteid;
    this.rating = rating;
    this.source = source;
    this.parentid = parentid;
    this.uploadurl = uploadurl;
    this.fileformat = fileformat;
    this.tags = tags;
  }

  async storePost(md5 = "") {
    const path = `/home/scripting/Guardian/script/image-store/${this.service}/initial/${this.service}-post_id-${this.remoteid}.${this.fileformat}`;

    const Creater = new PostCreate(this.service);
    const createrResult = await Creater.action(
      this.remoteid,
      this.rating,
      this.parentid,
      this.source,
      this.uploadurl,
      path,
      this.tags,
      md5
    );

    const ValidationClient = new StorageValidator(this.service, this.remoteid);
    const validatorResult = await ValidationClient.original();

    if (validatorResult !== true) {
      return console.log(
        `Database error occurred while storing [${this.service.toUpperCase()}#${
          this.remoteid
        }]`
      );
    } else {
      return;
    }
  }

  async delayPost(md5 = "", score = "", reason = "") {
    const path = `/home/scripting/Guardian/script/image-store/${this.service}/initial/${this.service}-post_id-${this.remoteid}.${this.fileformat}`;

    const Delayer = new DelayPost(this.service);
    const delayerResult = await Delayer.action(
      this.remoteid,
      this.rating,
      this.parentid,
      this.source,
      this.uploadurl,
      path,
      this.tags,
      md5,
      score,
      reason
    );

    const ValidationClient = new StorageValidator(this.service, this.remoteid);
    const validatorResult = await ValidationClient.retrial();

    if (validatorResult !== true) {
      return console.log(
        `Database error occurred while delaying [${this.service.toUpperCase()}#${
          this.remoteid
        }]`
      );
    } else {
      return;
    }
  }

  async addRetry() {
    const Retryer = new PostRetrial(this.service);
    const retryerResult = await Retryer.add(this.remoteid);

    return console.log(
      `Successfully staged retry for [${this.service.toUpperCase()}#${
        this.remoteid
      }]`
    );
  }

  async clearRetry() {
    const Retryer = new PostRetrial(this.service);
    const retryerResult = await Retryer.clear(this.remoteid);

    return console.log(
      `Successfully cleared retry for [${this.service.toUpperCase()}#${
        this.remoteid
      }]`
    );
  }

  async addApprovalRetry() {
    const Retryer = new PostRetrial(this.service);
    const retryerResult = await Retryer.approvalAdd(this.remoteid);

    return console.log(
      `Successfully staged retry for [${this.service.toUpperCase()}#${
        this.remoteid
      }]`
    );
  }

  async deletePost() {
    const Deleter = new DeletePost(this.service);
    const deleterResult = await Deleter.action(this.remoteid);

    return;
  }

  async prunePosts(startID, endID) {
    const Pruner = new PrunePost(this.service);
    const prunerrResult = await Pruner.action(startID, endID);

    return;
  }
}

module.exports = StorageSystem;
