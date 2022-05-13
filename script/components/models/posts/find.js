const { dbConnect } = require("../../../events/dbConnection.js");
const db = dbConnect();
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

class PostFind {
    constructor(service, remoteid) {
        this.service = service;
        this.remoteid = remoteid;
    }

    async findById() {
        let post;

        await fetch(`http://localhost:3000/pending_upload/index?remote_id=${this.remoteid}&service=${this.service}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
            .then(res => res.json())
            .then(json => {
                if (json.length === 0) {
                    post = "none";
                } else post = json[0];
            });
        
        return post;
    }
    
    async findByApprovalStatus() {
        let post;

        await fetch(`http://localhost:3000/post_approval/index?status=approved`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
            .then(res => res.json())
            .then(json => {
                if (json.length === 0) {
                    post = "none";
                } else post = json[0];
            });
        
        return post;
    }

    async findByRetry() {
        let post;

        await fetch(`http://localhost:3000/pending_upload/index?remote_id=${this.remoteid}&service=${this.service}&is_retried=1`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
            .then(res => res.json())
            .then(json => {
                if (json.length === 0) {
                    post = "none";
                } else post = json[0];
            });
        
        return post;
    }
}

module.exports = PostFind;