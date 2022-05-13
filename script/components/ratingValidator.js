const TagExceptions = require("./tags/exceptions.js");

class RatingValidator {
  constructor(tags, rating) {
    this.tags = tags;
    this.rating = rating;
  }

  async validateRating() {
    const explicitTags =
      TagExceptions.tag_exceptions.conditional.postRating.join("|");
    const explicitTagsRegEXP = new RegExp(explicitTags, "gm");
    const explicitTagsMatches = this.tags.match(explicitTagsRegEXP);

    let rating;

    if (explicitTagsMatches) {
      rating = "e";
    } else rating = this.rating;

    return rating;
  }
}

module.exports = RatingValidator;
