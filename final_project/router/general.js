const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const axios = require('axios');
const public_users = express.Router();


public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  // Check if username or password is missing
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  // Check if username already exists
  const userExists = users.some((user) => user.username === username);
  if (userExists) {
    return res.status(409).json({ message: "Username already exists. Please choose another." });
  }

  // Register the new user
  users.push({ username, password });

  return res.status(201).json({ message: "User registered successfully!" });
});

public_users.get('/', function (req, res) {
  // Return all books in the store as a pretty JSON string
  return res.status(200).send(JSON.stringify(books, null, 2));
});

public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;

  // Check if the book with the given ISBN exists
  if (books[isbn]) {
    return res.status(200).send(JSON.stringify(books[isbn], null, 2));
  } else {
    return res.status(404).json({ message: "Book not found" });
  }
});

  
public_users.get('/author/:author', function (req, res) {
  const author = req.params.author;
  const matchingBooks = [];

  // 1. Get all keys (ISBNs) from the books object
  const bookKeys = Object.keys(books);

  // 2. Iterate through books and check if author matches
  bookKeys.forEach((key) => {
    if (books[key].author.toLowerCase() === author.toLowerCase()) {
      // Include the ISBN in the response
      matchingBooks.push({ isbn: key, ...books[key] });
    }
  });

  if (matchingBooks.length > 0) {
    return res.status(200).send(JSON.stringify(matchingBooks, null, 2));
  } else {
    return res.status(404).json({ message: "No books found by this author" });
  }
});

public_users.get('/title/:title', function (req, res) {
  const title = req.params.title;
  const matchingBooks = [];

  // 1. Get all keys (ISBNs) from the books object
  const bookKeys = Object.keys(books);

  // 2. Iterate through books and check if title matches
  bookKeys.forEach((key) => {
    if (books[key].title.toLowerCase() === title.toLowerCase()) {
      // Include the ISBN in the response
      matchingBooks.push({ isbn: key, ...books[key] });
    }
  });

  if (matchingBooks.length > 0) {
    return res.status(200).send(JSON.stringify(matchingBooks, null, 2));
  } else {
    return res.status(404).json({ message: "No books found with this title" });
  }
});


public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;

  // Check if the book exists
  if (books[isbn]) {
    const reviews = books[isbn].reviews;
    return res.status(200).send(JSON.stringify(reviews, null, 2));
  } else {
    return res.status(404).json({ message: "Book not found" });
  }
});

public_users.get('/promise-books', function (req, res) {
  axios.get('http://localhost:5000/')
    .then(response => {
      return res.status(200).json(response.data);
    })
    .catch(error => {
      return res.status(500).json({ message: "Error fetching books", error: error.message });
    });
});

public_users.get('/async/isbn/:isbn', async (req, res) => {
  const isbn = req.params.isbn;
  try {
    const response = await axios.get(`http://localhost:5000/isbn/${isbn}`);
    res.status(200).send(response.data);
  } catch (error) {
    res.status(404).json({ message: "Book not found via async/await", error: error.message });
  }
});

public_users.get('/promise-author/:author', (req, res) => {
  const author = req.params.author;

  axios.get('http://localhost:5000/')
    .then(response => {
      const books = response.data;
      const matchingBooks = [];

      Object.keys(books).forEach(key => {
        if (books[key].author.toLowerCase() === author.toLowerCase()) {
          matchingBooks.push({ isbn: key, ...books[key] });
        }
      });

      if (matchingBooks.length > 0) {
        res.status(200).send(JSON.stringify(matchingBooks, null, 2));
      } else {
        res.status(404).json({ message: "No books found by this author (via Promise)" });
      }
    })
    .catch(error => {
      res.status(500).json({ message: "Error fetching data", error: error.message });
    });
});

public_users.get('/promise-title/:title', (req, res) => {
  const title = req.params.title.toLowerCase();

  axios.get('http://localhost:5000/')
    .then(response => {
      const books = response.data;
      const matchingBooks = [];

      Object.keys(books).forEach((key) => {
        if (books[key].title.toLowerCase() === title) {
          matchingBooks.push({ isbn: key, ...books[key] });
        }
      });

      if (matchingBooks.length > 0) {
        res.status(200).send(JSON.stringify(matchingBooks, null, 2));
      } else {
        res.status(404).json({ message: "No books found with this title (via Promise)" });
      }
    })
    .catch(error => {
      res.status(500).json({ message: "Error fetching books", error: error.message });
    });
});


module.exports.general = public_users;
