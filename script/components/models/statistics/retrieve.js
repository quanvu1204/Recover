const { dbConnect } = require("../../../events/dbConnection.js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const db = dbConnect();

class RetrieveStatistics {
    constructor(service, action) {
        this.service = service;
        this.action = action;
    }

    async collect() {
        let count;

        await fetch(`http://localhost:3000/script_statistic/all?service=${this.service}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
            .then(res => res.json())
            .then(json => {
                if (json.length === 0) {
                    count = "none";
                } else count = json[0];
            });
        return count;
    }
}

module.exports = RetrieveStatistics;