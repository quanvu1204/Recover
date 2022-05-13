const Zip = require("adm-zip");
const fs = require('fs');

class BookZipper {
  async zipBook(remoteId = "") {
    const zip = new Zip();
  
    fs.readdir(`/home/scripting/Guardian/script/image-store/ehentai/before_compression/${remoteId}`, function (err, files) {
      if (err) {
        return console.log('Unable to scan directory: ' + err);
      } 
      files.forEach(function (file) {
        zip.addLocalFile(`/home/scripting/Guardian/script/image-store/ehentai/before_compression/${remoteId}/${file}`);
      });
      console.log(zip);
      zip.writeZip(`/home/scripting/Guardian/script/image-store/ehentai/initial/ehentai-book_id-${remoteId}.zip`);
      fs.rmSync(`/home/scripting/Guardian/script/image-store/ehentai/before_compression/${remoteId}`, { recursive: true, force: true });
      return console.log(`Successfully stored a ZIP of E-HENTAI#${remoteId}`);
    });
  }    

}
      
module.exports = BookZipper;