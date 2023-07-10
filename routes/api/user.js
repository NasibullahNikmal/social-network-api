const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

router.post('/', [
    check('name', 'Please check your name').not().isEmpty(),
    check('email', 'Check your email').isEmail(),
    check('password', 'Check your password').isLength({ min: 6 })
], async (req, res) => {
    try {
        // Checking for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Process of saving user in
        const { name, email, password } = req.body;

        let user = await User.findOne({ email });

        // Check if user already exists
        if (user) {
            return res.status(400).json({ errors: [{ msg: "User already exists" }] })
        }

        const avatar = name[0];

        // Configuring user schema
        user = new User({
            name,
            email,
            avatar,
            password
        })

        // protecting password as a hashed
        user.password = await bcrypt.hash(password, 8);

        await user.save();

        // configuring user token using JWT
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload,
            config.get('jwtSecret'),
            (err, token) => {
                if (err) throw err;
                res.json({ token })
            })

    } catch (errors) {
        res.status(400).send('Server Error');
    }
})

module.exports = router;