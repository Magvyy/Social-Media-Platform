import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import { WebSocketExpress, Router } from 'websocket-express';
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from 'uuid';

import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

import {logger, exchangeDarkmode, authenticate} from "./javascript/middleware.js";
import * as querying from "./javascript/querying.js";

// Defining the app and get/post methods
const app = new WebSocketExpress();
const router = new Router();
const port = 8000;

var sess = session({secret: 'keyboard cat'});

// app.use(express.static("C:/Programming/Web Development/Section 26 - Capstone Project - Create a Blog web application/public"));
app.use(express.static(__dirname + "/public"));
app.use(sess);
app.use(bodyParser.urlencoded({extended: true}));
app.use(websocketer);
app.use(exchangeDarkmode);
app.use(logger);
app.use(router);

var sockets = {};
var userSocket = {};

function websocketer(req, res, next) {
    if (!req.session.socketId) {
        req.session.socketId = uuidv4();
    }
    next();
}

app.get("/", async (req, res) => {
    var userName = req.session.userName;
    var p1 = await querying.loadRandomPublicNotes();
    var p2 = await querying.loadChats(userName);
    await Promise.all([p1, p2])
    .then(([notes, chats]) => {
        res.render("home.ejs", {
            userName: userName,
            chats: chats,
            notes: notes,
            darkmode: req.session.darkmode
        });
    }).catch(e => {
        console.log(e);
    });
});

app.get("/new_notes?*", async (req, res) => {
    var noteIds = req.query["notes"].split(",").map(function (noteId) {
        return noteId;
    }).join();
    await querying.loadRandomPublicNotes(noteIds)
    .then(notes => {
        res.send(notes);
    }).catch(e => {
        console.log(e);
    });
});

app.get("/login", (req, res) => {
    var userName = req.session.userName;
    res.render("login.ejs", {
        userName: userName,
        darkmode: req.session.darkmode
    });
});

app.post("/login?*", async (req, res) => {
    var userName = req.query["user_name"];
    var password = req.query["password"];
    await querying.getPassword(userName)
    .then(result => {
        if (result.length === 1) {
            var hashed = result[0]["password"];
            bcrypt.compare(password, hashed)
            .then(comparison => {
                if (comparison) {
                    userSocket[userName] = req.session.socketId;
                    req.session.userName = userName;
                    req.session.loggedIn = true;
                    res.redirect("/");
                } 
                else {
                    sockets[req.session.socketId].send("Incorrect password");
                }
            });
        }
        else {
            sockets[req.session.socketId].send("Incorrect username");
        }
    }).catch(e => {
        console.log(e);
    });
});

app.get("/register", (req, res) => {
    var userName = req.session.userName;
    res.render("register.ejs", {
        userName: userName,
        darkmode: req.session.darkmode
    });
});

app.post("/register?*", async (req, res) => {
    var userName = req.query["user_name"];
    var password = await bcrypt.hash(req.query["password"], 10);
    await querying.register(userName, password)
    .then(passed => {
        if (passed) {
            res.redirect("/");
        }
        else {
            sockets[req.session.socketId].send("Username taken");
        }
    });
});

app.get("/secret", authenticate, (req, res) => {
    var userName = req.session.userName;
    res.render("secret.ejs", {
        userName: userName,
        darkmode: req.session.darkmode
    });
});

app.get("/notes", authenticate, async (req, res) => {
    var userName = req.session.userName;
    await querying.getReadableNotes(req)
    .then(notes => {
        res.render("notes/notes.ejs", {
            userName: userName,
            notes: notes,
            darkmode: req.session.darkmode
        });
    }).catch(e => {
        console.log(e);
    });
});

app.get("/note/create", authenticate, (req, res) => {
    var userName = req.session.userName;
    res.render("notes/note.ejs", {
        userName: userName,
        noteName: undefined,
        noteContent: undefined,
        noteId: undefined,
        writeable: 1,
        darkmode: req.session.darkmode
    });
});

app.post("/note/edit/*", authenticate, async (req, res) => {
    var noteId = req.params[0];
    await querying.getNote(noteId)
    .then(rows => {
        if (rows.length === 0) {
            querying.createNote(req);
            return;
        }
        querying.getAccess(req.session.userName, noteId)
        .then(rows => {
            if (rows.length === 0) {
                return;
            }
            var access = rows[0];
            if (access["writeable"]) {
                querying.editNote(req);
            }
        })
    }).catch(e => {
        console.log(e);
    });
    res.redirect("/notes");
});

app.get("/note/view/*", async (req, res) => {
    var noteId = req.params[0];
    var userName = req.session.userName;
    await querying.loadNote(userName, noteId)
    .then(([readable, writeable, note]) => {
        if (!readable) {
            this.reject();
        }
        res.render("notes/note.ejs", {
            userName: userName,
            noteName: note["note_name"],
            noteContent: note["note_content"],
            writeable: writeable,
            author: note["user_name"],
            created: note["created"],
            noteId: noteId,
            darkmode: req.session.darkmode
        });
    }).catch(e => {
        res.redirect("/");
    });
});

app.get("/profile/*", async (req, res) => {
    var profileName = req.params[0];
    var userName = req.session.userName;
    await querying.getProfilePage(profileName, userName)
    .then(values => {
        var profile = values[0];
        var notes = values[1];
        var messages = values[2];
        res.render("profiles/profile.ejs", {
            userName: userName,
            notes: notes,
            profile: profileName,
            banner: profile["banner"],
            profilePic: profile["profile_pic"],
            messages: messages,
            darkmode: req.session.darkmode
        });
    }).catch(e => {
        console.log(e);
    });
});

app.post("/message?*", authenticate, async (req, res) => {
    var recipient = req.query["recipient"];
    var message = req.query["message"];
    var sender = req.session.userName;
    await querying.saveMessage(req.session.userName, recipient, message)
    .then(success => {
        var data = `${message}&${sender}`;
        try {
            sockets[userSocket[recipient]].send(data);
        }
        catch(e) {
            
        }
    }).catch(e => {
        console.log(e);
    });
});

app.get("/message?*", authenticate, async (req, res) => {
    var sender = req.query["sender"];
    await querying.getRecievedMessages(sender, req.session.userName)
    .then(messages => {
        res.send(messages);
    }).catch(e => {
        console.log(e);
    });
});

router.ws("/socket", async (req, res) => {
    const ws = await res.accept();
    sockets[req.session.socketId] = ws;
});

app.get("/logout", authenticate, (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

app.post("/darkmode", (req, res) => {
    if (!req.session.darkmode) {
        req.session.darkmode = true;
    }
    else {
        req.session.darkmode = false;
    }
    res.status(200);
});

app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});