/*
                                 Table "public.users"
    Column     |            Type             | Collation | Nullable |      Default       
---------------+-----------------------------+-----------+----------+--------------------
 id            | uuid                        |           | not null | uuid_generate_v4()
 name          | character varying(50)       |           | not null | 
 email         | character varying(255)      |           | not null | 
 password      | character varying(255)      |           | not null | 
 creation_time | timestamp without time zone |           | not null | 
Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
    "users_email_key" UNIQUE CONSTRAINT, btree (email)
    "users_name_key" UNIQUE CONSTRAINT, btree (name)

*/

const poolDb = require('../database/db');

class User {
    constructor({name, email, password, creationTime = null, id = null}) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.creationTime = creationTime? creationTime: new Date().toISOString();
        this.id = id;
    }

    async createUser() {
        try {
            await poolDb.query("INSERT INTO users(name, email, password, creation_time) VALUES($1, $2, $3, $4)", [this.name, this.email, this.password, this.creationTime]);
        } catch(err) {
            const regex = /Key \(([^)]+)\)=\(([^)]+)\) already exists\./
            const matches = err.detail.match(regex);
            if(matches) {
                const field = matches[1];
                const value = matches[2];
                const errObj = new Error(`${field} '${value}' already exists!`);
                errObj.cause = "duplicate";
                throw errObj;
            } else {
                console.log(err);
                const errObj = new Error("Database error!");
                errObj.cause = err.detail;
                throw errObj;
            }
        }
    }

    async getPlayerId() {
        try {
            const result = await poolDb.query(
                "SELECT * from players WHERE username = $1",
                [this.name]
            );
            return (result.rowCount > 0)? result.rows[0].player_id: null;

        } catch(err) {
            console.log(err);
            throw err;
        }
    }

    static async getUserByName(username) {
        try {
            const result = await poolDb.query(
                "SELECT * from users WHERE name = $1;", [username]
            );
            if(result.rowCount > 0) return new User({...result.rows[0], creationTime: result.rows[0].creation_time});
            else return null;

        } catch(err) {
            const errObj = new Error("Database error!");
            errObj.cause = err.detail;
            throw errObj;
        }
    }

    static async getUserbyId(userId) {
        try {
            const result = await poolDb.query(
                "SELECT * from users WHERE id = $1",
                [userId]
            );

            if(result.rowCount > 0) return new User({...result.rows[0], creationTime: result.rows[0].creation_time});
            else return null;
            
        } catch(err) {
            const errObj = new Error("Something went wrong!");
            errObj.cause = err.detail;
            throw errObj;
        }
    }
}

module.exports = User;