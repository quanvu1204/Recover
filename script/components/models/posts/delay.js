const { dbConnect } = require("../../../events/dbConnection.js");
const db = dbConnect();

class PostDelay {
    constructor(service) {
        this.service = service;
    }

    async action(remoteID, rating = '', parentID, source = '', uploadURL = '', filePath = '', tags = '', md5 = '', score, reason = '') {
        let success;

        const actionQuery = {
            query: `INSERT INTO public.${this.service}_post_approvals(remote_id, rating, parent_id, source, upload_url, file_path, tags, md5, score, reason) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            values: [
                remoteID,
                rating,
                parentID,
                source,
                uploadURL,
                filePath,
                tags,
                md5,
                score,
                reason
            ]
        }

        await db.query(actionQuery.query, actionQuery.values, async (err, res) => {
            if (err) {
                success = false;
            } else {
                success = true;
            }
        });
        
        return success;
    }
}

module.exports = PostDelay;