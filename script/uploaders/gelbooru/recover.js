const FileDownloader = require("../../components/fileDownloader.js");
const XMLParser = require("../../components/XMLParser.js");
const DecipherFileType = require("../../components/decipherFileType.js");
var fs = require("fs");

var loggerSuccess = fs.createWriteStream("logs/gelbooru/success.txt", {
  flags: "a", // 'a' means appending (old data will be preserved)
});

var loggerError = fs.createWriteStream("logs/gelbooru/error.txt", {
  flags: "a", // 'a' means appending (old data will be preserved)
});

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function download({ md5, from }) {
  try {
    console.log(`Fetching post GELBOORU #${md5}.`);

    const ParseClient = new XMLParser();

    const gelbooruPostURL = await fetch(
      `https://gelbooru.com/index.php?page=dapi&s=post&q=index&tags=md5:${md5}`,
      {
        method: "GET",
      }
    );

    const gelbooruResponse = await gelbooruPostURL.text();
    const postPtJ = await ParseClient.parseXML(gelbooruResponse);
    const post = postPtJ.posts.post;

    const DecipherClient = new DecipherFileType(post.file_url._text);

    let fileType;

    if (post.tags._text.includes("webm")) {
      fileType = "webm";
    } else fileType = await DecipherClient.decipherType(post.file_url._text);

    let fileURL;

    if (fileType === "webm") {
      fileURL = post.file_url._text.replace(/(\.mp4)/, ".webm");
    } else fileURL = post.file_url._text;

    const DownloadClient = new FileDownloader("gelbooru", fileURL, md5);

    const tryFullDownload = await DownloadClient.downloadFullFile(fileURL);
    const tryPreviewDownload = await DownloadClient.downloadPreviewFile(
      post.preview_url._text
    );

    if (tryFullDownload === false) {
      const retryFullDownload = await DownloadClient.retryFullDownload();

      if (retryFullDownload === false) {
        console.log(`Failed to download full GELBOORU #${md5}.`);
      }
    }

    if (tryPreviewDownload === false) {
      const retryPreviewDownload = await DownloadClient.retryPreviewDownload();

      if (retryPreviewDownload === false) {
        console.log(`Failed to download preview GELBOORU #${md5}.`);
      }
    }

    console.log(`Successfully downloaded GELBOORU #${md5}.`);

    loggerSuccess.write(`Success: ${md5}, From: ${from} \n`);
  } catch (error) {
    loggerError.write(`Error: ${md5}, From: ${from} \n`);
    console.log(`Error ${md5} `);
  }
}

// Start the script
module.exports = { download };
