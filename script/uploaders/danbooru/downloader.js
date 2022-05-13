const FileDownloader = require("../../components/fileDownloader.js");
const DuplicateChecker = require("../../components/duplicateChecker.js");
const StorageSystem = require("../../components/storageSystem.js");
const TagValidator = require("../../components/tagValidator.js");
const RatingValidator = require("../../components/ratingValidator.js");
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
  console.log(`Fetching post DANBOORU#${currentID}.`);

  const danbooruPostURL = await fetch(
    `https://danbooru.donmai.us/posts/${currentID}.json?login=${process.env.GOLD_DANBOORU_USERNAME}&api_key=${process.env.GOLD_DANBOORU_KEY}`,
    {
      method: "GET",
    }
  );
  const post = JSON.parse(await danbooruPostURL.text());

  if (currentID > endID) {
    // Allow the script to run autonomously. Begin downloading new posts once the currentID exceeds the endID.
    const refreshEndIDURL = await fetch(
      `https://danbooru.donmai.us/posts.json?login=${process.env.GOLD_DANBOORU_USERNAME}&api_key=${process.env.GOLD_DANBOORU_KEY}`,
      {
        method: "GET",
      }
    );
    const latestPosts = JSON.parse(await refreshEndIDURL.text());
    return (endID = latestPosts[0].id);
  } else if (post.length === 0) {
    return (currentID = currentID + 1);
  }

  // Don't process new posts too quickly, it takes time for it to properly enter the API!
  const postDate = Date.parse(post.created_at) / 1000;
  const currentDate = Date.now() / 1000;
  const minimumPostAge = 300;

  if (currentDate - postDate < minimumPostAge) {
    return console.log(`DANBOORU#${currentID} is too new, will retry soon!`);
  }

  // Download the file. Will go to /home/scripting/Guardian/script/components/image-store/danbooru/initial
  let file_url;

  if (!post.file_url) {
    console.log(
      `DANBOORU#${currentID} is blocked content, cannot get a file URL for downloading, skipping!`
    );
    return (currentID = currentID + 1);
  } else if (post.file_ext === "zip") {
    file_url = post.large_file_url;
  } else file_url = post.file_url;

  const DownloadClient = new FileDownloader("danbooru", file_url, currentID);

  const tryFullDownload = await DownloadClient.downloadFullFile(post.file_url);
  const tryPreviewDownload = await DownloadClient.downloadPreviewFile(
    post.preview_file_url
  );

  if (tryFullDownload === false) {
    const retryFullDownload = await DownloadClient.retryFullDownload();

    if (retryFullDownload === false) {
      console.log(`Failed to download full DANBOORU#${currentID}.`);
      return (currentID = currentID + 1);
    }
  }

  if (tryPreviewDownload === false) {
    const retryPreviewDownload = await DownloadClient.retryPreviewDownload();

    if (retryPreviewDownload === false) {
      console.log(`Failed to download preview DANBOORU#${currentID}.`);
      return (currentID = currentID + 1);
    }
  }

  console.log(`Successfully downloaded DANBOORU#${currentID}.`);

  // Duplicate checking
  const downloadedFile = `/home/scripting/Guardian/script/image-store/danbooru/thumbnail/danbooru-post_id-${currentID}.jpg`;

  const DuplicateClient = new DuplicateChecker(
    downloadedFile,
    "danbooru",
    currentID
  );
  let isDuplicate;

  try {
    isDuplicate = await DuplicateClient.parseDuplicates(
      downloadedFile,
      post.height,
      post.width,
      post.file_ext,
      post.file_size
    );
  } catch (error) {
    isDuplicate = 0;
  }

  let parentID;

  if (isDuplicate !== 0 && isDuplicate !== null) {
    parentID = isDuplicate;
  } else if (post.parent_id !== null) {
    // Process remote parent ID
    const dParentCheck = await fetch(
      `https://danbooru.donmai.us/posts/${post.parent_id}.json?login=${process.env.GOLD_DANBOORU_USERNAME}&api_key=${process.env.GOLD_DANBOORU_KEY}`,
      {
        method: "GET",
      }
    );
    const dParentPostParse = JSON.parse(await dParentCheck.text());
    const dParentPost = dParentPostParse[0];

    if (dParentPostParse.length === 0) {
      parentID = null;
    } else {
      const sParentCheck = await fetch(
        `https://capi-v2.sankakucomplex.com/posts?tags=md5:${dParentPost.md5}`,
        {
          method: "GET",
        }
      );
      const sParentPostParse = JSON.parse(await sParentCheck.text());
      const sParentPost = sParentPostParse[0];

      if (sParentPostParse.length === 0) {
        parentID = null;
      } else parentID = sParentPost.id;
    }
  } else parentID = null;

  console.log(`Successfully duplicate checked DANBOORU#${currentID}.`);

  // Replace poor remote tags
  let tags;

  const TagClient = new TagValidator("danbooru", post.tags);

  tags = await TagClient.massValidateTags("danbooru", post.tags);

  // Re-rate post, if necessary
  let rating;

  const RatingClient = new RatingValidator(tags, post.rating);

  rating = await RatingClient.validateRating();

  // Storing the post in a Postgres database
  const StorageClient = new StorageSystem(
    "danbooru",
    post.id,
    rating,
    post.source,
    parentID,
    post.file_url,
    post.file_ext,
    tags
  );
  const storage = await StorageClient.storePost(post.md5);

  console.log(`Successfully stored DANBOORU#${post.id}.`);
  return (currentID = currentID + 1);
}

// Start the script
if (process.argv[2] !== "stop") {
  //Set download interval.
  var downloadInterval = setInterval(downloader, 15000);

  console.log(`DANBOORU download script started with beginning ID ${startID}.`);
}
