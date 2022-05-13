const FileDownloader = require("../../components/fileDownloader.js");
const DuplicateChecker = require("../../components/duplicateChecker.js");
const StorageSystem = require("../../components/storageSystem.js");
const TagValidator = require("../../components/tagValidator.js");
const XMLParser = require("../../components/XMLParser.js");
const DecipherFileType = require("../../components/decipherFileType.js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const fs = require("fs");
const fileDimensions = require("image-size");

if (!process.argv[2] || !process.argv[3])
  return console.log(
    `You must provide both a starting ID and an ending ID for the initial run of this script.`
  );

var startID = parseInt(process.argv[2]);
var endID = parseInt(process.argv[3]);
var currentID = startID;

async function downloader() {
  console.log(`Fetching post E-SHUUSHUU#${currentID}.`);

  if (currentID > endID) {
    //Shuushuu has no nice API, stop once end ID has been surpassed
    clearInterval(downloadInterval);
    return console.log(`E-SHUUSHUU download script has finished.`);
  }

  const ParseClient = new XMLParser();

  const shuushuuPostURL = await fetch(
    `https://e-shuushuu.net/httpreq.php?mode=show_all_meta&image_id=${currentID}`,
    {
      method: "GET",
    }
  );
  const shuushuuResponse = await shuushuuPostURL.text();
  const postParse = await ParseClient.parseXML(shuushuuResponse);
  const post = postParse.dl;

  const fullRemoteFile = post.dd[2]._text;
  const previewRemoteFile = fullRemoteFile.replace(
    /(.gif|.png|.webm|.mp4|.jpg)+/gm,
    ".jpeg"
  );
  const fullFileURL = `https://e-shuushuu.net/images/${fullRemoteFile}`;
  const previewFileURL = `https://e-shuushuu.net/images/thumbs/${previewRemoteFile}`;

  // Decipher file type, since Shuushuu has no API
  const DecipherClient = new DecipherFileType(fullFileURL);

  const fileType = await DecipherClient.decipherType(fullFileURL);

  // Download the file. Will go to /home/scripting/Guardian/script/components/image-store/shuushuu/initial
  const DownloadClient = new FileDownloader("shuushuu", fullFileURL, currentID);

  const tryFullDownload = await DownloadClient.downloadFullFile(fullFileURL);
  const tryPreviewDownload = await DownloadClient.downloadPreviewFile(
    previewFileURL
  );

  if (tryFullDownload === false) {
    const retryFullDownload = await DownloadClient.retryFullDownload();

    if (retryFullDownload === false) {
      console.log(`Failed to download full E-SHUUSHUU#${currentID}.`);
      return (currentID = currentID + 1);
    }
  }

  if (tryPreviewDownload === false) {
    const retryPreviewDownload = await DownloadClient.retryPreviewDownload();

    if (retryPreviewDownload === false) {
      console.log(`Failed to download preview E-SHUUSHUU#${currentID}.`);
      return (currentID = currentID + 1);
    }
  }

  console.log(`Successfully downloaded E-SHUUSHUU#${currentID}.`);

  // Duplicate checking
  const dirPath = `/home/scripting/Guardian/script/image-store/shuushuu/initial/shuushuu-post_id-${currentID}.${fileType}`;

  const dimensions = post.dd[5]._text.split("x");
  const height = parseInt(dimensions[1]);
  const width = parseInt(dimensions[0]);

  const fileSize = fs.statSync(dirPath);
  const downloadedFile = `/home/scripting/Guardian/script/image-store/shuushuu/thumbnail/shuushuu-post_id-${currentID}.jpeg`;

  const DuplicateClient = new DuplicateChecker(
    downloadedFile,
    "shuushuu",
    currentID
  );
  let isDuplicate;

  try {
    isDuplicate = await DuplicateClient.parseDuplicates(
      downloadedFile,
      height,
      width,
      fileType,
      fileSize.size
    );
  } catch (error) {
    isDuplicate = 0;
  }

  let parentID;

  if (isDuplicate !== 0 && isDuplicate !== null) {
    parentID = isDuplicate;
  } else parentID = null;

  console.log(`Successfully duplicate checked E-SHUUSHUU#${currentID}.`);

  // Replace poor remote tags
  const allTags = [];

  const processTags = post.dd.forEach((row) => {
    if (!row._attributes || row._attributes.class !== "quicktag") {
      return;
    } else {
      if (row.span && !row.span[1]) {
        allTags.push(row.span.a._text.replace(/( )+/gm, "_"));
      } else if (row.span[1]) {
        row.span.forEach((tag) => {
          allTags.push(tag.a._text.replace(/( )+/gm, "_"));
        });
      }
    }
  });

  let tags;

  const TagClient = new TagValidator("shuushuu", allTags.join(" "));

  tags = await TagClient.hetaliaValidateTags("shuushuu", allTags.join(" "));
  tags = await TagClient.singleValidateTags(
    tags,
    "Tony",
    "tony_(chikaku_kabin)"
  );
  tags = await TagClient.singleValidateTags(tags, "hanabi", "fireworks");
  tags = await TagClient.singleValidateTags(tags, "inu", "dog");

  // Storing the post in a Postgres database
  const StorageClient = new StorageSystem(
    "shuushuu",
    currentID,
    "s",
    null,
    parentID,
    fullFileURL,
    fileType,
    tags
  );
  const storage = await StorageClient.storePost(post.md5);

  console.log(`Successfully stored E-SHUUSHUU#${currentID}.`);
  return (currentID = currentID + 1);
}

// Start the script
if (process.argv[2] !== "stop") {
  //Set download interval.
  var downloadInterval = setInterval(downloader, 15000);

  console.log(
    `E-SHUUSHUU download script started with beginning ID ${startID}.`
  );
}
