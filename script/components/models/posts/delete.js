const { dbConnect } = require("../../../events/dbConnection.js");
const db = dbConnect();

class PostDelete {
    constructor(service) {
        this.service = service;
    }

    async action(remoteID) {
        let success;

        const actionQuery = {
            query: `DELETE FROM public.${this.service}_post_details WHERE remote_id = $1`,
            values: [
                remoteID
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

module.exports = PostDelete;