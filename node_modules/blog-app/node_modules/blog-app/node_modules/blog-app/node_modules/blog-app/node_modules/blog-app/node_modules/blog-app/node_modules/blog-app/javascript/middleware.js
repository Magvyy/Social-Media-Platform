export function logger(req, res, next) {
    var userName = req.session.userName;
    if (userName === undefined) {
        userName = "anonymous user";
    }
    console.log(`${req.method} method to ${req.url} from ${userName}`);
    next();
}

export function exchangeDarkmode(req, res, next) {
    if (req.session.darkmode === undefined) {
        req.session.darkmode = false;
    }
    if (req.body["darkmode"] !== undefined) {
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