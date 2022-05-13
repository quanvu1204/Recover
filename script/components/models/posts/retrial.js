const { dbConnect } = require("../../../events/dbConnection.js");
const db = dbConnect();

class PostRetrial {
    constructor(service) {
        this.service = service;
    }

    async add(remoteID) {
        let success;

        const actionQuery = {
            query: `UPDATE public.${this.service}_post_details SET is_retried = $1 WHERE remote_id = $2`,
            values: [
                true,
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

    async clear(remoteID) {
        let success;

        const actionQuery = {
            query: `UPDATE public.${this.service}_post_details SET is_retried = $1 WHERE remote_id = $2`,
            values: [
                false,
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

    async approvalAdd(remoteID) {
        let success;

        const actionQuery = {
            query: `UPDATE public.${this.service}_post_approvals SET is_retried = $1 WHERE remote_id = $2`,
            values: [
                true,
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

module.exports = PostRetrial;