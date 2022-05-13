const FileDownloader = require("../../components/fileDownloader.js");
const DuplicateChecker = require("../../components/duplicateChecker.js");
const StorageSystem = require("../../components/storageSystem.js");
const TagValidator = require("../../components/tagValidator.js");
const XMLParser = require("../../components/XMLParser.js");
const DecipherFileType = require("../../components/decipherFileType.js");
const TagExceptions = require("../../components/tags/exceptions.js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const fs = require("fs");

if (!process.argv[2] || !process.argv[3])
  return console.log(
    `You must provide both a starting ID and an ending ID for the initial run of this script.`
  ); 

var startID = parseInt(process.argv[2]);
var endID = parseInt(process.argv[3]);
var currentID = startID;

async function downloader() {
  console.log(`Fetching post GELBOORU#${currentID}.`);

  const ParseClient = new XMLParser();

  const gelbooruPostURL = await fetch(
    `https://gelbooru.com/index.php?page=dapi&s=post&q=index&id=${currentID}`,
    {
      method: "GET",
    }
  );
  const gelbooruResponse = await gelbooruPostURL.text();
  const postPtJ = await ParseClient.parseXML(gelbooruResponse);

  if (currentID > endID) {
    console.log(`GELBOORU download script has finished.`);
    return clearInterval(downloadInterval);
  } else if (postPtJ.posts._attributes.count === "0") {
    return (currentID = currentID + 1);
  }

  const post = postPtJ.posts.post;

  // Don't process new posts too quickly, it takes time for it to properly enter the API!
  const postDate = Date.parse(post.created_at) / 1000;
  const currentDate = Date.now() / 1000;
  const minimumPostAge = 86400 * 7;

  if (currentDate - postDate < minimumPostAge) {
    return console.log(`GELBOORU#${currentID} is too new, will retry soon!`);
  }

  // Abort early on if something bad is detected
  const rejectionTags =
    TagExceptions.tag_exceptions.blacklisted.gelbooru.join("|");
  const rejectionTagsRegEXP = new RegExp(rejectionTags, "gm");
  const rejectionTagsMatches = post.tags._text.match(rejectionTagsRegEXP);
  const rejectionUsers = ["323314", "263262"];

  if (rejectionUsers.includes(post.creator_id._text)) {
    console.log(
      `Remote post GELBOORU#${currentID} was uploaded by a blacklisted user, skipping!`
    );
    return (currentID = currentID + 1);
  } else if (rejectionTagsMatches) {
    console.log(
      `Remote post GELBOORU#${currentID} has a blacklisted tag, skipping!`
    );
    return (currentID = currentID + 1);
  } else if (
    post.source._text &&
    post.source._text.toLowerCase().includes("sankaku")
  ) {
    console.log(
      `Remote post GELBOORU#${currentID}'s source indicates it exists locally, skipping!`
    );
    return (currentID = currentID + 1);
  }

  // Decipher file type, for further download reasons and Gelbooru abnormalities
  const DecipherClient = new DecipherFileType(post.file_url._text);

  let fileType;

  if (post.tags._text.includes("webm")) {
    fileType = "webm";
  } else fileType = await DecipherClient.decipherType(post.file_url._text);

  let fileURL;

  if (fileType === "webm") {
    fileURL = post.file_url._text.replace(/(\.mp4)/, ".webm");
  } else fileURL = post.file_url._text;

  // Download the file. Will go to /home/scripting/Guardian/script/components/image-store/gelbooru/initial
  const DownloadClient = new FileDownloader("gelbooru", fileURL, currentID);

  const tryFullDownload = await DownloadClient.downloadFullFile(fileURL);
  const tryPreviewDownload = await DownloadClient.downloadPreviewFile(
    post.preview_url._text
  );

  if (tryFullDownload === false) {
    const retryFullDownload = await DownloadClient.retryFullDownload();

    if (retryFullDownload === false) {
      console.log(`Failed to download full GELBOORU#${currentID}.`);
      return (currentID = currentID + 1);
    }
  }

  if (tryPreviewDownload === false) {
    const retryPreviewDownload = await DownloadClient.retryPreviewDownload();

    if (retryPreviewDownload === false) {
      console.log(`Failed to download preview GELBOORU#${currentID}.`);
      return (currentID = currentID + 1);
    }
  }

  console.log(`Successfully downloaded GELBOORU#${currentID}.`);

  // Duplicate checking
  const downloadedFile = `/home/scripting/Guardian/script/image-store/gelbooru/thumbnail/gelbooru-post_id-${currentID}.jpg`;
  const fileSize = fs.statSync(
    `/home/scripting/Guardian/script/image-store/gelbooru/initial/gelbooru-post_id-${currentID}.${fileType}`
  );

  const DuplicateClient = new DuplicateChecker(
    downloadedFile,
    "gelbooru",
    currentID
  );
  let isDuplicate;

  try {
    isDuplicate = await DuplicateClient.parseDuplicates(
      downloadedFile,
      post.height._text,
      post.width._text,
      fileType,
      fileSize.size
    );
  } catch (error) {
    isDuplicate = 0;
  }

  let parentID;

  if (isDuplicate !== 0 && isDuplicate !== null) {
    parentID = isDuplicate;
  } else if (post.parent_id._text !== null && post.parent_id._text !== "0") {
    // Process remote parent ID
    const gParentCheck = await fetch(
      `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=id%3A${post.parent_id._text}`,
      {
        method: "GET",
      }
    );
    const gParentPostP = JSON.parse(await gParentCheck.text());
    const gParentPost = gParentPostP[0];

    if (gParentPostP.length === 0) {
      parentID = null;
    } else {
      const sParentCheck = await fetch(
        `https://capi-v2.sankakucomplex.com/posts?tags=md5:${gParentPost.md5}`,
        {
          method: "GET",
        }
      );
      const sParentPostP = JSON.parse(await sParentCheck.text());
      const sParentPost = sParentPostP[0];

      if (sParentPostP.length === 0) {
        parentID = null;
      } else parentID = sParentPost.id;
    }
  } else parentID = null;

  console.log(`Successfully duplicate checked GELBOORU#${currentID}.`);

  // Replace poor remote tags
  let tags;

  const TagClient = new TagValidator("gelbooru", post.tags._text);

  tags = await TagClient.massValidateTags(post.tags._text);

  // Re-rate poorly tagged posts
  let rating;

  if (tags.split(" ").length <= 7 && post.rating._text === "safe") {
    rating = "q";
  } else rating = post.rating._text.charAt(0);

  // Storing the post in a Postgres database
  const StorageClient = new StorageSystem(
    "gelbooru",
    currentID,
    rating,
    post.source._text,
    parentID,
    fileURL,
    fileType,
    tags
  );

  const storage = await StorageClient.storePost(post.md5._text);

  console.log(`Successfully stored GELBOORU#${currentID}.`);
  return (currentID = currentID + 1);
}

// Start the script
if (process.argv[2] !== "stop") {
  //Set download interval.
  var downloadInterval = setInterval(downloader, 15000);

  console.log(`GELBOORU download script started with beginning ID ${startID}.`);
}
