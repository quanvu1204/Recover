const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();

const validActions = ["add", "replace", "remove"];
const validRecurrency = ["hourly", "daily", "weekly", "monthly"];
const massEdit = process.argv;

// node file.js token action recurrency query_tags result_tags

if (!massEdit[6])
  return console.log(`You are missing a required parameter to the command.`);

if (!validActions.includes(massEdit[3]))
  return console.log(`Invalid action supplied. ${massEdit[3]}`);

if (!validRecurrency.includes(massEdit[4]))
  return console.log(`Invalid recurrency supplied.`);

const action = massEdit[3];
const recurrency = massEdit[4];
const queryTags = massEdit[5];
const resultTags = massEdit[6] || " ";

async function processor() {
  const queryURL = await fetch(
    `https://capi-v2.sankakucomplex.com/pools?tags=${queryTags.replace(
      " ",
      "+"
    )}+user:SankakuPlus&limit=5`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "client-type": "premium",
        Authorization: `Bearer ${massEdit[2]}`,
      },
    }
  );
  const posts = JSON.parse(await queryURL.text());

  if (posts.length < 3) {
    clearInterval(processInterval);
    return console.log(`Job has been processed. Will recur again if set.`);
  }

  posts.forEach(async (post) => {
    const source = post.source;
    const rating = "e";
    const parentId = post.parent_id;
    const nameEn = post.name_en;
    const genreTags = post.genre_tags;
    const artistTags = post.artist_tags;
    const isTrial = post.is_trial;

    let bookTags;
    let postTags;

    if (action === "add") {
      tags = post.tags.map(tag => tag.name).join(" ") + " " + resultTags;
    } else if (action === "remove") {
      tags = post.tags.map(tag => tag.name).join(" ").replace(queryTags, " ");
    } else if (action === "replace") {
      bookTags = post.tags.map(tag => tag.name).join(" ").replace(queryTags, resultTags);
      bookTags = post.post_tags.map(tag => tag.name).join(" ").replace(queryTags, resultTags);
    }
    

    const body = {
      pool: {
        parent_id: parentId,
        rating: rating,
        name_en: nameEn,
        genre_tags: genreTags,
        artist_tags: artistTags,
        tags: bookTags,
        post_tags: postTags,
        is_trial: isTrial,
      },
    };

    fetch(`https://capi-v2.sankakucomplex.com/pools/${post.id}`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${massEdit[2]}`,
      },
    });

    return console.log(
      `Successfully processed mass tag edit for post ${post.id}!`
    );
  });
}

async function authorizer() {
  const body = {
    login: process.env.WINTERXIX_USERNAME,
    password: process.env.WINTERXIX_PASSWORD,
  };
  fetch(`https://capi-v2.sankakucomplex.com/auth/token`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
    .then((res) => res.json())
    .then((json) => {
      uploaderToken = `Bearer ${json.access_token}`;
    });

  console.log("Successfully refreshed API token.");
}

// Start the script
if (massEdit[2] !== "stop") {
    switch (recurrency) {
        case "hourly": var recurrencyMillis = 60 * 60 * 1000; break;
        case "daily": var recurrencyMillis = 60 * 60 * 24 * 1000; break;
        case "weekly": var recurrencyMillis = 60 * 60 * 24 * 7 * 1000; break;
        case "monthly": var recurrencyMillis = 60 * 60 * 24 * 7 * 30 * 1000; break;
    }

  // Set script intervals
  var tokenInterval = setInterval(authorizer, 60000000);
  var processInterval = setInterval(processor, 5000);

  console.log(
    `MASS TAG EDIT job started. ${action.toUpperCase()} | ${recurrency.toUpperCase()} | (Query: ${queryTags} - Result: ${resultTags}).`
  );
}
