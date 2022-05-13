const FileDownloader = require("../../components/fileDownloader.js");
const DuplicateChecker = require("../../components/duplicateChecker.js");
const StorageSystem = require("../../components/storageSystem.js");
const TagValidator = require("../../components/tagValidator.js");
const RatingValidator = require("../../components/ratingValidator.js");
const TagExceptions = require("../../components/tags/exceptions.js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();

if (!process.argv[2] || !process.argv[3])
  return console.log(
    `You must provide both a starting ID and an ending ID for the initial run of this script.`
  );

var startID = parseInt(process.argv[2]);
var endID = parseInt(process.argv[3]);
var currentID = startID;

async function downloader() {
  console.log(`Fetching post E621#${currentID}.`);

  const e621PostURL = await fetch(
    `https://e621.net/posts/${currentID}.json?login=${process.env.E621_USERNAME}&api_key=${process.env.E621_KEY}`,
    {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:52.0) Gecko/20100101 Firefox/52.0 Grabber/7.7.1",
        Accept: "application/json",
      },
    }
  );
  const postParse = JSON.parse(await e621PostURL.text());

  if (currentID > endID) {
    // Allow the script to run autonomously. Begin downloading new posts once the currentID exceeds the endID.
    const refreshEndIDURL = await fetch(
      `https://e621.net/posts.json?login=${process.env.E621_USERNAME}&api_key=${process.env.E621_KEY}`,
      {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:52.0) Gecko/20100101 Firefox/52.0 Grabber/7.7.1",
          Accept: "application/json",
        },
      }
    );
    const latestPosts = JSON.parse(await refreshEndIDURL.text());
    return (endID = latestPosts[0].id);
  } else if (!postParse.post) {
    return (currentID = currentID + 1);
  }

  const post = postParse.post;

  // Don't process new posts too quickly, it takes time for it to properly enter the API!
  const postDate = Date.parse(post.created_at) / 1000;
  const currentDate = Date.now() / 1000;
  const minimumPostAge = 86400 * 7;

  if (currentDate - postDate < minimumPostAge) {
    return console.log(`E621#${currentID} is too new, will retry soon!`);
  }

  // Abort early on if something bad is detected
  const rejectionTags = TagExceptions.tag_exceptions.blacklisted.e621.join("|");
  const rejectionTagsRegEXP = new RegExp(rejectionTags, "gm");
  const rejectionTagsMatches = post.tags.general
    .join(" ")
    .match(rejectionTagsRegEXP);

  if (rejectionTagsMatches) {
    console.log(
      `Remote post E621#${currentID} has a blacklisted tag, skipping!`
    );
    return (currentID = currentID + 1);
  } else if (post.fav_count < 15) {
    if (post.score.total < 7) {
      console.log(
        `Remote post E621#${currentID} has less than 15 favorites and has a score less than 7, skipping!`
      );
      return (currentID = currentID + 1);
    }
  }

  // Download the file. Will go to /home/scripting/Guardian/script/components/image-store/e621/initial
  let file_url;

  if (!post.file.url) {
    console.log(
      `E621#${currentID} is blocked content, cannot get a file URL for downloading, skipping!`
    );
    return (currentID = currentID + 1);
  } else if (post.file.ext === "zip") {
    file_url = post.sample.url;
  } else file_url = post.file.url;

  const DownloadClient = new FileDownloader("e621", file_url, currentID);

  const tryFullDownload = await DownloadClient.downloadFullFile(post.file.url);
  const tryPreviewDownload = await DownloadClient.downloadPreviewFile(
    post.preview.url
  );

  if (tryFullDownload === false) {
    const retryFullDownload = await DownloadClient.retryFullDownload();

    if (retryFullDownload === false) {
      console.log(`Failed to download full E621#${currentID}.`);
      return (currentID = currentID + 1);
    }
  }

  if (tryPreviewDownload === false) {
    const retryPreviewDownload = await DownloadClient.retryPreviewDownload();

    if (retryPreviewDownload === false) {
      console.log(`Failed to download preview E621#${currentID}.`);
      return (currentID = currentID + 1);
    }
  }

  console.log(`Successfully downloaded E621#${currentID}.`);

  // Duplicate checking
  const downloadedFile = `/home/scripting/Guardian/script/image-store/e621/thumbnail/e621-post_id-${currentID}.jpg`;

  const DuplicateClient = new DuplicateChecker(
    downloadedFile,
    "e621",
    currentID
  );
  let isDuplicate;

  try {
    isDuplicate = await DuplicateClient.parseDuplicates(
      downloadedFile,
      post.file.height,
      post.file.width,
      post.file.ext,
      post.file.size
    );
  } catch (error) {
    isDuplicate = 0;
  }

  let parentID;

  if (isDuplicate !== 0 && isDuplicate !== null) {
    parentID = isDuplicate;
  } else if (post.relationships.parent_id !== null) {
    // Process remote parent ID
    const eParentCheck = await fetch(
      `https://e621.net/posts/${post.relationships.parent_id}.json?login=${process.env.E621_USERNAME}&api_key=${process.env.E621_KEY}`,
      {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:52.0) Gecko/20100101 Firefox/52.0 Grabber/7.7.1",
          Accept: "application/json",
        },
      }
    );
    const eParentPostParse = JSON.parse(await eParentCheck.text());
    const eParentPost = eParentPostParse.post;

    if (!eParentPostParse.post) {
      parentID = null;
    } else {
      const sParentCheck = await fetch(
        `https://capi-v2.sankakucomplex.com/posts?tags=md5:${eParentPost.file.md5}`
      );
      const sParentPostParse = JSON.parse(await sParentCheck.text());
      const sParentPost = sParentPostParse[0];

      if (sParentPostParse.length === 0) {
        parentID = null;
      } else parentID = sParentPost.id;
    }
  } else parentID = null;

  console.log(`Successfully duplicate checked E621#${currentID}.`);

  // Replace poor remote tags
  const combineTags = `${post.tags.general.join(" ")} ${post.tags.species.join(
    " "
  )} ${post.tags.character.join(" ")} ${post.tags.copyright.join(
    " "
  )} ${post.tags.artist.join(" ")} ${post.tags.meta.join(" ")}`;
  let tags;

  const TagClient = new TagValidator("e621", combineTags);

  tags = await TagClient.massValidateTags("e621", combineTags);

  if (!tags.includes("human") && !tags.includes("scalie")) {
    tags = tags + " anthro";
  }

  // Re-rate post, if necessary
  let rating;

  const RatingClient = new RatingValidator(tags, post.rating);

  rating = await RatingClient.validateRating();

  if ((rating === "q" || rating === "e") && tags.includes("cub")) {
    tags = tags + " contentious_content";
  }

  // Storing the post in a Postgres database
  const StorageClient = new StorageSystem(
    "e621",
    post.id,
    rating,
    post.sources[0],
    parentID,
    post.file.url,
    post.file.ext,
    tags
  );
  const storage = await StorageClient.storePost(post.file.md5);

  console.log(`Successfully stored E621#${post.id}.`);
  return (currentID = currentID + 1);
}

// Start the script
if (process.argv[2] !== "stop") {
  //Set download interval.
  var downloadInterval = setInterval(downloader, 15000);

  console.log(`E621 download script started with beginning ID ${startID}.`);
}
