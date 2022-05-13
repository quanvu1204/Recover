//const TokenRefresh = require("../components/tokenRefresh.js");
const EmailError = require("../components/emailError.js");
const StatisticTracking = require("../components/statisticUpdating.js");
const StatisticRetrieving = require("../components/models/statistics/retrieve.js");
const StorageSystem = require("../components/storageSystem.js");
const RatingLocker = require("../components/ratingLocker.js");
const PostFinder = require("../components/models/posts/find.js");
const { dbConnect } = require("../events/dbConnection.js");
const db = dbConnect();
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const FormData = require("form-data");
const fs = require("fs");
require("dotenv").config();

    if (!process.argv[2] || !process.argv[3])
        return console.log(`You must provide both a starting ID and an ending ID for the initial run of this script.`);

    var startID = parseInt(process.argv[2]);
    var endID = parseInt(process.argv[3]);
    var failID = 75;
    let currentID;
    var uploaderToken = `Bearer ${process.argv[4]}`;
        
async function uploader() {

    console.log(`Processing remote post GELBOORU#${currentID}.`);
    
    const PostClient = new PostFinder("gelbooru");
    const post = await PostClient.findById();
    const PreStatisticClient = new StatisticRetrieving("gelbooru", "fail");
    const failCount = await PreStatisticClient.collect();
    const StorageClient = new StorageSystem("gelbooru", currentID);

    if (currentID > 7000000) {
        console.log(`GELBOORU upload script has finished.`);
        clearInterval(tokenInterval);
        return clearInterval(uploadInterval);
    } else if (post === "none") {
        console.log(`No data for GELBOORU#${currentID} found in database.`);
        return currentID = currentID + 1;
    } else if (failCount.failed_count > failID) {
        // Initiate email error
        const ErrorClient = new EmailError(`GELBOORU upload script has failed ${failCount.failed_count} times. Investigate for further issues!`);
        const sendMail = ( await ErrorClient.sendEmail(process.env.EMAIL_TO_ADDRESS, process.env.EMAIL_FROM_ADDRESS, process.env.EMAIL_FROM_PASSWORD) );
        
        console.log(`GELBOORU upload script has failed ${failCount.failed_count} times, exiting for now...`);
            
        return clearInterval(uploadInterval);
    } else {
        let rating;
        
        currentID = post.remote_id;
        const parentID = post.parent_id;
        const source = post.source;
        const file = post.file_path;
        const md5 = post.md5;
        const tags = post.tags;

        if (tags.split(" ").length <= 7 && post.rating === "s") {
            rating = "q";
        } else rating = post.rating;

        const fetchLocalPost = await fetch(`https://capi-v2.sankakucomplex.com/posts?tags=md5:${md5}`, {
          headers: {
            "Authorization": uploaderToken
          }
        });
        const localPost = JSON.parse(await fetchLocalPost.text());
        
        if (localPost.success === false)
          return;

        if (localPost.length === 0) {
          return StorageClient.deletePost(currentID);
            // Post with identical MD5 does not exist yet, submit it with a POST request
            const formData = new FormData();
                formData.append("post[file]", file);
              if (parentID !== null) {
                formData.append("post[parent_id]", parentID);
              }
                formData.append("post[rating]", rating);
                formData.append("post[tags]", tags);
              if (source !== "" && source !== null) {
                formData.append("post[source]", source);
              }

            try {
                await fetch("https://capi-v2.sankakucomplex.com/posts", {
                    method: "POST",
                    body: formData,
                    headers: {
                        "Authorization": uploaderToken
                    }
                })
                .then(res => res.text())
                .then(async text => {
                    const response = await JSON.parse(text);
                    const StatisticClient = new StatisticTracking("gelbooru");

                    if (response.success !== true && (response.code && response.code !== "file_uploading_in_another_thread")) {
                        var increment = StatisticClient.incrementFailCount();

                        console.log(`Failed to upload GELBOORU#${currentID}. Error(s): ${text}`);
                        StorageClient.addRetry();
                        return currentID = currentID + 1;
                    } else {
                        var increment = StatisticClient.incrementUploadCount();

                        console.log(`Successfully uploaded GELBOORU#${currentID}.`);
                        fs.unlink(file, async function() {
                          console.log("Successfully purged post from the file system!");
                        });
                        StorageClient.deletePost(currentID);
                        return currentID = currentID + 1;
                    }
                });
            } catch (error) {
                console.log(error);
                StorageClient.addRetry();
                console.log(`GELBOORU#${currentID} will need to be retried, API error.`);
                return currentID = currentID + 1;
            }
        } else { 
            // Post with identical MD5 exists, submit with PUT request
            
            const lPost = localPost[0];
            currentId = post.remote_id;

            let newParent;
            let newTags = tags + " " + lPost.tags.map(tag => tag.name).join(" ");

            // Conditionally update local post values. We keep what we already have, unless something is null
            if (lPost.parent_id === null && parentID !== null && parentID !== lPost.id) {
                newParent = parentID;
            } else newParent = lPost.parent_id;

            const body = { post: { parent_id: newParent, rating: lPost.rating, source: lPost.source, tags: newTags, upload_url: post.upload_url } };
            fetch(`https://capi-v2.sankakucomplex.com/posts/${lPost.id}`, {
                method: "PUT",
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": uploaderToken
                }
            })
            .then(res => res.text())
            .then(async text => {
                const response = await JSON.parse(text);
                const StatisticClient = new StatisticTracking("gelbooru");

                if (response.success !== true) {
                    var increment = StatisticClient.incrementFailCount();

                    console.log(`Failed to update GELBOORU#${currentID}. Error(s): ${text}`);
                    return StorageClient.addRetry();
                } else {
                    var increment = StatisticClient.incrementUpdateCount();

                    console.log(`Successfully updated GELBOORU#${currentID}.`);
                    fs.unlink(file, async function() {
                      console.log("Successfully purged post from the file system!");
                    });
                    return StorageClient.deletePost(currentID);
                }
            });
        }
    }
}

async function authorizer() {

    const body = { login: process.env.AMORPHOUSBLOB_USERNAME, password: process.env.AMORPHOUSBLOB_PASSWORD };
        fetch(`https://capi-v2.sankakucomplex.com/auth/token`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        .then(res => res.json())
        .then(json => {uploaderToken = `Bearer ${json.access_token}`});
        
    console.log("Successfully refreshed API token.");

}

// Start the script
if (process.argv[2] !== "stop") {
    
    //Set script intervals
    var tokenInterval = setInterval(authorizer, 66500000);
    var uploadInterval = setInterval(uploader, 15000);
        
    console.log(`GELBOORU upload script started with beginning ID ${startID}.`);
    
}