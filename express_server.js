const express = require("express");
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080;

const bcrypt = require("bcryptjs");

const { 
  getUserByEmail,
  generateRandomString, 
  urlsForUser, 
  isLoggedInFeatures, 
  isLoggedInUrls,
  handleUrlNotFound,
  checkUrlOwnership 
} = require('./helpers');

const { urlDatabase } = require('./database');
const users = require('./users'); 

app.set("view engine", "ejs");

app.use(cookieSession({
  name: 'session',
  keys: ['your-secret-key'], // we can replace with our own secret keys for signing the cookies
  maxAge: 24 * 60 * 60 * 1000, // Session will expire after 24 hours
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
  res.locals.user = req.session.user_id ? users[req.session.user_id] : null;
  next();
});

app.get("/register", isLoggedInUrls(users), (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = {
    user,
  };
  res.render("urls_register", templateVars);
});

app.get("/login", isLoggedInUrls(users), (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = {
    user,
  };
  res.render("urls_login", templateVars);
});

app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    const templateVars = {
      user,
      message: "Please log in or register to view your URLs.",
    };
    res.render("urls_index", templateVars);
    return;
  }
  const userURLs = urlsForUser(user.id);
  const templateVars = {
    user,
    urls: userURLs,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", isLoggedInFeatures(users), (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = {
    user,
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", handleUrlNotFound, checkUrlOwnership(users), (req, res) => {
  const id = req.params.id;
  const user = users[req.session.user_id];
  const longURL = urlDatabase[id].longURL;
  const templateVars = {
    user,
    id,
    longURL,
  };
  res.render("urls_show", templateVars);
});

app.get("/urls/:id/delete", handleUrlNotFound, checkUrlOwnership(users), (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});


app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id] ? urlDatabase[id].longURL : null;
  if (longURL) {
    res.redirect(longURL);
  } else {
    const errorMessage = `
      <html>
        <head>
          <title>Short URL not found</title>
        </head>
        <body>
          <h2>Short URL not found</h2>
          <p>The requested short URL with id '${id}' does not exist.</p>
        </body>
      </html>
    `;
    res.status(404).send(errorMessage);
  }
});

app.post("/urls", isLoggedInFeatures(users), (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.status(401).send("You need to be logged in to create new tiny URLs.");
    return;
  }
  const longURL = req.body.longURL;
  const id = generateRandomString();
  urlDatabase[id] = { longURL, userID: user.id };
  res.redirect(`/urls/${id}`); 
});

app.post("/urls/:id/delete", isLoggedInFeatures(users), (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.status(401).send("Please log in or register to delete this URL.");
    return;
  }
  const id = req.params.id;
  if (!urlDatabase[id]) {
    res.status(404).send("URL not found.");
    return;
  }
  if (urlDatabase[id].userID !== user.id) {
    res.status(403).send("You do not have permission to delete this URL.");
    return;
  }
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  if (urlDatabase[id]) {
    urlDatabase[id].longURL = newLongURL;
    res.redirect("/urls");
  } else {
    res.status(404).send("URL not found");
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty.");
    return;
  }
  const user = getUserByEmail(email, users);
  if (!user) {
    res.status(403).send("User not found.");
    return;
  }
  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (passwordMatch) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(403).send("Incorrect password.");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty.");
    return;
  }
  if (getUserByEmail(email, users)) {
    res.status(400).send("Email already registered. Please choose a different email.");
    return;
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = generateRandomString();
  users[userId] = { id: userId, email, password: hashedPassword }; // Save the hashed password
  req.session.user_id = userId;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
