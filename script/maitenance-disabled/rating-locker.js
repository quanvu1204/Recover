const TokenRefresh = require("../components/tokenRefresh.js");
const EmailError = require("../components/emailError.js");
const TagExceptions = require("../components/tags/exceptions.js");
const fetch = require("node-fetch");
const moment = require("moment");
require("dotenv").config()

    var currentID = parseInt(process.argv[2]);
    var endID = parseInt(process.argv[3]);
    var updaterToken = `Bearer ${process.argv[4]}`;
    
    const startTime = Date.now();
        
async function ratingLocker() {

    // Stop script if has exceeded the endID.
    if (currentID > endID) {
        clearInterval(lockInterval);
        clearInterval(tokenInterval);
    
        const endTime = Date.now();
            
        console.log(`Time: ${moment(startTime).format('MMMM Do YYYY, h:mm:ss a')} - ${moment(endTime).format('MMMM Do YYYY, h:mm:ss a')} (${moment(startTime).fromNow()})`);
        console.log(`Statistics: ${acceptedPosts} locked & ${rejectedPosts} not locked / ${processedPosts} posts`);
            return console.log(`Rating lock script has finished processing!`);
    }
    
    // Fetch 50 posts at a time, can go up to 100.
    const fetchLocalPosts = await fetch(`https://capi-v2.sankakucomplex.com/posts?tags=id_range:${currentID}&limit=3`, {
                                method: 'GET',
                                headers: {
                                    'Accept': 'application/json',
                                    'Authorization': updaterToken
                                }
                          });
    const localPosts = JSON.parse( await fetchLocalPosts.text() );
    
    // Return if no post here
    if (localPosts.length === 0) {
        console.log(`Sankaku#${currentID} does not exist. Skipping! (Statistics: ${acceptedPosts} locked & ${rejectedPosts} not locked / ${processedPosts} posts)`);
        processedPosts = processedPosts + 1;
        rejectedPosts = rejectedPosts + 1;
            return currentID = currentID + 1;
    }
    
    // Return if post is already rating locked
    if (localPosts[0].is_rating_locked === true) {
        console.log(`Sankaku#${currentID} is already rating locked. Skipping! (Statistics: ${acceptedPosts} locked & ${rejectedPosts} not locked / ${processedPosts} posts)`);
        processedPosts = processedPosts + 1;
        rejectedPosts = rejectedPosts + 1;
            return currentID = currentID + 1;
    }
    
    // Process the fetched posts
        localPosts.forEach(async (post) => {
        
            if (post.rating === "s" && post.status === "active" && post.tags.filter(tag => tag.type === 0).length > 9 && (moment(post.created_at.s).unix() <= moment().startOf('month').unix()) && post.is_rating_locked === false) {
            
                console.log(`Sankaku#${post.id} is suitable for a rating lock! Performing additional checks, before doing so.`);
                
                // Check if the post has a sensitive tag, if so reject rating locking it!
                const postTags = post.tags.map(tag => tag.name).join(" ");
                
                const sensitiveTags = TagExceptions.tag_exceptions.blacklisted.rating.join("|");
                const sensitiveTagsRegEXP = new RegExp(sensitiveTags, "gm");
                const sensitiveTagsMatches = postTags.match(sensitiveTagsRegEXP);
                
                if (sensitiveTagsMatches) {
                    console.log(`Sankaku#${post.id} has a sensitive tag! Excluding from rating locking. (Statistics: ${acceptedPosts} locked & ${rejectedPosts} not locked / ${processedPosts} posts)`);
                    rejectedPosts = rejectedPosts + 1;
                    processedPosts = processedPosts + 1;
                        return currentID = currentID + 1;
                }
                
                // Check if the post has a parent, and if the parent post's rating is "s".
                if (post.parent_id !== null) {
                    const fetchParentPost = await fetch(`https://capi-v2.sankakucomplex.com/posts/${parseInt(post.parent_id)}`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': updaterToken
                        }
                    });
                    const parentPost = JSON.parse( await fetchParentPost.text() );
                    
                    if (parentPost.rating && parentPost.rating !== "s") {
                        console.log(`Sankaku#${post.id}'s parent post is not rated safe! Excluding from rating locking. (Statistics: ${acceptedPosts} locked & ${rejectedPosts} not locked / ${processedPosts} posts)`);
                        rejectedPosts = rejectedPosts + 1;
                        processedPosts = processedPosts + 1;
                            return currentID = currentID + 1;
                    }
                }
                
                // Both checks passed, rating lock the post!
                const body = { post: { parent_id: post.parent_id, rating: post.rating, source: post.source, tags: postTags, is_rating_locked: true } };
                    fetch(`https://capi-v2.sankakucomplex.com/posts/${parseInt(post.id)}`, {
                        method: 'PUT',
                        body: JSON.stringify(body),
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': updaterToken
                        }
                    });
                    
                    console.log(`Sankaku#${post.id} has been rating locked! (Statistics: ${acceptedPosts} locked & ${rejectedPosts} not locked / ${processedPosts} posts)`);
                    acceptedPosts = acceptedPosts + 1;
                    processedPosts = processedPosts + 1;
                        return currentID = currentID + 1;
            } else {
                console.log(`Sankaku#${post.id} is not suitable for a rating lock, based on a broad range of criteria. (Statistics: ${acceptedPosts} locked & ${rejectedPosts} not locked / ${processedPosts} posts)`);
                rejectedPosts = rejectedPosts + 1;
                processedPosts = processedPosts + 1;
                    return currentID = currentID + 1;
            }
        });
}

async function authorizer() {

    const body = { login: process.env.TAGUPDATER_USERNAME, password: process.env.TAGUPDATER_PASSWORD };
        fetch(`https://capi-v2.sankakucomplex.com/auth/token`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        .then(res => res.json())
        .then(json => {updaterToken = `Bearer ${json.access_token}`});
        
    console.log("Successfully refreshed API token.");

}

// Start the script
if (process.argv[2] !== 123) {
    
    // Set script intervals
    var tokenInterval = setInterval(authorizer, 66500000);
    var lockInterval = setInterval(ratingLocker, 750);
    
    var rejectedPosts = 0;
    var acceptedPosts = 0;
    var processedPosts = 0;
        
    console.log(`Rating lock script started. Started at: ${moment(startTime).format('MMMM Do YYYY, h:mm:ss a')}`);
    
}