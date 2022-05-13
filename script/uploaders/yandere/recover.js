const FileDownloader = require("../../components/fileDownloader.js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
var fs = require("fs");

var loggerSuccess = fs.createWriteStream("logs/yandere/success.txt", {
  flags: "a", // 'a' means appending (old data will be preserved)
});

var loggerError = fs.createWriteStream("logs/yandere/error.txt", {
  flags: "a", // 'a' means appending (old data will be preserved)
});

async function download({ md5, from }) {
  try {
    const yanderePostURL = await fetch(
      `https://yande.re/post.json?limit=1&tags=md5:${md5}`,
      {
        method: "GET",
      }
    );
    const postParse = JSON.parse(await yanderePostURL.text());
    const post = postParse[0];
    console.log("post", post);
    // Download the file. Will go to /home/scripting/Guardian/script/components/image-store/yandere/initial
    let file_url;

    if (!post.file_url) {
      console.log(
        `YANDERE #${md5} was deleted, cannot get a file URL for downloading, skipping!`
      );
      throw new Error();
    } else if (post.file_ext === "zip") {
      file_url = post.preview_url;
    } else file_url = post.file_url;

    const DownloadClient = new FileDownloader("yandere", file_url, md5);

    const tryFullDownload = await DownloadClient.downloadFullFile(
      post.file_url
    );
    const tryPreviewDownload = await DownloadClient.downloadPreviewFile(
      post.preview_url
    );

    if (tryFullDownload === false) {
      const retryFullDownload = await DownloadClient.retryFullDownload();

      if (retryFullDownload === false) {
        console.log(`Failed to download full YANDERE #${md5}.`);
        throw new Error();
      }
    }

    if (tryPreviewDownload === false) {
      const retryPreviewDownload = await DownloadClient.retryPreviewDownload();

      if (retryPreviewDownload === false) {
        console.log(`Failed to download preview YANDERE #${md5}.`);
        throw new Error();
      }
    }

    console.log(`Successfully downloaded YANDERE #${md5}.`);
    loggerSuccess.write(`Success: ${md5}, From: ${from} \n`);
  } catch (error) {
    loggerError.write(`Error: ${md5}, From: ${from} \n`);
    console.log(`error ${md5} `);
  }
}

module.exports = { download };
