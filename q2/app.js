const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
    session({
        store: new FileStore({
            path: "./sessionfile"
        }),
        secret: "mysecret",
        resave: false,
        saveUninitialized: false
    })
);

app.post("/login", (req, res) => {
    const { uname, pass } = req.body;

    if (uname === "hk" && pass === "hk") {
        req.session.user = uname;
        res.redirect("/dash.html");
    } else {
        res.send("Invalid username or password");
    }
});

app.get("/dash", (req, res) => {
    if (!req.session.user) {
        return res.send("Login is required");
    }

    res.sendFile(__dirname + "/public/dash.html");
});

app.get("/profile", (req, res) => {
    if (!req.session.user) {
        return res.send("Login is required");
    }

    res.sendFile(__dirname + "/public/profile.html");
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login.html");
    });
});

app.listen(3000, () => {
    console.log("Listening on port 3000");
});