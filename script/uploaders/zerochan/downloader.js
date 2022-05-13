const FileDownloader = require("../../components/fileDownloader.js");
const DuplicateChecker = require("../../components/duplicateChecker.js");
const StorageSystem = require("../../components/storageSystem.js");
const TagValidator = require("../../components/tagValidator.js");
const XMLParser = require("../../components/XMLParser.js");
const DecipherFileType = require("../../components/decipherFileType.js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

var startID = parseInt(process.argv[2]);
var endID = parseInt(process.argv[3]);
var currentID = startID;

async function downloader() {
  console.log(`Fetching post ZEROCHAN#${currentID}.`);

  if (currentID > endID) {
    //Zerochan has no nice API, stop once end ID has been surpassed
    console.log(`ZEROCHAN download script has finished.`);
    return clearInterval(downloadInterval);
  }

  const ParseClient = new XMLParser();

  const zerochanPostURL = await fetch(`https://zerochan.net/${currentID}?xml`, {
    method: "GET",
  });
  const zerochanResponse = await zerochanPostURL.text();
  const postPtJ = await ParseClient.parseXML(zerochanResponse);

  if (postPtJ === "error") {
    return (currentID = currentID + 1);
  }

  const fixColonString = JSON.stringify(postPtJ);
  const noColon = fixColonString.replace(/(media:)+/gm, "");
  const newJSON = JSON.parse(noColon);

  if (
    !newJSON.rss.channel.item &&
    (newJSON.rss.channel._text.includes("Deleted") ||
      newJSON.rss.channel._text.includes("Not found"))
  ) {
    console.log(`ZEROCHAN#${currentID} was deleted, skipping...`);
    return (currentID = currentID + 1);
  }

  const post = newJSON.rss.channel.item;

  // Decipher file type, for further download reasons and Gelbooru abnormalities
  const DecipherClient = new DecipherFileType(post.content._attributes.url);

  let fileType = await DecipherClient.decipherType(
    post.content._attributes.url
  );

  // Download the file. Will go to /home/scripting/Guardian/script/components/image-store/zerochan/initial
  // NOTE: Zerochan semi-API returns only JPG files for their full file URLs, when they also have PNG and GIFs... Preview files seem OK.
  let fileURL = post.content._attributes.url;

  const DownloadClient = new FileDownloader("zerochan", fileURL, currentID);

  const tryFullDownload = await DownloadClient.downloadFullFile(fileURL);
  const tryPreviewDownload = await DownloadClient.downloadPreviewFile(
    post.thumbnail._attributes.url
  );

  if (tryFullDownload === false) {
    const tryPNGFullDownload = await DownloadClient.pngDownload(fileURL);
    fileType = "png";
    fileURL = fileURL.replace(".jpg", `.${fileType}`);

    if (tryPNGFullDownload === false) {
      const tryGIFFullDownload = await DownloadClient.gifDownload(fileURL);
      fileType = "gif";
      fileURL = fileURL.replace(".png", `.${fileType}`);

      if (tryGIFFullDownload === false) {
        console.log(`Failed to download full ZEROCHAN#${currentID}.`);
        return (currentID = currentID + 1);
      }
    }
  }

  if (tryPreviewDownload === false) {
    const retryPreviewDownload = await DownloadClient.retryPreviewDownload();

    if (retryPreviewDownload === false) {
      console.log(`Failed to download preview ZEROCHAN#${currentID}.`);
      return (currentID = currentID + 1);
    }
  }

  console.log(`Successfully downloaded ZEROCHAN#${currentID}.`);

  // Duplicate checking
  const downloadedFile = `/home/scripting/Guardian/script/image-store/zerochan/thumbnail/zerochan-post_id-${currentID}.jpg`;

  const DuplicateClient = new DuplicateChecker(
    downloadedFile,
    "zerochan",
    currentID
  );
  let isDuplicate;

  try {
    isDuplicate = await DuplicateClient.parseDuplicates(
      downloadedFile,
      post.content._attributes.height,
      post.content._attributes.width,
      fileType,
      post.content._attributes.filesize
    );
  } catch (error) {
    isDuplicate = 0;
  }
  
  let parentID;

  if (isDuplicate !== 0 && isDuplicate !== null) {
    parentID = isDuplicate;
  } else parentID = null;

  console.log(`Successfully duplicate checked ZEROCHAN#${currentID}.`);

  // Replace poor remote tags
  let preformatTags;

  if (post.keywords._text) {
    preformatTags = post.keywords._text
      .replace(/\s+/g, "_")
      .replace(/^_|_$/g, "")
      .replace(/,_/g, " ");
  } else preformatTags = "";

  let tags;

  const TagClient = new TagValidator("zerochan", preformatTags);

  tags = await TagClient.hetaliaValidateTags("zerochan", preformatTags);
  tags = await TagClient.gallerySourceTags("zerochan", tags);
  tags = await TagClient.massValidateTags(tags);

  // Storing the post in a Postgres database
  const StorageClient = new StorageSystem(
    "zerochan",
    currentID,
    "s",
    null,
    parentID,
    fileURL,
    fileType,
    tags
  );
  const storage = await StorageClient.storePost(post.hash._text);

  console.log(`Successfully stored ZEROCHAN#${currentID}.`);
  return (currentID = currentID + 1);
}

// Start the script
if (process.argv[2] !== "stop") {
  //Set download interval.
  var downloadInterval = setInterval(downloader, 15000);

  console.log(`ZEROCHAN download script started with beginning ID ${startID}.`);
}
