import express from "express";
import bodyParser from "body-parser";
import session from "express-session";

import {logger, exchangeDarkmode, authenticate} from "./javascript/middleware.js";
import * as querying from "./javascript/querying.js";

// Defining the app and get/post methods
const app = express();
const port = 8000;

app.use(express.static("public"));
app.use(express.static("javascript"));
app.use(session({secret: 'keyboard cat', cookie: {maxAge: 60000}}))
app.use(bodyParser.urlencoded({extended: true}));
app.use(exchangeDarkmode);
app.use(logger);

app.get("/", async (req, res) => {
    var user = req.session.user;
    await querying.loadRandomPublicNotes()
    .then(notes => {
        res.render("home.ejs", {
            user: user,
            notes: notes,
            darkmode: req.session.darkmode
        });
    }).catch(e => {
        console.log(e);
    });
});

app.get("/login", (req, res) => {
    var user = req.session.user;
    res.render("login.ejs", {
        user: user,
        darkmode: req.session.darkmode
    });
});

app.post("/login", async (req, res) => {
    var user = req.body["user"];
    var password = req.body["password"];
    await querying.login(user, password)
    .then(passed => {
        if (passed) {
            querying.getId(user, password).then(userId => {
                req.session.user = user;
                req.session.userId = userId;
                req.session.loggedIn = true;
                res.redirect("/notes");
            }).catch(e => {
                console.log(e);
            });
        }
        else {
            res.redirect("/login");
        }
    });
});

app.get("/register", (req, res) => {
    var user = req.session.user;
    res.render("register.ejs", {
        user: user,
        darkmode: req.session.darkmode
    });
});

app.post("/register", async (req, res) => {
    var user = req.body["user"];
    var password = req.body["password"];
    await querying.register(user, password)
    .then(passed => {
        if (passed) {
            res.redirect("/");
        }
        else {
            res.redirect("/register");
        }
    });
});

app.get("/secret", authenticate, (req, res) => {
    var user = req.session.user;
    res.render("secret.ejs", {
        user: user,
        darkmode: req.session.darkmode
    });
});

app.get("/notes", authenticate, (req, res) => {
    var user = req.session.user;
    querying.getReadableNotes(req)
    .then(notes => {
        res.render("notes/notes.ejs", {
            notes: notes,
            user: user,
            darkmode: req.session.darkmode
        });
    }).catch(e => {
        console.log(e);
    });
});

app.get("/note/create", authenticate, (req, res) => {
    var user = req.session.user;
    res.render("notes/note.ejs", {
        user: user,
        name: undefined,
        content: undefined,
        noteId: undefined,
        writeable: 1,
        darkmode: req.session.darkmode
    });
});

app.post("/note/edit/*", authenticate, async (req, res) => {
    var user = req.session.user;
    var noteId = req.params[0];
    console.log(req.body);
    await querying.queryResult(
        `SELECT * FROM notes ` +
        `WHERE noteId = ${noteId};`
    ).then(rows => {
        if (rows.length !== 1) {
            querying.createNote(req);
            return;
        }
        var access = querying.getAccess(req.session.userId, noteId);
        access.then(result => {
            if (result.length === 0) {
                return;
            }
            if (result["writeable"]) {
                querying.editNote(req);
            }
        })
    }).catch(e => {
        console.log(e);
    });
    res.redirect("/notes");
});

app.get("/note/view/*", authenticate, async (req, res) => {
    var user = req.session.user;
    var noteId = req.params[0];
    await querying.getReadableNotes(req)
    .then(notes => {
        var viewable = false;
        notes.forEach(note => {
            if (note["noteId"] == noteId) {
                console.log(note["public"]);
                viewable = true;
                res.render("notes/note.ejs", {
                    user: user,
                    name: note["name"],
                    content: note["content"],
                    writeable: note["writeable"],
                    isPublic: note["public"],
                    noteId: noteId,
                    darkmode: req.session.darkmode
                });
                return;
            }
        });
        if (!viewable) {
            res.redirect("/notes");
        }
    }).catch(e => {
        console.log(e);
    });
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
    var url = req.body["location"];
    res.redirect(url);
});

app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});