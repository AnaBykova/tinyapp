const express = require("express");
const app = express();
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

app.use(express.urlencoded({ extended: true }));

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
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  //const templateVars = { id: req.params.id, longURL: urlDatabase[id] };
  //res.render("urls_show", templateVars);
  const id = req.params.id;
  const longURL = urlDatabase[id];
  const templateVars = { id: id, longURL: longURL };
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
  const username = req.body.username; // Get the username from the request body

  // Set the "username" cookie with the value from the form data
  res.cookie("username", username);

  // Redirect the browser back to the /urls page
  res.redirect("/urls");
});