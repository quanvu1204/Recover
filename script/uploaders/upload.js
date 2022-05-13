const Promise = require("bluebird");
const danbooru = require("./danbooru/recover");
const rule34 = require("./rule34/recover");
const gelbooru = require("./gelbooru/recover");
const yandere = require("./yandere/recover");

var fs = require("fs");
var obj = JSON.parse(fs.readFileSync("wrong-posts-bot.txt", "utf8"));

const bots = {
  322790: "gelbooru",
  2: "rule34",
  48364: "zerochan",
  49276: "danbooru",
  90288: "yande.re",
};

const uploadMissingFile = async () => {
  console.log("Start Upload File");
  const array = obj.slice(1291, 5000);

  await Promise.map(
    array,
    async (element) => {
      let from = "";

      switch (element.userId) {
        case 49276: // danbooru
          from = "danbooru";
          break;
        case 48364: // zerochan
          from = "zerochan";
          break;
        case 2: // rule34
          from = "rule34";
          break;
        case 322790: // gelbooru
          from = "gelbooru";
          break;
        case 90288: // yande.re
          from = "yande.re";
          break;
        default:
          break;
      }

      if (process.env.name === "danbooru") {
        await danbooru.download({ md5: element.md5, from });
      }

      if (process.env.name === "rule34") {
        await rule34.download({ md5: element.md5, from });
      }

      if (process.env.name === "gelbooru") {
        await gelbooru.download({ md5: element.md5, from });
      }

      if (process.env.name === "yandere") {
        await yandere.download({ md5: element.md5, from });
      }
    },
    { concurrency: 10 }
  );

  console.log("Start Upload Success");
};

uploadMissingFile();
