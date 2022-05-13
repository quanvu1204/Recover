const FileDownloader = require("../../components/fileDownloader.js");
const DuplicateChecker = require("../../components/duplicateChecker.js");
const StorageSystem = require("../../components/storageSystem.js");
const TagValidator = require("../../components/tagValidator.js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

if (!process.argv[2] || !process.argv[3])
  return console.log(
    `You must provide both a starting ID and an ending ID for the initial run of this script.`
  );

var startID = parseInt(process.argv[2]);
var endID = parseInt(process.argv[3]);
var currentID = startID;

async function downloader() {
  console.log(`Fetching post YANDERE#${currentID}.`);

  const yanderePostURL = await fetch(
    `https://yande.re/post.json?limit=1&tags=id:${currentID}`,
    {
      method: "GET",
    }
  );
  const postParse = JSON.parse(await yanderePostURL.text());
  const post = postParse[0];

  if (currentID > endID) {
    // Allow the script to run autonomously. Begin downloading new posts once the currentID exceeds the endID.
    const refreshEndIDURL = await fetch(`https://yande.re/post.json`, {
      method: "GET",
    });
    const latestPosts = JSON.parse(await refreshEndIDURL.text());
    return (endID = latestPosts[0].id);
  } else if (postParse.length === 0 && endID !== currentID) {
    return (currentID = currentID + 1);
  }

  // Don't process new posts too quickly, it takes time for it to properly enter the API!
  const postDate = post.created_at;
  const currentDate = Date.now() / 1000;
  const minimumPostAge = 86400 * 7;

  if (currentDate - postDate < minimumPostAge) {
    return console.log(`YANDERE#${currentID} is too new, will retry soon!`);
  }

  // Download the file. Will go to /home/scripting/Guardian/script/components/image-store/yandere/initial
  let file_url;

  if (!post.file_url) {
    console.log(
      `YANDERE#${currentID} was deleted, cannot get a file URL for downloading, skipping!`
    );
    return (currentID = currentID + 1);
  } else if (post.file_ext === "zip") {
    file_url = post.preview_url;
  } else file_url = post.file_url;

  const DownloadClient = new FileDownloader("yandere", file_url, currentID);

  const tryFullDownload = await DownloadClient.downloadFullFile(post.file_url);
  const tryPreviewDownload = await DownloadClient.downloadPreviewFile(
    post.preview_url
  );

  if (tryFullDownload === false) {
    const retryFullDownload = await DownloadClient.retryFullDownload();

    if (retryFullDownload === false) {
      console.log(`Failed to download full YANDERE#${currentID}.`);
      return (currentID = currentID + 1);
    }
  }

  if (tryPreviewDownload === false) {
    const retryPreviewDownload = await DownloadClient.retryPreviewDownload();

    if (retryPreviewDownload === false) {
      console.log(`Failed to download preview YANDERE#${currentID}.`);
      return (currentID = currentID + 1);
    }
  }

  console.log(`Successfully downloaded YANDERE#${currentID}.`);

  // Duplicate checking
  const downloadedFile = `/home/scripting/Guardian/script/image-store/yandere/thumbnail/yandere-post_id-${currentID}.jpg`;

  const DuplicateClient = new DuplicateChecker(
    downloadedFile,
    "yandere",
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
    const yParentCheck = await fetch(
      `https://yande.re/post.json?limit=1&tags=id:${post.parent_id}`,
      {
        method: "GET",
      }
    );
    const yParentPostParse = JSON.parse(await yParentCheck.text());
    const yParentPost = yParentPostParse[0];

    if (yParentPostParse.length === 0) {
      parentID = null;
    } else {
      const sParentCheck = await fetch(
        `https://capi-v2.sankakucomplex.com/posts?tags=md5:${yParentPost.md5}`,
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

  console.log(`Successfully duplicate checked YANDERE#${currentID}.`);

  // Replace poor remote tags
  let tags;

  const TagClient = new TagValidator("yandere", post.tags);

  tags = await TagClient.massValidateTags("yandere", post.tags)
  tags = await TagClient.hetaliaValidateTags("yandere", tags);

  // Re-rate poorly tagged posts
  let rating;

  if (tags.split(" ").length <= 7 && post.rating === "s") {
    rating = "q";
  } else rating = post.rating;

  // Storing the post in a Postgres database
  const StorageClient = new StorageSystem(
    "yandere",
    post.id,
    rating,
    post.source,
    parentID,
    post.file_url,
    post.file_ext,
    tags
  );
  const storage = await StorageClient.storePost(post.md5);

  console.log(`Successfully stored YANDERE#${post.id}.`);
  return (currentID = currentID + 1);
}

// Start the script
if (process.argv[2] !== "stop") {
  //Set download interval.
  var downloadInterval = setInterval(downloader, 15000);

  console.log(`YANDERE download script started with beginning ID ${startID}.`);
}
