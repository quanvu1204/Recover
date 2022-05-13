const TagValidator = require("../components/tagValidator.js");
const XMLParser = require("../components/XMLParser.js");
const fetch = require("node-fetch");

    if (!process.argv[2] || !process.argv[3])
        return console.log(`You must provide both a starting ID and an ending ID for the initial run of this script.`);

    var startID = parseInt(process.argv[2]);
    var endID = parseInt(process.argv[3]);
    var currentID = startID;

async function tester() {

    console.log(`Fetching post Zerochan#${currentID}.`);
    
        if (currentID > endID) {
            //Zerochan has no nice API, stop once end ID has been surpassed
            console.log(`Zerochan test script has finished.`);
                return clearInterval(testInterval);
        }
    
    const ParseClient = new XMLParser();
        
    const zerochanPostURL = await fetch(`https://zerochan.net/${currentID}?xml`);
    const zerochanResponse = await zerochanPostURL.text();
    const postPtJ = ( await ParseClient.parseXML(zerochanResponse) );
    
        if (postPtJ === "error") {
            return currentID = currentID + 1;
        }
    
    const fixColonString = JSON.stringify(postPtJ);
    const noColon = fixColonString.replace(/(media:)+/gm, "");
    const newJSON = JSON.parse(noColon);
    
        if (!newJSON.rss.channel.item && newJSON.rss.channel._text.includes("Deleted")) {
            console.log(`Remote post Zerochan#${currentID} was deleted, skipping...`);
                return currentID = currentID + 1;
        }
    
    const post = newJSON.rss.channel.item;

// Replace poor remote tags
    const preformatTags = post.keywords._text
        .replace(/\s+/g, '_')
        .replace(/^_|_$/g, '')
        .replace(/,_/g, ' ');
        
    let tags;

    const TagClient = new TagValidator("zerochan", preformatTags + ' ' + 'japanese_clothes');
    
    tags = ( await TagClient.hetaliaValidateTags("zerochan", preformatTags + ' ' + 'japanese_clothes') );
    tags = ( await TagClient.gallerySourceTags("zerochan", tags) );
    tags = ( await TagClient.massValidateTags(tags) );

    console.log(tags);
        return currentID = currentID + 1;
    
}

// Start the script
if (process.argv[2] !== "stop") {
    
    //Set test interval.
    var testInterval = setInterval(tester, 5000);
        
    console.log(`Zerochan testing script started with beginning ID ${startID}.`);

}