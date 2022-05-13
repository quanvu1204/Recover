const TokenRefresh = require("../../components/tokenRefresh.js");
const EmailError = require("../../components/emailError.js");
const StatisticTracking = require("../../components/statisticUpdating.js");
const StatisticRetrieving = require("../../components/models/statistics/retrieve.js");
const StorageSystem = require("../../components/storageSystem.js");
const PostFinder = require("../../components/models/posts/find.js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const FormData = require("form-data");
const fs = require("fs");
require("dotenv").config();

if (!process.argv[2] || !process.argv[3])
  return console.log(
    `You must provide both a starting ID and an ending ID for the initial run of this script.`
  );

var startID = parseInt(process.argv[2]);
var endID = parseInt(process.argv[3]);
var failID = 75;
var currentID = startID;
var uploaderToken = `Bearer ${process.argv[4]}`;

async function uploader() {
  console.log(`Processing remote post E-SHUUSHUU#${currentID}.`);

  const PostClient = new PostFinder("shuushuu", currentID);
  const post = await PostClient.findById();
  const PreStatisticClient = new StatisticRetrieving("shuushuu", "fail");
  const failCount = await PreStatisticClient.collect();
  const StorageClient = new StorageSystem("shuushuu", currentID);

  if (currentID > endID) {
    //Shuushuu has no nice API, stop once end ID has been surpassed
    console.log(`E-SHUUSHUU upload script has finished.`);
    clearInterval(tokenInterval);
    return clearInterval(uploadInterval);
  } else if (post === "none") {
    console.log(`No data for E-SHUUSHUU#${currentID} found in database.`);
    return (currentID = currentID + 1);
  } else if (failCount.failed_count > failID) {
    // Initiate email error
    const ErrorClient = new EmailError(
      `E-SHUUSHUU upload script has failed ${failCount.failed_count} times. Investigate for further issues!`
    );
    const sendMail = await ErrorClient.sendEmail(
      process.env.EMAIL_TO_ADDRESS,
      process.env.EMAIL_FROM_ADDRESS,
      process.env.EMAIL_FROM_PASSWORD
    );

    console.log(
      `E-SHUUSHUU upload script has failed ${failCount.failed_count} times, exiting for now...`
    );

    return clearInterval(uploadInterval);
  } else {
    const parentID = post.parent_id;
    const file = post.file_path;
    const thumbnail = `/home/scripting/Guardian/script/image-store/shuushuu/thumbnail/shuushuu-post_id-${currentID}.jpg`;
    const rating = post.rating;
    const tags = post.tags.replace(",", " ");

    const formData = new FormData();
    formData.append("post[file]", fs.createReadStream(file));
    if (parentID !== null) {
      formData.append("post[parent_id]", parentID);
    }
    formData.append("post[rating]", rating);
    formData.append("post[tags]", tags);

    try {
      await fetch("https://capi-v2.sankakucomplex.com/posts", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: uploaderToken,
        },
      })
        .then((res) => res.text())
        .then(async (text) => {
          const response = await JSON.parse(text);
          const StatisticClient = new StatisticTracking("shuushuu");

          if (response.success !== true) {
            var increment = StatisticClient.incrementFailCount();

            console.log(
              `Failed to upload E-SHUUSHUU#${currentID}. Error(s): ${text}`
            );
            StorageClient.addRetry();
            return (currentID = currentID + 1);
          } else {
            var increment = StatisticClient.incrementUploadCount();

            console.log(`Successfully uploaded E-SHUUSHUU#${currentID}.`);
            fs.unlink(file, async function () {
              console.log("Successfully purged post from the file system!");
            });
            fs.unlink(thumbnail, async function () {
              console.log("Successfully purged thumbnail from the file system!");
            });
            StorageClient.deletePost();
            return (currentID = currentID + 1);
          }
        });
    } catch (error) {
      console.log(error);
      StorageClient.addRetry();
      console.log(
        `E-SHUUSHUU#${currentID} will need to be retried, API error.`
      );
      return (currentID = currentID + 1);
    }
  }
}

async function authorizer() {
  const body = {
    login: process.env.SHUUTAN_USERNAME,
    password: process.env.SHUUTAN_PASSWORD,
  };
  fetch(`https://capi-v2.sankakucomplex.com/auth/token`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
    .then((res) => res.json())
    .then((json) => {
      uploaderToken = `Bearer ${json.access_token}`;
    });

  console.log("Successfully refreshed API token.");
}

// Start the script
if (process.argv[2] !== "stop") {
  // Set script intervals
  var tokenInterval = setInterval(authorizer, 66500000);
  var uploadInterval = setInterval(uploader, 20000);

  console.log(`Shuushuu upload script started with beginning ID ${startID}.`);
}
