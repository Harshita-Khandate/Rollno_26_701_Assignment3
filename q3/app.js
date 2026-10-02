const express = require("express");
const session = require("express-session");
const { RedisStore } = require("connect-redis");
const { createClient } = require("redis");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

// Redis client
const redisClient = createClient();

redisClient.connect()
    .then(() => console.log("Redis Connected"))
    .catch(err => console.log(err));

// Session with Redis
app.use(
    session({
        store: new RedisStore({
            client: redisClient
        }),
        secret: "mysecret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 30
        }
    })
);


// Login page
app.get("/", (req, res) => {
    res.render("login");
});


// Login
app.post("/login", (req, res) => {

    const { username, password } = req.body;

    // Simple hard-coded user
    if (username === "admin" && password === "1234") {

        req.session.user = username;

        res.redirect("/home");

    } else {

        res.send("Invalid username or password");

    }
});


// Middleware for protected routes
function isAuthenticated(req, res, next) {

    if (req.session.user) {
        next();
    } else {
        res.redirect("/");
    }

}


// Protected Route 1
app.get("/home", isAuthenticated, (req, res) => {

    res.render("home", {
        username: req.session.user
    });

});


// Protected Route 2
app.get("/profile", isAuthenticated, (req, res) => {

    res.render("profile", {
        username: req.session.user
    });

});


// Logout
app.get("/logout", (req, res) => {

    req.session.destroy((err) => {

        if (err) {
            return res.send("Logout failed");
        }

        res.redirect("/");

    });

});


app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});