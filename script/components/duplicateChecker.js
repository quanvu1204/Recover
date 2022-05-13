const FormData = require("form-data");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const XMLParser = require("./XMLParser.js");
const fs = require("fs");

class DuplicateChecker {
  constructor(image, service, remoteid) {
    this.image = image;
    this.service = service;
    this.remoteid = remoteid;
  }

  async parseDuplicates(
    thumbnail = "",
    height = "",
    width = "",
    fileType = "",
    fileSize = ""
  ) {
    let isDuplicate;
    let parentID;

    const formData = new FormData();
    formData.append("file", fs.createReadStream(thumbnail));
    formData.append("threshold", 80);

    await fetch(`https://iqdb.sankakucomplex.com/dupe-check.php`, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.text())
      .then(async (text) => {
        const XMLClient = new XMLParser();

        try {
          const verdicts = [];
          const parents = [];

          const json = await XMLClient.parseXML(text);

          if (json.matches.match && json.matches.match[1]) {
            const testDuplicates = json.matches.match.forEach((pd) => {
              const localPost = pd.post._attributes;

              // Not similar enough
              if (localPost.sim <= 85) {
                verdicts.push("false");
              }
              // 95% or greater check?
              else if (localPost.sim >= 95) {
                if (localPost.height === height && localPost.width === width) {
                  if (localPost.file_size - fileSize >= 131072) {
                    verdicts.push("true");
                    parents.push(localPost.id);
                  }
                }
              }
              // 94% or greater check?
              else if (localPost.sim >= 94) {
                // Significantly lower resolution check
                if (
                  localPost.height - height >= 200 &&
                  localPost.width - width >= 200
                ) {
                  // And lower filesize
                  if (localPost.file_size - fileSize >= 131072) {
                    verdicts.push("true");
                    parents.push(localPost.id);
                  }
                }
                // Higher compression JPG
                if (localPost.file_ext === "jpg" && fileType === "jpg") {
                  // And lower filesize
                  if (localPost.file_size - fileSize >= 16384) {
                    verdicts.push("true");
                    parents.push(localPost.id);
                  }
                }
              }
              // Compare and process based on filesizes
              else if (
                localPost.height === height &&
                localPost.width === width
              ) {
                // JPG conversion of PNG
                if (localPost.file_ext === "png" && fileType === "jpg") {
                  verdicts.push("true");
                  parents.push(localPost.id);
                }
                // Only filesize differs
                else if (
                  localPost.file_size === fileSize ||
                  localPost.file_size - fileSize <= 16384
                ) {
                  verdicts.push("true");
                  parents.push(localPost.id);
                }
              }
              // Not a duplicate
              else {
                verdicts.push("false");
                parents.push(0);
              }
            });
          }

          if (verdicts.includes("true")) {
            parentID = parents[0];
          } else parentID = 0;
        } catch (err) {
          return console.log(err);
        }
      });
    return parentID;
  }
}

module.exports = DuplicateChecker;
