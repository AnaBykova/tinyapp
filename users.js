const bcrypt = require("bcryptjs");

const password = "purple-monkey-dinosaur"; // found in the req.body object
const hashedPassword = bcrypt.hashSync(password, 10);

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

module.exports = users;