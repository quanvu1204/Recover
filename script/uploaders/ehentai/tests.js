const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const hitomi = require('node-hitomi').default;

async function asyncCall() {
const abc = await hitomi.getGallery(2216341);
const def = await new hitomi.ImageUrlResolver(abc.files[0]).synchronize(abc.files[0]);
const ghi = await def.getImageUrl(abc.files[0], "webp");
  

  
  console.log(await ghi);
}

asyncCall();