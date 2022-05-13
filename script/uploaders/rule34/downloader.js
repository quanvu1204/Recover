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
  console.log(`Fetching post RULE34#${currentID}.`);

  const ParseClient = new XMLParser();

  const rule34PostURL = await fetch(
    `https://rule34.xxx/index.php?page=dapi&s=post&q=index&id=${currentID}`,
    {
      method: "GET",
    }
  );
  const rule34Response = await rule34PostURL.text();
  const postPtJ = await ParseClient.parseXML(rule34Response);

  if (currentID > endID) {
    console.log(`RULE34 download script has finished.`);
    return clearInterval(downloadInterval);
  } else if (postPtJ.posts._attributes.count === "0") {
    return (currentID = currentID + 1);
  }

  const post = postPtJ.posts.post._attributes;

  // Don't process new posts too quickly, it takes time for it to properly enter the API!
  const postDate = Date.parse(post.created_at) / 1000;
  const currentDate = Date.now() / 1000;
  const minimumPostAge = 86400 * 7;

  if (currentDate - postDate < minimumPostAge) {
    return console.log(`RULE34#${currentID} is too new, will retry soon!`);
  }

  // Abort early on if something bad is detected
  const rejectionTags =
    TagExceptions.tag_exceptions.blacklisted.rule34.join("|");
  const conditionTags =
    TagExceptions.tag_exceptions.conditional.rule34.join("|");
  const rejectionTagsRegEXP = new RegExp(rejectionTags, "gm");
  const conditionTagsRegEXP = new RegExp(conditionTags, "gm");
  const rejectionTagsMatches = post.tags.match(rejectionTagsRegEXP);
  const conditionTagsMatches = post.tags.match(conditionTagsRegEXP);
  const rejectionUsers = ["48613"];

  if (rejectionUsers.includes(post.creator_id)) {
    console.log(
      `Remote post RULE34#${currentID} was uploaded by a blacklisted user, skipping!`
    );
    return (currentID = currentID + 1);
  } else if (rejectionTagsMatches) {
    console.log(
      `Remote post RULE34#${currentID} has a blacklisted tag, skipping!`
    );
    return (currentID = currentID + 1);
  } else if (conditionTagsMatches && parseInt(post.score) < 6) {
    console.log(
      `Remote post RULE34#${currentID} is a low quality furry post, skipping!`
    );
    return (currentID = currentID + 1);
  }

  // Decipher file type, for further download reasons and Rule34 abnormalities
  const DecipherClient = new DecipherFileType(post.file_url);

  const fileType = await DecipherClient.decipherType(post.file_url);

  // Download the file. Will go to /home/scripting/Guardian/script/components/image-store/rule34/initial
  const DownloadClient = new FileDownloader("rule34", post.file_url, currentID);

  const tryFullDownload = await DownloadClient.downloadFullFile(post.file_url);
  const tryPreviewDownload = await DownloadClient.downloadPreviewFile(
    post.preview_url
  );

  if (tryFullDownload === false) {
    const retryFullDownload = await DownloadClient.retryFullDownload();

    if (retryFullDownload === false) {
      currentID = currentID + 1;
      return console.log(`Failed to download full RULE34#${currentID}.`);
    }
  }

  if (tryPreviewDownload === false) {
    const retryPreviewDownload = await DownloadClient.retryPreviewDownload();

    if (retryPreviewDownload === false) {
      currentID = currentID + 1;
      return console.log(`Failed to download preview RULE34#${currentID}.`);
    }
  }

  console.log(`Successfully downloaded RULE34#${currentID}.`);

  // Duplicate checking
  const downloadedFile = `/home/scripting/Guardian/script/image-store/rule34/thumbnail/rule34-post_id-${currentID}.jpg`;
  const fileSize = fs.statSync(
    `/home/scripting/Guardian/script/image-store/rule34/initial/rule34-post_id-${currentID}.${fileType}`
  );

  const DuplicateClient = new DuplicateChecker(
    downloadedFile,
    "rule34",
    currentID
  );
  let isDuplicate;

  try {
    isDuplicate = await DuplicateClient.parseDuplicates(
      downloadedFile,
      post.height,
      post.width,
      fileType,
      fileSize.size
    );
  } catch (error) {
    isDuplicate = 0;
  }

  let parentID;

  if (isDuplicate !== 0 && isDuplicate !== null) {
    parentID = isDuplicate;
  } else if (post.parent_id !== null && post.parent_id !== "") {
    // Process remote parent ID
    const rParentCheck = await fetch(
      `https://rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=id%3A${post.parent_id}`,
      {
        method: "GET",
      }
    );
    const rParentPostP = JSON.parse(await rParentCheck.text());
    const rParentPost = rParentPostP[0];

    if (rParentPostP.length === 0) {
      parentID = null;
    } else {
      const sParentCheck = await fetch(
        `https://capi-v2.sankakucomplex.com/posts?tags=md5:${rParentPost.md5}`,
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

  console.log(`Successfully duplicate checked RULE34#${currentID}.`);

  // Replace poor remote tags
  let tags;

  const TagClient = new TagValidator("rule34", post.tags);

  tags = await TagClient.massValidateTags(post.tags);
  tags = await TagClient.singleValidateTags(
    tags,
    "pokemon_ss",
    "pokemon_sword_&_shield"
  );

  // Process automatic approval for uploading, or set it to require manual approval. Pray for whoever's job this will be
  const whitelistTags =
    TagExceptions.tag_exceptions.whitelisted.rule34.join("|");
  const whitelistTagsRegEXP = new RegExp(whitelistTags, "gm");
  const whitelistTagsMatches = post.tags.match(whitelistTagsRegEXP);
  let autoApprove;
  let denyReason;

  if (post.tags.includes("video") || post.tags.includes("webm")) {
    autoApprove = true;
  } else if (whitelistTagsMatches) {
    autoApprove = true;
  } else if (parseInt(post.score) > 4) {
    autoApprove = true;
  } else if (parseInt(post.score) < 4) {
    autoApprove = false;
    denyReason = "Score";
  } else if (whitelistTagsMatches === null) {
    autoApprove = false;
    denyReason = "No acceptable tags";
  } else {
    autoApprove = false;
    denyReason = "Other";
  }

  // Storing the post in a Postgres database
  const StorageClient = new StorageSystem(
    "rule34",
    currentID,
    post.rating,
    post.source,
    parentID,
    post.file_url,
    fileType,
    tags
  );

  if (autoApprove === true) {
    await StorageClient.storePost(post.md5);
    console.log(`Successfully stored RULE34#${currentID}. [A]`);
  } else {
    await StorageClient.delayPost(post.md5, post.score, denyReason);
    console.log(`Successfully stored RULE34#${currentID}. [D]`);
  }

  return (currentID = currentID + 1);
}

// Start the script
if (process.argv[2] !== "stop") {
  //Set download interval.
  var downloadInterval = setInterval(downloader, 15000);

  console.log(`RULE34 download script started with beginning ID ${startID}.`);
}
