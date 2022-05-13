const FileDownloader = require("../../components/fileDownloader.js");
const StorageSystem = require("../../components/storageSystem.js");
const TagValidator = require("../../components/tagValidator.js");
const TagExceptions = require("../../components/tags/exceptions.js");
const BookZipper = require("../../components/bookZipper.js");
const BookFinder = require("../../components/models/books/find.js");
const DecipherFileType = require("../../components/decipherFileType.js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const util = require('util');
const streamPipeline = util.promisify(require('stream').pipeline);
const delay = ms => new Promise(res => setTimeout(res, ms));

if (!process.argv[2] || !process.argv[3])
  return console.log(
    `You must provide both a starting ID and an ending ID for the initial run of this script.`
  );

var startID = parseInt(process.argv[2]);
var endID = parseInt(process.argv[3]);

  let currentId;
  let currentToken;
  var currentIndexPlacement = 0;
  let currentURL;

  var indexPage = 0;
  var bookImagePage = 0;
  var bookPage = 0;
  
  let downloadInterval = setInterval(metadataDownloader, 5000);
  let downloadPagesInterval;

async function bookPageDownloader(compressSpeed) {
  if (currentURL === "scraped")
    return;

  if (bookPage === 40) {
    bookImagePage = bookImagePage + 1;
    bookPage = 0;
  }
  
  const bookURL = await fetch(
    `${currentURL}?p=${bookImagePage}`,
    {
        "method": "GET",
        "headers": {
          Cookie: 'ipb_member_id=6445782; ipb_pass_hash=ebac74ec407a7d374dd2e5e6417922a8; sk=rn1ddo1e01h53km1tfmloj8eibpy; nw=1;'
        }
    }
  );
  
  const bookResponse = await bookURL.text();
  
  const pageMatchesRegExp = new RegExp(/("https\:\/\/e-hentai.org\/s\/[a-z0-9]*\/[0-9]*-[0-9]*")/, "gm");
  const pageMatches = bookResponse.match(pageMatchesRegExp);
    
  if (!pageMatches[bookPage]) {
    currentURL = "scraped";
    bookImagePage = 0;
    bookPage = 0;
    
    console.log("A");
    
    const ZipClient = new BookZipper();
    return await ZipClient.zipBook(currentId);
  }

  const pageURL = await fetch(
    pageMatches[bookPage].replace(/(")/g, ""),
    {
        "method": "GET"
    }
  );
  
  const pageResponse = await pageURL.text();
  
  let imageMatchesRegExp = new RegExp(/(https:\/\/e-hentai\.org\/fullimg\.php\?gid=[0-9]*&page=[0-9]*&key=[a-z0-9]*)/, "");
  let fixHTML = pageResponse.replace(/amp;/gm, "");
  let imageMatches = fixHTML.match(imageMatchesRegExp);
  
  if (!imageMatches) {
    imageMatchesRegExp = new RegExp(/(<img id="img" src="(.*?)")/, "");
    fixHTML = pageResponse.replace("<br>", "\n\n\n");
    imageMatches = fixHTML.match(imageMatchesRegExp);
  }
  
  if (imageMatches && imageMatches[0]) {
    const fullFileURL = imageMatches[0].replace(/( |")/g, "").replace("<imgid=imgsrc=", "");
    
    let pageNumber;
      
    if (bookPage < 10) {
      pageNumber = `0000${bookPage}`;
    } else if (bookPage > 9 && bookPage < 100) {
      pageNumber = `000${bookPage}`;
    } else if (bookPage > 99 && bookPage < 1000) {
      pageNumber = `00${bookPage}`;
    } else if (bookPage > 999 && bookPage < 10000) {
      pageNumber = `0${bookPage}`;
    } else pageNumber = bookPage;
    
    const downloadImageURL = await fetch(fullFileURL,
      {
        method: "GET",
        headers: {
          Cookie: 'ipb_member_id=6445782; ipb_pass_hash=ebac74ec407a7d374dd2e5e6417922a8; sk=rn1ddo1e01h53km1tfmloj8eibpy;'
        }
      }).then(async (res) => {
        const fileTypeHeader = res.headers.get("content-type");
          
        const DecipherClient = new DecipherFileType();
        const fileType = ( await DecipherClient.decipherTypeFromMime(fileTypeHeader) );
          
        await streamPipeline(res.body, fs.createWriteStream(`/home/scripting/Guardian/script/image-store/ehentai/before_compression/${currentId}/ehentai-book_id-${currentId}-page-${pageNumber}.${fileType}`));
      }
   	)
    console.log(`Successfully downloaded E-HENTAI#${currentId}:${pageNumber}.`);
    
    bookPage = bookPage + 1;
  } else {
    bookPage = bookPage + 1;
  }
}

async function metadataDownloader() {

  console.log(`Fetching book E-HENTAI#${currentId || "First interation"}.`);
  
  if (currentIndexPlacement > 24) {
    currentIndexPlacement = 0;
    indexPage = indexPage + 1;
  }

  const indexURL = await fetch(
    `https://e-hentai.org/?page=${indexPage}`,
    {
        "method": "GET"
    }
  );
  const indexResponse = await indexURL.text();
  
  const bookMatchesRegExp = new RegExp(/(https\:\/\/e-hentai.org\/g\/[0-9]*\/[a-z0-9]*\/)/, "gm");
  const bookMatches = indexResponse.match(bookMatchesRegExp);
  
  currentURL = bookMatches[currentIndexPlacement];
  
  const tokenIdRegExp = new RegExp(/(\/[0-9].*\/)/, "gm");
  const tokenIdMatches = currentURL.match(tokenIdRegExp);
  const tokenId = tokenIdMatches[0].split("/");
  currentId = tokenId[1];
  currentToken = tokenId[2];

// Metadata handling
  
  const BookClient = new BookFinder("ehentai", currentId || 1);
  const book = await BookClient.findById();
  
  if (book !== "none") {
    currentURL = "scraped";
    console.log(`E-HENTAI#${currentId} is already stored, skipping...`);
    fs.rmSync(`/home/scripting/Guardian/script/image-store/ehentai/before_compression/${currentId}`, { recursive: true, force: true });
    clearInterval(downloadInterval);
    downloadInterval = setInterval(metadataDownloader, 5000);
    return (currentIndexPlacement = currentIndexPlacement + 1);
  }

  const indexJSON = {
        "method": "gdata",
        "gidlist": [
          [currentId, currentToken]
        ],
        "namespace": 1
    }

  const metadataURL = await fetch(
    `https://api.e-hentai.org/api.php`,
    {
        "method": "POST",
        "body": JSON.stringify(indexJSON)
    }
  );
  
  const metadataResponse = JSON.parse((await metadataURL.text()));
  const bookData = metadataResponse.gmetadata[0];
  
  const tagsArray = [];
  tagsArray.push(bookData.category.replace(/ /g, "_").toLowerCase());
  bookData.tags.forEach(tag => {
    tagsArray.push(tag.replace(/(\D*:)/g, "").replace(/ /g, "_"));
  });
  
  let tags = tagsArray.join(" ");
  
  // Abort early on if something bad is detected
  const rejectionTags = TagExceptions.tag_exceptions.blacklisted.ehentai.join("|");
  const rejectionTagsRegEXP = new RegExp(rejectionTags, "gm");
  const rejectionTagsMatches = tags.match(rejectionTagsRegEXP);
    
  if (rejectionTagsMatches) {
    console.log(`Remote book E-HENTAI#${currentId} has a blacklisted tag, skipping!`);
    return currentIndexPlacement = currentIndexPlacement + 1;
  } else if (bookData.expunged) {
    console.log(`Remote book E-HENTAI#${currentId} is expunged, skipping!`);
    return currentIndexPlacement = currentIndexPlacement + 1;
  }
  
// Store book
  const sizeInMb = Math.floor(bookData.filesize / 1000 / 1000);
  const sizeToFileRatio = Math.ceil(sizeInMb / bookData.filecount);
  const timedDownload = sizeToFileRatio * 5 * bookData.fileCount * 1000 * 2;

  const StorageClient = new StorageSystem("ehentai");
  const storage = await StorageClient.storeBook(currentId, "e", bookData.title, bookData.title_jpn, bookData.filecount, tags);

  clearInterval(downloadInterval);
  clearInterval(downloadPagesInterval);
  downloadPagesInterval = setInterval(bookPageDownloader, 10000);
  downloadInterval = setInterval(metadataDownloader, bookData.filecount * 10000 * 1.25);
  fs.mkdirSync(`/home/scripting/Guardian/script/image-store/ehentai/before_compression/${currentId}`, 0744);

  console.log(`Successfully stored E-HENTAI#${currentId}.`);
  return (currentIndexPlacement = currentIndexPlacement + 1);
}

// Start the script
if (process.argv[2] !== "stop") {

  console.log(
    `E-HENTAI download script started with beginning ID ${startID}.`
  );
}
