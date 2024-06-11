const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Users = require('../user-model'); // Correct path to the user model

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'username and password required' });
    }

    const existingUser = await Users.findBy({ username }).first();

    if (existingUser) {
      return res.status(400).json({ message: 'username taken' });
    }

    const hashedPassword = bcrypt.hashSync(password, 8); // Do not exceed 2^8 rounds
    const newUser = await Users.add({ username, password: hashedPassword });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login a user and generate a token
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'username and password required' });
    }

    const user = await Users.findBy({ username }).first();

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ userId: user.id }, process.env.SECRET || 'shh', {
        expiresIn: '1h',
      });
      console.log('Generated Token:', token); // Log the token
      console.log('User:', user); // Log user details
      res.status(200).json({ message: `welcome, ${user.username}`, token });
    } else {
      console.error('Invalid credentials for user:', username);
      res.status(401).json({ message: 'invalid credentials' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

module.exports = router;
