const pixiv = require("./tags/pixiv.js");

class PixivArtists {
  constructor(service, tags) {
    this.service = service;
    this.tagString = tags;
  }

  async validateArtist(tagString = "") {
    const hetaliaTagsObject = pixiv.pixiv_artist_formats;

    const remoteTags = Object.keys(hetaliaTagsObject).join(" | ");
    const remoteRegExp = new RegExp(remoteTags, "gm");
    const remoteMatches = tagString.match(remoteRegExp);

    const newTags = [];
    if (!remoteMatches) return tagString;

    remoteMatches.forEach(async (match) => {
      const replacedTag = match.replace(match, hetaliaTagsObject[match]);
      const completedTag = replacedTag.replace("{match}", match);
      return newTags.push(completedTag);
    });

    const tags = tagString.replace(remoteRegExp, "") + " " + newTags.join(" ");

    return tags;
  }
}

module.exports = PixivArtists;
