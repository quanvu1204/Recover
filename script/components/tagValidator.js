const hetalia = require("./tags/hetalia.js");

class TagValidator {
  constructor(service, tags) {
    this.service = service;
    this.tagString = tags;
  }

  async massValidateTags(service = "", tagString = "") {
    const booruReplace = /(translated|tagme|self_upload|banned_artist|check_translation|partial_translation|commentary|duplicate)+/gm;
    const commentaryReplace = /(\S+_commentary)+/gm;
    const requestReplace = /(\S+_request)+/gm;

    const tags = tagString
      .replace(commentaryReplace, "")
      .replace(requestReplace, "")
      .replace(booruReplace, "");

    return tags;
  }

  async gallerySourceTags(service = "", tagString = "") {
    const gallerySources = ["shuushuu", "zerochan", "yandere"];

    if (!gallerySources.includes(service)) return tagString;

    const galleryReplace = /( pixiv | deviantart | studio | hot | tumblr | nico_nico_douga | self_scanned | self_made | creepy | weird | adorably_cute | submissive | unidentified | twitpic | dlsite.com | drawr | livejournal | gaia_online )+/gm;

    const tags = tagString.replace(galleryReplace, " ");

    return tags;
  }

  async hetaliaValidateTags(service = "", tagString = "") {
    const gallerySources = ["shuushuu", "zerochan", "yandere"];

    if (!gallerySources.includes(service)) return tagString;

    const hetaliaTagsObject = hetalia.hetalia_tags;

    const remoteTags = Object.keys(hetaliaTagsObject).join(" | ");
    const remoteRegExp = new RegExp(remoteTags, "gm");
    const remoteMatches = tagString.match(remoteRegExp);

    const newTags = [];
    if (!remoteMatches) return tagString;

    remoteMatches.forEach(async (match) => {
      const replacedTag = match.replace(match, hetaliaTagsObject[match]);
      return newTags.push(replacedTag);
    });

    const tags = tagString.replace(remoteRegExp, "") + " " + newTags.join(" ");

    return tags;
  }

  async singleValidateTags(tagString = "", oldTag = "", newTag = "") {
    const validateRegExp = new RegExp(oldTag, "gm");

    const tags = tagString.replace(validateRegExp, newTag);

    return tags;
  }
}

module.exports = TagValidator;
