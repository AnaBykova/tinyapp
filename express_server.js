const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const length = 6;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}

function getUserByEmail(email) {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
}

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { 
    user,
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { 
    user,
  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { 
    user,
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { 
    user,
  };
  res.render("urls_login", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const id = req.params.id;
  const longURL = urlDatabase[id];
  const templateVars = { 
    user,
    id,
    longURL,
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const longURL = req.body.longURL; // Get the longURL from the form data

  // Generate a unique id using the generateRandomString function
  const id = generateRandomString();

  // Save the id-longURL pair to the urlDatabase
  urlDatabase[id] = longURL;

  console.log(req.body); // Log the POST request body to the console
  console.log(urlDatabase); // Log the updated urlDatabase to the console

  res.redirect(`/urls/${id}`); // Redirect the user to the newly created short URL page
  //res.send("Ok"); // Respond with 'Ok' (we will replace this)
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];

  if (longURL) {
    res.redirect(longURL); // Redirect to the longURL if it exists
  } else {
    res.status(404).send("Short URL not found"); // Respond with a 404 error if the short URL is not found
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;

  // Check if the URL with the given ID exists in the urlDatabase
  if (urlDatabase[id]) {
    // Use the delete operator to remove the URL from the urlDatabase
    delete urlDatabase[id];

    // Redirect the client back to the urls_index page ("/urls")
    res.redirect("/urls");
  } else {
    // If the URL with the given ID does not exist, respond with a 404 error
    res.status(404).send("URL not found");
  }
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL; // Get the new longURL from the form data

  // Check if the URL with the given ID exists in the urlDatabase
  if (urlDatabase[id]) {
    // Update the longURL for the given ID with the new value
    urlDatabase[id] = newLongURL;

    // Redirect the client back to the /urls page
    res.redirect("/urls");
  } else {
    // If the URL with the given ID does not exist, respond with a 404 error
    res.status(404).send("URL not found");
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email; // Get the email from the request body
  const password = req.body.password; // Get the password from the request body

  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty.");
    return;
  }

  const user = getUserByEmail(email);

  if (!user) {
    res.status(403).send("User not found.");
    return;
  }

  if (user.password !== password) {
    res.status(403).send("Incorrect password.");
    return;
  }

  // If both checks pass, set the user_id cookie with the matching user's ID
  res.cookie("user_id", user.id);

  res.redirect("/urls");
});

// Middleware to set the username in res.locals
app.use((req, res, next) => {
  res.locals.user = users[req.cookies["user_id"]] || null;
  next();
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty.");
    return;
  }

  if (getUserByEmail(email)) {
    res.status(400).send("Email already registered. Please choose a different email.");
    return;
  }

  const userId = generateRandomString();
  users[userId] = { id: userId, email, password };
  res.cookie("user_id", userId);
  res.redirect("/urls");
});
