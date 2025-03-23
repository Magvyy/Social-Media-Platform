export function logger(req, res, next) {
    var user = req.session.user;
    console.log(req.session.user);
    console.log("darkmode is: " + req.session.darkmode);
    if (user === undefined) {
        user = "anonymous user";
    }
    console.log(`${req.method} method to ${req.url} from ${user}`);
    next();
}

export function exchangeDarkmode(req, res, next) {
    if (!req.session.darkmode) {
        req.session.darkmode = false;
    }
    if (req.body["darkmode"]) {
        req.session.darkmode = req.body["darkmode"];
    }
    next();
}

export function authenticate(req, res, next) {
    if (req.session.loggedIn) {
        next();
    }
    else {
        res.redirect("/login");
    }
}