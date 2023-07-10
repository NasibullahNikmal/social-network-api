const express = require("express");
const app = express();

// Port configuration
const port = process.env.PORT || 5000;

// Connect Database
const connectDB = require('./config/db');
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

// Configure Routes
app.use('/api/user', require('./routes/api/user'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/post', require('./routes/api/posts'));
app.use('/api/profile', require('./routes/api/profile'));

app.listen(port, () => { console.log(`Server running on port ${port} 🔥`) });