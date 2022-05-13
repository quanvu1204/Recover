const fetch = require('node-fetch');
require("dotenv").config();

    var updaterToken = `Bearer ${process.argv[5]}`;

/* Define some limits */
    const danbooruMaxPerPage = 50;
    const startID = parseInt(process.argv[2]);
    const endID = parseInt(process.argv[3]);
    const scriptEndID = parseInt(process.argv[4]);
    var startQueryID = startID;
    var endQueryID = endID;

async function updateParents() {

    /* End the script, all parent posts synced */
    if (startQueryID > scriptEndID) {
      
        const endTime = Date.now();

        clearInterval(updateInterval);
        clearInterval(tokenInterval);

        console.log(`${endTime - startTime / 1000} seconds - Synced Sankaku parent posts (Processed ${processedPostCount} posts).`);
            return console.log(`Rejected count: ${parentRejectedPostCount} | Missing count: ${missingPostCount} | Updated count: ${parentUpdatedPostCount}`);
    }

    /* Increment */
        startQueryID = startQueryID + danbooruMaxPerPage;
        endQueryID = endQueryID + danbooruMaxPerPage;

    console.log(`Fetching posts ${startQueryID} to ${endQueryID}, processing ${danbooruMaxPerPage} posts per page.`);

    /* Fetch the posts from Danbooru */
        const danbooruQueryString = `id:${startQueryID}..${endQueryID}+-status:deleted`;
        const danbooruPostAPIURL = await fetch(`https://danbooru.donmai.us/posts.json?tags=${encodeURIComponent(danbooruQueryString)}&page=1&limit=${danbooruMaxPerPage}&login=${process.env.GOLD_DANBOORU_USERNAME}&api_key=${process.env.GOLD_DANBOORU_KEY}`);
        const danbooruPostAPIURLResponse = JSON.parse(await danbooruPostAPIURL.text());

    /* Loop through each result, and process each request */
    await danbooruPostAPIURLResponse.forEach(async post => {

        console.log(`Processing remote post with ID: ${post.id}, MD5: ${post.md5}`);

        /* Find if the post exists locally */
            const sankakuQueryString = `md5:${post.md5}+-status:deleted`;
            const sankakuPostAPIURL = await fetch(`https://capi-v2.sankakucomplex.com/posts?tags=${sankakuQueryString}&limit=1`);
            const sankakuPostAPIURLResponse = JSON.parse(await sankakuPostAPIURL.text());

            if (sankakuPostAPIURLResponse.length <= 0) {
                console.log(`No local post found with remote ID ${post.id}, skipping...`);
                processedPostCount = processedPostCount + 1;
                    return missingPostCount = missingPostCount + 1;
            } else {
                const localPostID = sankakuPostAPIURLResponse[0].id;

                if (post.parent_id === null) {
                    console.log(`Remote post with ID ${post.id} does not have a parent, skipping...`);
                    processedPostCount = processedPostCount + 1;
                        return parentRejectedPostCount = parentRejectedPostCount + 1;
                } else if (post.parent_id !== null && localPostID.parent_id === null) {
                    console.log(`Local post (${localPostID}) is missing parent, remote post (${post.id}) has parent.`);

                /* Find the parent on Danbooru, and see if it exists locally */
                    const danbooruQueryStringParent = `id:${post.parent_id}+-status:deleted`;
                    const danbooruParentAPIURL = await fetch(`https://danbooru.donmai.us/posts.json?tags=${danbooruQueryStringParent}&page=1&limit=1&login=${process.env.GOLD_DANBOORU_ISERNAME}&api_key=${process.env.GOLD_DANBOORU_KEY}`);
                    const danbooruParentAPIURLResponse = JSON.parse(await danbooruParentAPIURL.text());
                    const remoteParentMD5 = danbooruParentAPIURLResponse[0].md5;

                    const sankakuQueryStringParent = `md5:${remoteParentMD5}+-status:deleted`;
                    const sankakuParentAPIURL = await fetch(`https://capi-v2.sankakucomplex.com/posts?tags=${sankakuQueryStringParent}&limit=1`);
                    const sankakuParentAPIURLResponse = JSON.parse(await sankakuParentAPIURL.text());
                        
                    if (sankakuPostAPIURLResponse[0].parent_id === null) {
                        if (sankakuParentAPIURLResponse.length === 1) {
                            if (sankakuParentAPIURLResponse[0].id === sankakuPostAPIURLResponse[0].id) {
                                console.log(`Circular parent-child relationship detected, abandoning...`);
                                processedPostCount = processedPostCount + 1;
                                    return parentRejectedPostCount = parentRejectedPostCount + 1;
                            } else if (sankakuParentAPIURLResponse[0].parent_id !== null && sankakuParentAPIURLResponse[0].parent_id === sankakuPostAPIURLResponse[0].id) {
                                console.log(`Circular parent-child relationship detected, abandoning...`);
                                processedPostCount = processedPostCount + 1;
                                    return parentRejectedPostCount = parentRejectedPostCount + 1;
                            } else {
                                console.log(`Processing addition of parent to local post: ${localPostID} (Parent ID: ${sankakuParentAPIURLResponse[0].id})`);

                                    const body = { post: { parent_id: sankakuParentAPIURLResponse[0].id, rating: sankakuPostAPIURLResponse[0].rating, source: sankakuPostAPIURLResponse[0].source, tags: sankakuPostAPIURLResponse[0].tags.map(tag => tag.name).join(' ') } }
                                    fetch(`https://capi-v2.sankakucomplex.com/posts/${localPostID}`, {
                                        method: 'PUT',
                                        body: JSON.stringify(body),
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Accept': 'application/json',
                                            'Authorization': updaterToken
                                        }
                                    })
                                    .then(res => res.json())
                                    .then(json => console.log(json));

                                    console.log(`Processed addition of parent to local post: ${localPostID} (Parent ID: ${sankakuParentAPIURLResponse[0].id})`);
                                    updatedPostCount = updatedPostCount + 1;
                                    processedPostCount = processedPostCount + 1;
                                        return parentUpdatedPostCount = parentUpdatedPostCount + 1;
                                }
                            } else {
                                console.log(`Remote parent post ${danbooruParentAPIURLResponse[0].id} does not exist locally.`);
                                processedPostCount = processedPostCount + 1;
                                parentRejectedPostCount = parentRejectedPostCount + 1;
                                    return missingPostCount = missingPostCount + 1;
                            }
                        } else if (sankakuParentAPIURLResponse[0].parent_id === sankakuPostAPIURLResponse[0].id) {
                            console.log(`Existing circular parent-child relationship detected, attempting to detangle.`);

                            const body = { post: { parent_id: null, rating: sankakuParentAPIURLResponse[0].rating, source: sankakuParentAPIURLResponse[0].source, tags: sankakuParentAPIURLResponse[0].tags.map(tag => tag.name).join(' ') } }
                            fetch(`https://capi-v2.sankakucomplex.com/posts/${sankakuParentAPIURLResponse[0].id}`, {
                                method: 'PUT',
                                body: JSON.stringify(body),
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'Authorization': updaterToken
                                }
                            })
                            .then(res => res.json())
                            .then(json => console.log(json));

                            console.log(`Circular parent-child relationship has been amended.`);
                            processedPostCount = processedPostCount + 1;
                            updatedPostCount = updatedPostCount + 1;
                                return parentUpdatedPostCount = parentUpdatedPostCount + 1;
                        }
                    } else {
                        console.log(`Local post ${localPostID} already has a parent post, skipping...`);
                        processedPostCount = processedPostCount + 1;
                            return parentRejectedPostCount = parentRejectedPostCount + 1;
                    }
                }
            });
        }

async function authorizer() {

    const body = { login: process.env.PARENTUPDATER_USERNAME, password: process.env.PARENTUPDATER_PASSWORD };
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
if (process.argv[2] !== "stop") {
    
    //Set script intervals
    var tokenInterval = setInterval(authorizer, 66500000);
    var updateInterval = setInterval(updateParents, 20000);
    
    const startTime = Date.now();
    var processedPostCount = 0;
    var updatedPostCount = 0;
    var missingPostCount = 0;
    var parentUpdatedPostCount = 0;
    var parentRejectedPostCount = 0;
        
    console.log(`Danbooru parent import script started with beginning ID ${startID}.`);
    
}