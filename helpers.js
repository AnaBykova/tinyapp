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

// Function to handle URL not found errors
const handleUrlNotFound = (req, res, next) => {
  const id = req.params.id;
  if (!urlDatabase[id] || !urlDatabase[id].longURL) {
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
  next();
};

// Function to check ownership and handle permissions check for URLs
const checkUrlOwnership = (users) => (req, res, next) => {
  const id = req.params.id;
  const user = users[req.session.user_id];
  if (urlDatabase[id].userID !== user.id) {
    res.status(403).send("You do not have permission to view this URL.");
    return;
  }
  next();
};

module.exports = {
  getUserByEmail, 
  generateRandomString, 
  urlsForUser, 
  isLoggedInFeatures, 
  isLoggedInUrls, 
  handleUrlNotFound,
  checkUrlOwnership };