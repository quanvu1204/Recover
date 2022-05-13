const TokenRefresh = require("../../components/tokenRefresh.js");
const EmailError = require("../../components/emailError.js");
const StatisticTracking = require("../../components/statisticUpdating.js");
const StatisticRetrieving = require("../../components/models/statistics/retrieve.js");
const PostFinder = require("../../components/models/posts/find.js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();

var failID = 75;
var uploaderToken = `Bearer ${process.argv[2]}`;

async function retryer() {
  const PostClient = new PostFinder("shuushuu");
  const post = PostClient.findByRetry();
  const PreStatisticClient = new StatisticRetrieving("shuushuu", "fail");
  const failCount = PreStatisticClient.collect();

  if (post === "none") {
    clearInterval(retryInterval);
    clearInterval(tokenInterval);
    return console.log("All posts have been successfully retried.");
  } else if (failCount > failID) {
    // Initiate email error
    const ErrorClient = new EmailError(
      `E-SHUUSHUU retry script has failed ${failCount.failed_count} times. Investigate for further issues!`
    );
    const sendMail = await ErrorClient.sendEmail(
      process.env.EMAIL_TO_ADDRESS,
      process.env.EMAIL_FROM_ADDRESS,
      process.env.EMAIL_FROM_PASSWORD
    );

    console.log(
      `E-SHUUSHUU retry script has failed ${failCount.failed_count} times, exiting for now...`
    );

    return clearInterval(retryInterval);
  } else {
    console.log(`Processing E-SHUUSHUU#${post.remote_id}`);

    const parentID = post.parent_id;
    const source = post.source;
    const uploadURL = post.upload_url;
    const rating = post.rating;
    const tags = post.tags.replace(",", "");

    const body = {
      post: {
        parent_id: parentID,
        rating: rating,
        upload_url: uploadURL,
        source: source,
        tags: tags.replace(",", ""),
      },
    };

    try {
      await fetch("https://capi-v2.sankakucomplex.com/posts", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: uploaderToken,
        },
      })
        .then((res) => res.text())
        .then(async (text) => {
          const response = await JSON.parse(text);
          const StatisticClient = new StatisticTracking("zerochan");

          if (response.success !== true) {
            var increment = StatisticClient.incrementFailCount();

            console.log(
              `Failed to upload ZEROCHAN#${currentID}. Error(s): ${text}`
            );
            StorageClient.addRetry();
            return (currentID = currentID + 1);
          } else {
            var increment = StatisticClient.incrementUploadCount();

            console.log(`Successfully uploaded ZEROCHAN#${currentID}.`);
            fs.unlink(file, async function () {
              console.log("Successfully purged post from the file system!");
            });
            StorageClient.deletePost();
            return (currentID = currentID + 1);
          }
        });
    } catch (error) {
      return console.log(
        `An error occurred while trying to retry ZEROCHAN#${currentID}. Error(s): ${error}`
      );
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
  var retryInterval = setInterval(retryer, 2500);

  console.log(`E-SHUUSHUU retry script started.`);
}
