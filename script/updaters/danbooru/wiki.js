const fetch = require('node-fetch');
require("dotenv").config();

    var updaterToken = `Bearer ${process.argv[3]}`;

/* Danbooru wiki ID paramters */
    const entryStart = 2250;
    const entryMax = parseInt(process.argv[2]);

/* Updater IDs */
    const WinterProcessorID = 1006010;
    const WinterXIXID = 1282626;
    const WinterUpdaterID = 1423490;
    const WikiUpdaterID = 425860;

/* Going in reverse order to capture certain changes */
    var currentWikiID = entryMax;

    let processedWikiCount;
    let rejectedWikiCount;
    let updatedWikiCount;
    let failedWikiCount;

    const queryStartID = entryStart;
    const queryEndID = entryMax;

async function updateWiki() {

    /* End the script, all pages synced */
    if (currentWikiID === queryStartID) {
      
        const endTime = Date.now();

        clearInterval(updateInterval);
        clearInterval(tokenInterval);
        console.log(`${endTime - startTime / 1000} seconds - Synced Sankaku wiki pages (Processed ${processedWikiCount} pages).`);
            return console.log(`Rejected count: ${rejectedWikiCount} | Failed count: ${failedWikiCount} | Updated count: ${updatedWikiCount}`);
    }

    console.log(`Processing remote wiki page ID ${currentWikiID}, ${currentWikiID - queryStartID} of ${queryEndID - queryStartID}`);

    /* Fetch remote wiki page */
        const danbooruWikiPageURL = await fetch(`https://danbooru.donmai.us/wiki_pages/${currentWikiID}.json`);
        const wikiResponse = JSON.parse(await danbooruWikiPageURL.text());

    /* Process the remote wiki page */
    if (wikiResponse.success === false) {
        console.log(`Entry too high, or was permanently deleted. Skipping...`);
        currentWikiID = currentWikiID - 1;
        rejectedWikiCount = rejectedWikiCount + 1;
            return processedWikiCount = processedWikiCount + 1;
    }

    /* Define data, replace bad data */  
        const wikiID = wikiResponse.id;
        let wikiTitle = wikiResponse.title;
        const wikiBody = (wikiResponse.body)
            .replace(/([Pp]ost #(\d+))+/g, 'Post #xxxx')
            .replace(/([Ff]orum #(\d+))+/g, 'Forum #xxxx')
            .replace(/([Tt]opic #(\d+))+/g, 'Topic #xxxx')
            .replace(/([Pp]ool #(\d+))+/g, 'Pool #xxxx')
            .replace(/([Pp]ools #(\d+))+/g, 'Pool #xxxx')
            .replace(/([Cc]omment #(\d+))+/g, 'Comment #xxxx')
            .replace(/([Aa]rtist #(\d+))+/g, 'Artist #xxxx')
            .replace(/([Uu]ser #(\d+))+/g, 'User #xxxx')
            .replace(/([Nn]ote #(\d+))+/g, 'Note #xxxx')
            .replace(/([Ii]ssue #(\d+))+/g, 'Issue #xxxx')
            .replace(/([Dd]anbooru)+/g, 'Sankaku');

    /* Create or update local wiki page */            
    if (wikiResponse) {

        console.log(`Processing wiki page with remote ID: ${wikiID}, title: ${wikiTitle}`);

        if (wikiResponse.is_deleted === true) {
            console.log(`Page is deleted, skipping...`);
            currentWikiID = currentWikiID - 1;
            processedWikiCount = processedWikiCount + 1;
                return rejectedWikiCount = rejectedWikiCount + 1;
        } else if (wikiBody.length <= 1) {
            console.log(`Page is blank, skipping...`);
            currentWikiID = currentWikiID - 1;
            processedWikiCount = processedWikiCount + 1;
                return rejectedWikiCount = rejectedWikiCount + 1;
        } else if (wikiTitle.length > 0) {

        /* Check if remote tag is aliased */
            const aliasFind = await fetch(`https://capi-v2.sankakucomplex.com/tag-aliases?name=${encodeURIComponent(wikiTitle)}&approval_status=approved_only`);
            const potentialAliases = JSON.parse( await aliasFind.text() );
            
        if (potentialAliases.aliases.length > 0) {
            potentialAliases.aliases.forEach(alias => {
                if (alias.predicate_tag_name === wikiTitle) {
                    wikiTitle = potentialAliases.tags.find(tag => tag.id === alias.consequent_tag_id).name;
                }
            });
        }

        /* Find local page, for processing */
            const localPage = await fetch(`https://capi-v2.sankakucomplex.com/wiki/${encodeURIComponent(wikiTitle)}/history?limit=1`);
            const localPageResponse = JSON.parse(await localPage.text());

        if (localPageResponse.length > 0 && localPageResponse.user && localPageResponse.user.id !== WinterXIXID && localPageResponse.user.id !== WikiUpdaterID && localPageResponse.user.id !== WinterUpdaterID && localPageResponse.user.id !== WinterProcessorID) {
            console.log(`Local page already exists and is edited by another user: ${wikiTitle}, skipping...`);
            currentWikiID = currentWikiID - 1;
            processedWikiCount = processedWikiCount + 1;
                return rejectedWikiCount = rejectedWikiCount + 1;
        } else {

            console.log(`Attempting to create/ edit wiki page: ${wikiTitle}`);

            if (localPageResponse.length > 0) {

                if (localPageResponse[0].body === wikiBody) {
                    console.log(`Wiki page not updated - no changes.`);
                    currentWikiID = currentWikiID - 1;
                    processedWikiCount = processedWikiCount + 1;
                        return updatedWikiCount = updatedWikiCount + 1;
                } else if (localPageResponse[0].user.id === WinterXIXID && wikiBody !== localPageResponse[0].body || localPageResponse[0].user.id === WikiUpdaterID && wikiBody !== localPageResponse[0].body || localPageResponse[0].user.id === WinterUpdaterID && wikiBody !== localPageResponse[0].body || localPageResponse[0].user.id === WinterProcessorID && wikiBody !== localPageResponse[0].body) {
                    const body = { wiki_page: { body_en: wikiBody } }
                    fetch(`https://capi-v2.sankakucomplex.com/wiki/${encodeURIComponent(wikiTitle)}`, {
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

                    console.log(`Wiki page updated: ${localPageResponse[0].id}`);
                    currentWikiID = currentWikiID - 1;
                    processedWikiCount = processedWikiCount + 1;
                        return updatedWikiCount = updatedWikiCount + 1;

                } else if (wikiBody.length > 200 && localPageResponse[0].body < 50) {
                    const body = { wiki_page: { body_en: wikiBody } }
                    fetch(`https://capi-v2.sankakucomplex.com/wiki/${wikiTitle}`, {
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

                    console.log(`Wiki page updated: ${localPageResponse[0].id}`);
                    currentWikiID = currentWikiID - 1;
                    processedWikiCount = processedWikiCount + 1;
                        return updatedWikiCount = updatedWikiCount + 1;

                } else {
                    console.log(`An error has occurred: ${localPageResponse[0].title} (${localPageResponse[0].id})`);
                    currentWikiID = currentWikiID - 1;
                    failedWikiCount = failedWikiCount + 1;
                        return processedWikiCount = processedWikiCount + 1
                }
            } else {
                const body = { wiki_page: { title_en: wikiTitle, body_en: wikiBody } }
                fetch('https://capi-v2.sankakucomplex.com/wiki', {
                    method: 'POST',
                    body: JSON.stringify(body),
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': updaterToken
                    }
                })
                .then(res => res.json())
                .then(json => console.log(json));

                currentWikiID = currentWikiID - 1;
                processedWikiCount = processedWikiCount + 1;
                    return updatedWikiCount = updatedWikiCount + 1;
            }
        }
    }
}
}

async function authorizer() {

    const body = { login: process.env.WIKIUPDATER_USERNAME, password: process.env.WIKIUPDATER_PASSWORD };
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
    var updateInterval = setInterval(updateWiki, 12500);
    
    const startTime = Date.now();
    let processedWikiCount = 0;
    let rejectedWikiCount = 0;
    let updatedWikiCount = 0;
    let failedWikiCount = 0;
        
    console.log(`Danbooru wiki import script started with beginning ID ${queryEndID}.`);
    
}