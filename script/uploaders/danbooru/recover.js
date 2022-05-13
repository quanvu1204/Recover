const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
var fs = require("fs");

var loggerSuccess = fs.createWriteStream("logs/danbooru/success.txt", {
  flags: "a", // 'a' means appending (old data will be preserved)
});

var loggerError = fs.createWriteStream("logs/danbooru/error.txt", {
  flags: "a", // 'a' means appending (old data will be preserved)
});

async function download({ md5, from }) {
  try {
    const danbooruPostMD5URL = await fetch(
      `https://danbooru.donmai.us/posts?md5=${md5}&login=soplex&api_key=r_mQcSR-N5xcDtC1x3VL0dcMyij3wQMprb-1PeQ7-wY`,
      {
        method: "GET",
      }
    );

    console.log("danbooruPostMD5URL", danbooruPostMD5URL);

    let url = new URL(danbooruPostMD5URL.url);
    const currentID = /posts\/(\d+)*/.exec(url.pathname)[1];

    const danbooruPostURL = await fetch(
      `https://danbooru.donmai.us/posts/${currentID}.json?login=soplex&api_key=r_mQcSR-N5xcDtC1x3VL0dcMyij3wQMprb-1PeQ7-wY`,
      {
        method: "GET",
      }
    );

    const post = JSON.parse(await danbooruPostURL.text());

    // Download the file. Will go to /home/scripting/Guardian/script/components/image-store/danbooru/initial
    let file_url;

    if (!post.file_url) {
      console.log(
        `DANBOORU #${currentID} is blocked content, cannot get a file URL for downloading, skipping!`
      );
    } else if (post.file_ext === "zip") {
      file_url = post.large_file_url;
    } else file_url = post.file_url;

    const DownloadClient = new FileDownloader("danbooru", file_url, currentID);

    const tryFullDownload = await DownloadClient.downloadFullFile(
      post.file_url
    );
    const tryPreviewDownload = await DownloadClient.downloadPreviewFile(
      post.preview_file_url
    );

    if (tryFullDownload === false) {
      const retryFullDownload = await DownloadClient.retryFullDownload();

      if (retryFullDownload === false) {
        console.log(`Failed to download full DANBOORU #${currentID}.`);
      }
    }

    if (tryPreviewDownload === false) {
      const retryPreviewDownload = await DownloadClient.retryPreviewDownload();

      if (retryPreviewDownload === false) {
        console.log(`Failed to download preview DANBOORU #${currentID}.`);
      }
    }

    loggerSuccess.write(`Success: ${md5}, From: ${from} \n`);
  } catch (error) {
    // write to file
    loggerError.write(`Error: ${md5}, From: ${from} \n`);
    console.log(`error ${md5} `);
  }
}

module.exports = { download };
