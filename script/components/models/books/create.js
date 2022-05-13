const { dbConnect } = require("../../../events/dbConnection.js");
const db = dbConnect();

class BookCreate {
    constructor(service) {
        this.service = service;
    }

    async action(remoteID, rating = '', filePath = '', tags = '', titleEn = '', titleJp = '', pageCount) {
        let success;

        const actionQuery = {
            query: `INSERT INTO public.${this.service}_book_details(remote_id, rating, file_path, book_tags, title_en, title_jp, page_count) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            values: [
                remoteID,
                rating,
                filePath,
                tags,
                titleEn,
                titleJp,
                pageCount
            ]
        }

        db.query(actionQuery.query, actionQuery.values, async (err, res) => {
            if (err) {
                return console.log(`Database error occurred while storing ${this.service.toUpperCase()}#${remoteID}. Error(s): ${err}`);
            }
        });
    }
}

module.exports = BookCreate;