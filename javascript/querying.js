import mySQL from "mysql2";
const db = mySQL.createPool({
    host: "127.0.0.1",
    port: "3306",
    user: "root",
    password: "Markus2001",
    database: "notes_app"
}).promise();

export async function queryResult(query, variables) {
    var rows;
    try {
        for (let i = 0; i < variables.length; i++) {
            if (variables[i] === undefined) {
                variables[i] = null;
            }
        }
        [rows] = await db.execute(query, variables);   
    }
    catch (e) {
        
    }
    finally {
        return rows;
    }
}


// Used for front page
async function getPublicNotes(noteIds) {
    var rows;
    if (noteIds) {
        var questions = "(";
        for (let i = 0; i < noteIds.length - 1; i++) {
            questions += "?, ";
        }
        questions += "?)";
        rows = await queryResult(
            "SELECT * FROM notes n " +
            "JOIN (SELECT user_name FROM users) u " +
            "ON u.user_name = n.user_name " +
            "WHERE n.public = 1 " +
            `AND note_id NOT IN ${questions};`,
            [noteIds]
        );
    }
    else {
        rows = await queryResult(
            "SELECT * FROM notes n " +
            "JOIN (SELECT user_name FROM users) u " +
            "ON u.user_name = n.user_name " +
            "WHERE n.public = 1;",
            []
        );
    }
    return rows;
}

export async function loadRandomPublicNotes(noteIds) {
    var notes;
    var noteCount = 2;
    await getPublicNotes(noteIds)
    .then(rows => {
        var len = rows.length;
        if (len > 0) {
            notes = [];
        }
        if (noteCount > len) {
            noteCount = len;
        }
        for (let i = 0; i < noteCount; i++) {
            var index = Math.floor(Math.random() * len);
            notes.push(rows[index]);
            rows.splice(index, 1);
            len--;
        }
    }).catch(e => {

    });
    return notes;
}

// Used to log in
export async function getUser(name) {
    var rows = await queryResult(
        "SELECT * FROM users " +
        "WHERE user_name = ?;",
        [name]
    );
    return rows;
}

export async function getPassword(name) {
    var rows = await queryResult(
        "SELECT * FROM users " +
        "WHERE user_name = ?;",
        [name]
    );
    return rows;
}

// Used to register
export async function register(name, password) {
    var rows = await getUser(name);
    if (rows.length === 1) {
        return false;
    }
    await queryResult(
        "INSERT INTO users (user_name, password) " +
        "VALUES (?, ?);",
        [name, password]
    );
    await queryResult(
        "INSERT INTO profiles (user_name, banner, profile_pic) " +
        "VALUES (?, null, null);",
        [name]
    );
    return true;
}

// Used for personal notes/posts
export async function getReadableNotes(req) {
    var rows = await queryResult(
        "SELECT * FROM notes n " +
        "JOIN access a " +
        "ON a.note_id = n.note_id " +
        "WHERE a.user_name = ? " +
        "AND a.readable = 1;",
        [req.session.userName]
    );
    return rows;
}


// Used to check if note exists
export async function getNote(id) {
    var rows = await queryResult(
        "SELECT * FROM notes " +
        "WHERE note_id = ?;",
        [id]
    );
    return rows;
}

// Creates note if it doesn't exist
export async function createNote(req) {
    var noteName = req.body["note_name"];
    var noteContent = req.body["note_content"];
    var isPublic = 0;
    if (req.body["public"] === "on") {
        isPublic = 1;
    }
    await queryResult(
        "INSERT INTO notes (user_name, note_name, note_content, public) " +
        "VALUES (?, ?, ?, ?);",
        [req.session.userName, noteName, noteContent, isPublic]
    );
    var noteId = await queryResult(
        "SELECT LAST_INSERT_ID();",
        []
    );
    noteId = noteId[0]["LAST_INSERT_ID()"];
    await queryResult(
        "INSERT INTO access (user_name, note_id, readable, writeable) " +
        "VALUES (?, ?, 1, 1);",
        [req.session.userName, noteId]
    );
}

// Check access to edit note if it does exist
export async function getAccess(userName, noteId) {
    var rows = await queryResult(
        "SELECT a.readable, a.writeable " +
        "FROM access a " +
        "JOIN notes n " +
        "ON a.note_id = n.note_id " +
        "WHERE a.user_name = ? " +
        "AND n.note_id = ?;",
        [userName, noteId]
    );
    return rows;
}

async function isReadable(userName, noteId) {
    var visible = await isPublic(noteId);
    if (isPublic) {
        return true;
    }
    var rows = await getAccess(userName, noteId);
    if (rows.length !== 1) {
        return false;
    }
    return rows[0]["readable"] === 1;
}

async function isWriteable(userName, noteId) {
    var rows = await getAccess(userName, noteId);
    if (rows.length !== 1) {
        return false;
    }
    return rows[0]["writeable"] === 1;
}

export async function loadNote(userName, noteId) {
    let p1 = await isReadable(userName, noteId);
    let p2 = await isWriteable(userName, noteId);
    let p3 = await getNoteInfo(noteId);
    var rows = await Promise.all([p1, p2, p3]);
    return rows;
}

// Returns info of note/post and author to display
export async function getNoteInfo(noteId) {
    var rows = await queryResult(
        "SELECT * FROM notes n " +
        "JOIN users u " +
        "ON u.user_name = n.user_name " +
        "WHERE note_id = ?;",
        [noteId]
    );
    return rows[0];
}

export async function isPublic(noteId) {
    var rows = await queryResult(
        "SELECT * FROM notes " +
        "WHERE note_id = ?;",
        [noteId]
    );
    if (rows.length === 0) {
        return false;
    }
    var note = rows[0];
    return note["public"] === 1;
}

export async function getNoteAndAccess(userName, noteId) {
    var rows = await queryResult(
        "SELECT * FROM notes n " +
        "JOIN access a " +
        "ON a.note_id = n.note_id " +
        "WHERE a.user_name = ? " +
        "AND n.note_id = ?;",
        [userName, noteId]
    );
    return rows;
}

async function getProfile(profile) {
    var rows = await queryResult(
        "SELECT * FROM profiles p " +
        "JOIN users u " +
        "ON u.user_name = p.user_name " +
        "WHERE u.user_name = ?;",
        [profile]
    );
    return rows;
}

async function getProfilePosts(profile) {
    var rows = await queryResult(
        "SELECT * FROM notes n " +
        "JOIN users u " +
        "ON u.user_name = n.user_name " +
        "WHERE u.user_name = ? " +
        "AND n.public = 1 " +
        "ORDER BY n.created DESC;",
        [profile]
    );
    return rows;
}

async function getMessages(chatter_1, chatter_2) {
    var rows = await queryResult(
        "SELECT * FROM messages " +
        "WHERE (sender, recipient) = (?, ?) " +
        "OR (sender, recipient) = (?, ?) " +
        "ORDER BY sent DESC;",
        [chatter_1, chatter_2, chatter_2, chatter_1]
    );
    return rows;
}

export async function getProfilePage(profile, userName) {
    let p1 = await getProfile(profile);
    let p2 = await getProfilePosts(profile);
    let p3 = await getMessages(profile, userName);
    var rows = await Promise.all([p1, p2, p3]);
    return rows;
}

export async function editNote(req) {
    var noteName = req.body["note_name"];
    var noteContent = req.body["note_content"];
    var isPublic = 0;
    if (req.body["public"] === "on") {
        isPublic = 1;
    }
    var noteId = req.params[0];
    await queryResult(
        "UPDATE notes " +
        "SET note_name = ?, note_content = ?, public = ? " +
        "WHERE note_id = ?;",
        [noteName, noteContent, isPublic, noteId]
    );
}

async function getChatId(chatter_1, chatter_2) {
    var rows = await queryResult(
        "SELECT chat_id FROM chats " +
        "WHERE (chatter_1, chatter_2) = (?, ?) " +
        "OR (chatter_1, chatter_2) = (?, ?);",
        [chatter_1, chatter_2, chatter_2, chatter_1]
    )
    var chatId;
    try {
        chatId = rows[0]["chat_id"];
    }
    catch {
        await queryResult(
            "INSERT INTO chats (chatter_1, chatter_2) " +
            "VALUES (?, ?);",
            [chatter_1, chatter_2]
        );
        chatId = await queryResult(
            "SELECT LAST_INSERT_ID();",
            []
        );
        chatId = chatId[0]["LAST_INSERT_ID()"];
    }
    return chatId;
}

export async function saveMessage(sender, recipient, message) {
    await getChatId(sender, recipient)
    .then(chatId => {
        queryResult(
            "INSERT INTO messages (chat_id, sender, recipient, message) " +
            "VALUES (?, ?, ?, ?);",
            [chatId, sender, recipient, message]
        );
    }).catch(e => {

    })
}


export async function getChatlogs(sender, recipient) {
    var chatId = getChatId(sender, recipient);
    var rows = await queryResult(
        "SELECT * FROM messages " +
        "WHERE chat_id = ? " +
        "ORDER BY sent DESC;",
        [chatId]
    );
    return rows;
}

export async function getRecievedMessages(sender, recipient) {
    var rows = await queryResult(
        "SELECT * FROM messages " +
        "WHERE sender = ? " +
        "AND recipient = ? " +
        "ORDER BY sent DESC;",
        [sender, recipient]
    );
    return rows;
}

async function getChats(userName) {
    var rows = await queryResult(
        "SELECT * FROM messages " +
        "WHERE sent IN (" +
            "SELECT MAX(sent) FROM messages " +
            "WHERE chat_id IN (" +
                "SELECT chat_id FROM chats " +
                "WHERE chatter_1 = ? " +
                "OR chatter_2 = ? " +
            ") " +
            "GROUP BY chat_id" +
        ");",
        [userName, userName]
    );
    return rows;
}

export async function loadChats(userName) {
    var rows
    try {
        await getChats(userName)
        .then(chats => {
            rows = [];
            chats.forEach(chat => {
                var chatter = chat["sender"];
                if (chatter === userName) {
                    chatter = chat["recipient"];
                }
                chat["profile_name"] = chatter;
                rows.push(chat);
            });
        }).catch(e => {
            
        });
    }
    finally {
        return rows;
    }
}

export async function loadFrontPage(userName) {
    let p1 = await loadRandomPublicNotes();
    let p2 = await loadChats(userName);
    var [notes, chats] = await Promise.all([p1, p2]);
    return [notes, chats];
}