const TagExceptions = require("./tags/exceptions.js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

class RatingLocker {
  constructor(
    local_id,
    tags,
    rating,
    source,
    status,
    general_tag_count,
    parent_id,
    auth_token
  ) {
    this.local_id = local_id;
    this.tags = tags;
    this.rating = rating;
    this.source = source;
    this.status = status;
    this.general_tag_count = general_tag_count;
    this.parent_id = parent_id;
    this.auth_token = auth_token;
  }

  async lockRating() {
    // Pre-requisite checks for rating locking
    if (
      this.general_tag_count > 9 &&
      this.rating === "s" &&
      this.status === "active"
    ) {
      const sensitiveTags =
        TagExceptions.tag_exceptions.blacklisted.rating.join("|");
      const sensitiveTagsRegEXP = new RegExp(sensitiveTags, "gm");
      const sensitiveTagsMatches = this.tags.match(sensitiveTagsRegEXP);

      // Check if the post has one of a set of sensitive tags, exclude if so
      if (sensitiveTagsMatches) {
        return console.log(
          `Sankaku#${this.local_id} is not suitable for a rating lock! [Reason: Contains sensitive tag]`
        );
      }

      // Check if the post's parent is not rated safe, exclude if so
      if (this.parent_id !== null) {
        const fetchParentPost = await fetch(
          `https://capi-v2.sankakucomplex.com/posts/${parseInt(
            this.parent_id
          )}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: this.auth_token,
            },
          }
        );

        const parentPost = JSON.parse(await fetchParentPost.text());

        if (parentPost.rating && parentPost.rating !== "s") {
          return console.log(
            `Sankaku#${this.local_id} is not suitable for a rating lock! [Reason: Parent post is not rated safe]`
          );
        }
      }

      // Both checks passed, rating lock the post!
      const body = {
        post: {
          parent_id: this.parent_id,
          rating: this.rating,
          source: this.source,
          tags: this.tags,
          is_rating_locked: true,
        },
      };
      fetch(`https://capi-v2.sankakucomplex.com/posts/${parseInt(post.id)}`, {
        method: "PUT",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: this.auth_token,
        },
      });

      return console.log(`Sankaku#${this.local_id} has been rating locked!`);
    } else {
      return console.log(
        `Sankaku#${this.local_id} is not suitable for a rating lock! [Reason: Doesn't meet other criteria]`
      );
    }
  }
}

module.exports = RatingLocker;
