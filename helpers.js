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


module.exports = {getUserByEmail, generateRandomString, urlsForUser, isLoggedInFeatures, isLoggedInUrls};