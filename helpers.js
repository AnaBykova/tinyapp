const { urlDatabase } = require('./database');
//const { users } = require('./express_server');

function getUserByEmail(email, database) {
  for (const userId in database) {
    if (database[userId].email === email) {
      return database[userId];
    }
  }
  return undefined;
}

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

function urlsForUser(id) {
  const filteredURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      filteredURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return filteredURLs;
}

const isLoggedInUrls = (users) => (req, res, next) => {
  const user = users[req.session.user_id];
  if (user) {
    res.redirect("/urls");
  } else {
    next();
  }
};

const isLoggedInFeatures = (users) => (req, res, next) => {
  const user = users[req.session.user_id];
  if (user) {
    next();
  } else {
    res.redirect("/login");
  }
};

// Middleware to check URL access
function checkURLAccess(req, res, next, users, urlDatabase) {
  const user = users[req.session.user_id];
  if (!user) {
    res.status(401).send("Please log in or register to perform this action.");
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

  next();
}

module.exports = {
  getUserByEmail, 
  generateRandomString, 
  urlsForUser, 
  isLoggedInFeatures, 
  isLoggedInUrls, 
  checkURLAccess};