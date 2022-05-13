const { dbConnect } = require("../../../events/dbConnection.js");
const db = dbConnect();

class IncrementStatistics {
    constructor(service, count) {
        this.service = service;
        this.count = count;
    }

    async uploadCount() {
        const uploadQuery = {
            query: "UPDATE public.script_statistics SET (uploaded_count, last_upload_at) = ($1, $2) WHERE service = $3",
            values: [
                this.count.uploaded_count + 1,
                "now()",
                this.service
            ]
        }

        await db.query(uploadQuery.query, uploadQuery.values, async (err, res) => {
            if (err) {
                return console.log(`Could not update database upload count for ${this.service}. Error(s): ${err}`);
            }
        });
    }

    async updateCount() {
        const updateQuery = {
            query: "UPDATE public.script_statistics SET updated_count = $1 WHERE service = $2",
            values: [
                this.count.updated_count + 1,
                this.service
            ]
        }

        await db.query(updateQuery.query, updateQuery.values, async (err, res) => {
            if (err) {
                return console.log(`Could not update database update count for ${this.service}. Error(s): ${err}`);
            }
        });
    }

    async failCount() {
        const failQuery = {
            query: "UPDATE public.script_statistics SET failed_count = $1 WHERE service = $2",
            values: [
                this.count.failed_count + 1,
                this.service
            ]
        }

        await db.query(failQuery.query, failQuery.values, async (err, res) => {
            if (err) {
                return console.log(`Could not update database fail count for ${this.service}. Error(s): ${err}`);
            }
        });
    }
}

module.exports = IncrementStatistics;