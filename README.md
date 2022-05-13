### Database setup

Run database migrations & sql files in `/script/db`. Requires postgresql database, any recent version. Current version on scripting server is 10.16

### API setup

The cert/pem files are not actually used. SSL/ TLS is not necessary to run the API. After the database migrations are done you can run the API with `node server.js`.
To access the API, it is limited to specific IPs. For personal use it can be disabled, but it is faster to just add any relevant IPs to `/api/config.js`.

### Download script setup

Need to create an `image-store` directory in the `/script` directory.
Then you will need a sub-directory in this directory, named after the relevant remote source, such as `danbooru`.
In each sub-directory, you need the following:
/script/image-store
  ↳ danbooru
    ↳ initial
    ↳ retry
      ↳ full
      ↳ preview
    ↳ thumbnail
    
Download scripts can be started with `node /path/to/downloader.js start_id end_id`. There may be some environment variables which need fulfilled depending on the source

### Upload script setup

Once some data has been stored, upload scripts can be started with `node /path/to/uploader.js start_id end_id access_token`. 
Every uploader script needs a username and password environment variable. for example `REICHAN_USERNAME=` or `REICHAN_PASSWORD=`. This is to allow the scripts run forever
