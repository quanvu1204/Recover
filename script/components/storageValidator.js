const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();

class StorageValidator {
  constructor(service, remoteid) {
    this.service = service;
    this.remoteid = remoteid;
  }

  async original() {
    let success;

    await fetch(
      `${process.env.API_URL}/pending_upload/index?remote_id=${this.remoteid}&service=${this.service}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    )
      .then(async (res) => res.json())
      .then((json) => {
        if (json.length === 0) {
          success = false;
        } else success = true;
      });
    return success;
  }

  async retrial() {
    let success;

    await fetch(
      `http://localhost:3000/pending_upload/index?remote_id=${this.remoteid}&service=${this.service}&is_retried=1`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    )
      .then((res) => res.json())
      .then((json) => {
        if (json.length === 0) {
          success = false;
        } else success = true;
      });

    return success;
  }
}

module.exports = StorageValidator;
