const FileDownloader = require("../../components/fileDownloader.js");
const XMLParser = require("../../components/XMLParser.js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
var fs = require("fs");

var loggerSuccess = fs.createWriteStream("logs/rule34/success.txt", {
  flags: "a", // 'a' means appending (old data will be preserved)
});

var loggerError = fs.createWriteStream("logs/rule34/error.txt", {
  flags: "a", // 'a' means appending (old data will be preserved)
});


async function download({ md5, from }) {
  try {
    console.log(
      `Fetching post RULE34#${md5}.`,
      `https://rule34.xxx/index.php?page=dapi&s=post&q=index&md5=${md5}`
    );

    const ParseClient = new XMLParser();

    const rule34PostURL = await fetch(
      `https://rule34.xxx/index.php?page=dapi&s=post&q=index&tags=md5%3a${md5}`,
      {
        method: "GET",
      }
    );
    const rule34Response = await rule34PostURL.text();
    const postPtJ = await ParseClient.parseXML(rule34Response);
    const post = postPtJ.posts.post._attributes;

    // Download the file. Will go to /home/scripting/Guardian/script/components/image-store/rule34/initial
    const DownloadClient = new FileDownloader("rule34", post.file_url, md5);

    const tryFullDownload = await DownloadClient.downloadFullFile(
      post.file_url
    );
    const tryPreviewDownload = await DownloadClient.downloadPreviewFile(
      post.preview_url
    );

    if (tryFullDownload === false) {
      const retryFullDownload = await DownloadClient.retryFullDownload();

      if (retryFullDownload === false) {
        return console.log(`Failed to download full RULE34 #${md5}.`);
      }
    }

    if (tryPreviewDownload === false) {
      const retryPreviewDownload = await DownloadClient.retryPreviewDownload();

      if (retryPreviewDownload === false) {
        md5 = md5 + 1;
        return console.log(`Failed to download preview RULE34 #${md5}.`);
      }
    }
    console.log(`Successfully downloaded RULE34 #${md5}.`);
    loggerSuccess.write(`Success: ${md5}, From: ${from} \n`);
  } catch (error) {
    // write to file
    loggerError.write(`Error: ${md5}, From: ${from} \n`);
    console.log(`error ${md5} `);
  }
}

module.exports = { download };
