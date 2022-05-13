const { dbConnect } = require("../../../events/dbConnection.js");
const db = dbConnect();

class PostCreate {
    constructor(service) {
        this.service = service;
    }

    async action(remoteID, rating = '', parentID, source = '', uploadURL = '', filePath = '', tags = '', md5 = '') {
        let success;

        const actionQuery = {
            query: `INSERT INTO public.${this.service}_post_details(remote_id, rating, parent_id, source, upload_url, file_path, tags, md5) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            values: [
                remoteID,
                rating,
                parentID,
                source,
                uploadURL,
                filePath,
                tags,
                md5
            ]
        }

        db.query(actionQuery.query, actionQuery.values, async (err, res) => {
            if (err) {
                return console.log(`Database error occurred while storing ${this.service.toUpperCase()}#${remoteID}. Error(s): ${err}`);
            }
        });
    }
}

module.exports = PostCreate;