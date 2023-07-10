const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const User = require('../../models/User');
const auth = require('../../middleware/auth');

// Get api/auth
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(400).json({ errors: [{ msg: "Invalid Authentication" }] });
        }

        res.status(200).json(user)

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
})

// Authenticate user & get token
router.post('/', [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // check for user data in DB
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
        }


        // configuring user token using JWT
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload,
            config.get("jwtSecret"),
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        )

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
})

module.exports = router;