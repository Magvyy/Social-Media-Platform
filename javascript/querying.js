import mySQL from "mysql2";
const db = mySQL.createPool({
    host: "127.0.0.1",
    port: "3306",
    user: "root",
    password: "Markus2001",
    database: "blog"
}).promise();

export async function queryResult(query) {
    const [rows] = await db.query(query);
    return rows;
}

export async function login(name, password) {
    var rows = await queryResult(
        `SELECT * FROM users ` +
        `WHERE password = \"${password}\";`
    );
    if (rows.length === 1) {
        return true;
    }
    return false;
}

export async function register(name, password) {
    var rows = await queryResult(
        `SELECT * FROM users ` +
        `WHERE password = \"${password}\";`
    );
    if (rows.length >= 1) {
        console.log("User taken");
        return false;
    }
    rows = await queryResult(
        `INSERT INTO users VALUES (null, \"${name}\", \"${password}\");`
    );
    return true;
}

export async function getId(name, password) {
    var rows = await queryResult(
        `SELECT * FROM users ` +
        `WHERE password = \"${password}\";`
    );
    var id = rows[0]["userId"];
    return id;
}

export async function getReadableNotes(req) {
    var rows = await queryResult(
        `SELECT a.readable, a.writeable, a.public, n.noteId, n.name, n.content, n.created ` +
        `FROM access a ` +
        `INNER JOIN notes n ` +
        `ON a.noteId = n.noteId ` +
        `WHERE a.userId = ${req.session.userId} ` +
        `AND a.readable = 1;`
    );
    return rows;
}

export async function getAccess(user, note) {
    var access = await queryResult(
        `SELECT a.readable, a.writeable, n.noteId, n.name, n.content, n.created ` +
        `FROM access a ` +
        `INNER JOIN notes n ` +
        `ON a.noteId = n.noteId ` +
        `WHERE a.userId = ${user} ` +
        `AND n.noteId = ${note};`
    );
    return access[0];
}

export async function createNote(req) {
    var noteName = req.body["name"];
    var noteContent = req.body["content"];
    var isPublic = 0;
    if (req.body["public"] === "on") {
        isPublic = 1;
    }
    var noteId = req.params[0];
    await queryResult(
        `INSERT INTO notes (userId, name, content) ` +
        `VALUES (${req.session.userId}, \"${noteName}\", \"${noteContent}\");`
    );
    await queryResult(
        `INSERT INTO access (userId, noteId, readable, writeable, public) ` +
        `VALUES (${req.session.userId}, ${noteId}, 1, 1, ${isPublic});`
    );
}

export async function editNote(req) {
    var noteName = req.body["name"];
    var noteContent = req.body["content"];
    var isPublic = 0;
    if (req.body["public"] === "on") {
        isPublic = 1;
    }
    var noteId = req.params[0];
    await queryResult(
        `UPDATE notes ` +
        `SET name = \"${noteName}\", content = \"${noteContent}\" ` +
        `WHERE noteId = ${noteId};`
    );
    await queryResult(
        `UPDATE access ` +
        `SET public = ${isPublic} ` +
        `WHERE noteId = ${noteId};`
    );
}

export async function loadRandomPublicNotes() {
    var notes;
    var noteCount = 4;
    await queryResult(
        `SELECT n.noteId, n.name, n.content ` +
        `FROM notes n ` +
        `INNER JOIN access a ` +
        `ON a.noteId = n.noteId ` +
        `WHERE a.public = 1;`
    ).then(rows => {
        var len = rows.length;
        if (len > 0) {
            notes = [];
        }
        for (let i = 0; i < noteCount; i++) {
            var index = Math.floor(Math.random() * len);
            notes.push(rows[index]);
            rows.splice(index, 1);
            len--;
        }
    }).catch(e => {
        console.log(e);
    });
    return notes;
}