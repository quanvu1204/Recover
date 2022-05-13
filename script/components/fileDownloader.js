const download = require("download");
const fs = require("fs");

class FileDownloader {
  constructor(service, url, remoteid) {
    this.service = service;
    this.url = url;
    this.remoteid = remoteid;
  }

  async downloadPreviewFile(url = "") {
    let success;
    try {
      var URL = url;
      var path = `script/image-store/${this.service}/preview/${this.remoteid.slice(0, 2)}/${this.remoteid.slice(2, 4)}`;

      var fileFormatRegex = /(\.gif|\.png|\.zip|\.jpg|\.jpeg|\.swf|\.ogv)+/gm;
      var fileFormatMatching = URL.match(fileFormatRegex);

      switch (fileFormatMatching[0]) {
        case ".png":
          var fileFormat = "png";
          break;
        case ".jpg":
          var fileFormat = "jpg";
          break;
        case ".jpeg":
          var fileFormat = "jpeg";
          break;
        case ".swf":
          var fileFormat = "swf";
          break;
        case ".ogv":
          var fileFormat = "ogv";
          break;
        case ".gif":
          var fileFormat = "gif";
          break;
      }

      var fileName = `${this.remoteid}.${fileFormat}`;

      await download(URL, path, { filename: fileName });
      success = true;
      return success;
    } catch (error) {
      console.log(error);
      success = false;
      return success;
    }
  }

  async retryPreviewDownload(url = "") {
    let success;

    try {
      var URL = url;
      var path = `script/image-store/${this.service}/retry/preview/${this.remoteid.slice(0, 2)}/${this.remoteid.slice(2, 4)}`;

      var fileFormatRegex = /(\.gif|\.png|\.zip|\.jpg|\.jpeg|\.swf|\.ogv)+/gm;
      var fileFormatMatching = URL.match(fileFormatRegex);

      switch (fileFormatMatching[0]) {
        case ".png":
          var fileFormat = "png";
          break;
        case ".jpg":
          var fileFormat = "jpg";
          break;
        case ".jpeg":
          var fileFormat = "jpeg";
          break;
        case ".swf":
          var fileFormat = "swf";
          break;
        case ".ogv":
          var fileFormat = "ogv";
          break;
        case ".gif":
          var fileFormat = "gif";
          break;
      }

      var fileName = `${this.remoteid}.${fileFormat}`;

      await download(URL, path, { filename: fileName });
      success = true;
      return success;
    } catch (error) {
      console.log(error);
      success = false;
      return success;
    }
  }

  async downloadFullFile(url = "") {
    let success;

    try {
      var URL = url;
      var path = `script/image-store/${
        this.service
      }/${this.remoteid.slice(0, 2)}/${this.remoteid.slice(2, 4)}`;

      var fileFormatRegex =
        /(\.gif|\.png|\.zip|\.jpg|\.jpeg|\.apng|\.webm|\.mp4|\.swf|\.ogv)+/gm;
      var fileFormatMatching = URL.match(fileFormatRegex);

      switch (fileFormatMatching[0]) {
        case ".png":
          var fileFormat = "png";
          break;
        case ".jpg":
          var fileFormat = "jpg";
          break;
        case ".jpeg":
          var fileFormat = "jpeg";
          break;
        case ".zip":
          var fileFormat = "zip";
          break;
        case ".apng":
          var fileFormat = "apng";
          break;
        case ".webm":
          var fileFormat = "webm";
          break;
        case ".mp4":
          var fileFormat = "mp4";
          break;
        case ".swf":
          var fileFormat = "swf";
          break;
        case ".ogv":
          var fileFormat = "ogv";
          break;
        case ".gif":
          var fileFormat = "gif";
          break;
      }

      var fileName = `${this.remoteid}.${fileFormat}`;

      await download(URL, path, { filename: fileName });

      var fileSize = fs.statSync(`${path}/${fileName}`).size;

      if (fileSize < 150) {
        success = false;
      } else success = true;

      return success;
    } catch (error) {
      console.log(error);
      success = false;
      return success;
    }
  }

  // Function for bad Zerochan API full res files
  async pngDownload(url = "") {
    let success;

    try {
      var URL = url.replace(".jpg", ".png");
      var path = `script/image-store/${this.service}/${this.remoteid.slice(0, 2)}/${this.remoteid.slice(2, 4)}`;

      var fileName = `${this.remoteid}.png`;

      await download(URL, path, { filename: fileName });

      var fileSize = fs.statSync(`${path}/${fileName}`).size;

      if (fileSize < 150) {
        success = false;
      } else success = true;

      return success;
    } catch (error) {
      console.log(error, "png");
      success = false;
      return success;
    }
  }

  async gifDownload(url = "") {
    let success;

    try {
      var URL = url.replace(".jpg", ".gif");
      var path = `script/image-store/${this.service}/${this.remoteid.slice(0, 2)}/${this.remoteid.slice(2, 4)}`;

      var fileName = `${this.remoteid}.gif`;

      await download(URL, path, { filename: fileName });
      success = true;
      return success;
    } catch (error) {
      console.log(error);
      success = false;
      return success;
    }
  }

  async retryFullDownload(url = "") {
    let success;

    try {
      var URL = url;
      var path = `script/image-store/${this.service}/retry/${this.remoteid.slice(0, 2)}/${this.remoteid.slice(2, 4)}`;

      var fileFormatRegex =
        /(\.gif|\.png|\.zip|\.jpg|\.jpeg|\.apng|\.webm|\.mp4|\.swf|\.ogv)+/gm;
      var fileFormatMatching = URL.match(fileFormatRegex);

      switch (fileFormatMatching[0]) {
        case ".png":
          var fileFormat = "png";
          break;
        case ".jpg":
          var fileFormat = "jpg";
          break;
        case ".jpeg":
          var fileFormat = "jpeg";
          break;
        case ".zip":
          var fileFormat = "zip";
          break;
        case ".apng":
          var fileFormat = "apng";
          break;
        case ".webm":
          var fileFormat = "webm";
          break;
        case ".mp4":
          var fileFormat = "mp4";
          break;
        case ".swf":
          var fileFormat = "swf";
          break;
        case ".ogv":
          var fileFormat = "ogv";
          break;
        case ".gif":
          var fileFormat = "gif";
          break;
      }

      var fileName = `${this.remoteid}.${fileFormat}`;

      await download(URL, path, { filename: fileName });
      success = true;
      return success;
    } catch (error) {
      console.log(error);
      success = false;
      return success;
    }
  }
}

module.exports = FileDownloader;
