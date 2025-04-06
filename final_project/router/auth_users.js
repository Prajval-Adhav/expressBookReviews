const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  // Check if the username already exists
  return users.some(user => user.username === username);
}

const authenticatedUser = (username, password) => {
  // Check if the username and password match an entry
  return users.some(user => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  // Check if user exists and password matches
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password." });
  }

  // Generate JWT
  const accessToken = jwt.sign({ username }, 'access', { expiresIn: '1h' });

  // Save to session
  req.session.authorization = {
    accessToken,
    username
  };

  return res.status(200).json({ message: "Login successful!" });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.body.review;
  const username = req.session?.authorization?.username;

  // Validate user and review
  if (!username) {
    return res.status(401).json({ message: "User not logged in." });
  }

  if (!review) {
    return res.status(400).json({ message: "Review content is required in the request body." });
  }

  // Check if the book exists
  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found." });
  }

  // Add or update the user's review
  books[isbn].reviews[username] = review;

  return res.status(200).json({
    message: "Review submitted successfully.",
    reviews: books[isbn].reviews
  });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization?.username;

  // Check if the book exists
  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found." });
  }

  const book = books[isbn];

  // Check if the review exists for the logged-in user
  if (!book.reviews || !book.reviews[username]) {
    return res.status(404).json({ message: "No review by this user for this book." });
  }

  // Delete the user's review
  delete book.reviews[username];

  return res.status(200).json({ message: "Review deleted successfully." });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
