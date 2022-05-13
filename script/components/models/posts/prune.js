const { dbConnect } = require("../../../events/dbConnection.js");
const db = dbConnect();

class PostPrune {
    constructor(service) {
        this.service = service;
    }

    async action(startID, endID) {
        let success;

        const actionQuery = {
            query: `DELETE FROM public.${this.service}_post_details WHERE remote_id > $1 AND remote_id < $2`,
            values: [
                startID,
                endID
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

module.exports = PostPrune;