class DecipherFileType {
  constructor(url) {
    this.url = url;
  }

  async decipherType() {
    try {
      var URL = this.url;

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
        case ".mp4":
          var fileFormat = "mp4";
          break;
        case ".webm":
          var fileFormat = "webm";
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
      return fileFormat;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
}

module.exports = DecipherFileType;
