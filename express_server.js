const express = require("express");
//const cookieParser = require("cookie-parser");
const cookieSession = require('cookie-session');
const app = express();
//app.use(cookieParser());
const PORT = 8080;

const bcrypt = require("bcryptjs");
const password = "purple-monkey-dinosaur"; // found in the req.body object
const hashedPassword = bcrypt.hashSync(password, 10);

const { getUserByEmail } = require('./helpers'); 

app.set("view engine", "ejs");

app.use(cookieSession({
  name: 'session',
  keys: ['your-secret-key'], // we can replace with our own secret keys for signing the cookies
  maxAge: 24 * 60 * 60 * 1000, // Session will expire after 24 hours
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const length = 6;
  while (result.length < length) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    const char = characters.charAt(randomIndex);
    if (!result.includes(char)) {
      result += char;
    }
  }
  return result;
}

/*
function getUserByEmail(email, database) {
  for (const userId in database) {
    if (database[userId].email === email) {
      return database[userId];
    }
  }
  return null;
}
*/

function urlsForUser(id) {
  const filteredURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      filteredURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return filteredURLs;
}

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: hashedPassword,
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: hashedPassword,
  },
};

const isLoggedInUrls = (req, res, next) => {
  const user = users[req.session.user_id];
  if (user) {
    res.redirect("/urls");
  } else {
    next();
  }
};

const isLoggedInFeatures = (req, res, next) => {
  const user = users[req.session.user_id];
  if (user) {
    next();
  } else {
    res.redirect("/login");
  }
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", isLoggedInUrls, (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = {
    user,
  };
  res.render("urls_register", templateVars);
});

app.get("/login", isLoggedInUrls, (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = {
    user,
  };
  res.render("urls_login", templateVars);
});

app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    // If the user is not logged in, display a message suggesting to log in or register first
    const templateVars = {
      user,
      message: "Please log in or register to view your URLs.",
    };
    res.render("urls_index", templateVars);
    return;
  }
  // If the user is logged in, show only their URLs
  const userURLs = urlsForUser(user.id);
  const templateVars = {
    user,
    urls: userURLs,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", isLoggedInFeatures, (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = {
    user,
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    // If the user is not logged in, display an error message
    res.status(401).send("Please log in or register to view this URL.");
    return;
  }
  const id = req.params.id;
  const longURL = urlDatabase[id] ? urlDatabase[id].longURL : null;
  if (!longURL) {
    // If the URL with the given ID does not exist, send a relevant HTML error message
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
    return;
  }
  if (urlDatabase[id].userID !== user.id) {
    // If the URL does not belong to the logged-in user, display an error message
    res.status(403).send("You do not have permission to view this URL.");
    return;
  }
  // If the user is logged in and the URL belongs to them, show the URL details
  const templateVars = {
    user,
    id,
    longURL,
  };
  res.render("urls_show", templateVars);
});

app.get("/urls/:id/delete", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    // If the user is not logged in, display an error message
    res.status(401).send("Please log in or register to view this URL.");
    return;
  }
  const id = req.params.id;
  const longURL = urlDatabase[id] ? urlDatabase[id].longURL : null;
  if (!longURL) {
    // If the URL with the given ID does not exist, send a relevant HTML error message
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
    return;
  }
  if (urlDatabase[id].userID !== user.id) {
    // If the URL does not belong to the logged-in user, display an error message
    res.status(403).send("You do not have permission to view this URL.");
    return;
  }
  // If the user is logged in and the URL belongs to them, show the URL details
  delete urlDatabase[id];
  res.redirect("/urls");
});


app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id] ? urlDatabase[id].longURL : null;
  if (longURL) {
    res.redirect(longURL); // Redirect to the longURL if it exists
  } else {
    // If the id does not exist in the urlDatabase, send a relevant HTML error message
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

app.post("/urls", isLoggedInFeatures, (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    // If the user is not logged in, respond with an HTML message
    // explaining why they cannot shorten URLs
    res.status(401).send("You need to be logged in to create new tiny URLs.");
    return;
  }
  console.log(req.body); // Log the POST request body to the console
  const longURL = req.body.longURL; // Get the longURL from the form data
  // Generate a unique id using the generateRandomString function
  const id = generateRandomString();
  // Save the id-longURL pair to the urlDatabase
  urlDatabase[id] = { longURL, userID: user.id };
  console.log(req.body); // Log the POST request body to the console
  console.log(urlDatabase); // Log the updated urlDatabase to the console
  res.redirect(`/urls/${id}`); // Redirect the user to the newly created short URL page
});

app.post("/urls/:id/delete", isLoggedInFeatures, (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    // If the user is not logged in, respond with an error message
    res.status(401).send("Please log in or register to delete this URL.");
    return;
  }
  const id = req.params.id;
  if (!urlDatabase[id]) {
    // If the URL with the given ID does not exist, respond with a 404 error
    res.status(404).send("URL not found.");
    return;
  }
  if (urlDatabase[id].userID !== user.id) {
    // If the URL does not belong to the logged-in user, respond with an error message
    res.status(403).send("You do not have permission to delete this URL.");
    return;
  }
  // If the user is logged in and owns the URL, delete the URL from the urlDatabase
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL; // Get the new longURL from the form data
  // Check if the URL with the given ID exists in the urlDatabase
  if (urlDatabase[id]) {
    // Update the longURL for the given ID with the new value
    urlDatabase[id].longURL = newLongURL;
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
  const user = getUserByEmail(email, users);
  if (!user) {
    res.status(403).send("User not found.");
    return;
  }
  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (passwordMatch) {
    req.session.user_id = user.id; // Set the user_id in the session
    res.redirect("/urls");
  } else {
    res.status(403).send("Incorrect password.");
  }
});

// Middleware to set the username in res.locals
app.use((req, res, next) => {
  res.locals.user = users[req.session.user_id] || null;
  next();
});

app.post("/logout", (req, res) => {
  //res.clearCookie("user_id");
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
  res.redirect("/login");
});
