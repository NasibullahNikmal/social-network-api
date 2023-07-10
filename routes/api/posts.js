const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Post = require('../../models/Post');

// Create post
router.post('/', [auth,
    check('text', 'Enter text').not().isEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const user = await User.findOne({ _id: req.user.id })
        let newPost = new Post({
            user: user._id,
            text: req.body.text,
            name: user.name,
            avatar: user.avatar
        })
        newPost = await newPost.save();

        res.status(201).json(newPost);
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
})

// Get all post
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 })

        res.status(200).json(posts);
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
})

// Get post by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const posts = await Post.findOne({ _id: req.params.id });

        res.status(200).json(posts);
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
})

// Delete post
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findOneAndDelete({ _id: req.params.id });

        res.status(200).json(post)
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
})

// like & unlike post
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.params.id });

        const liked = post.likes.filter(item => item.user.toString() === req.user.id).length > 0;
        if (liked) {
            const indexToRemove = post.likes.map(item => item.user.toString()).indexOf(req.user.id);
            post.likes.splice(indexToRemove, 1);
            await post.save();
            return res.status(200).json(post)
        }

        post.likes.unshift({ user: req.user.id })
        await post.save();

        return res.status(200).json(post)
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
})

// Add comment
router.post('/comment/:id', [auth,
    check('text', 'Enter text').not().isEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const user = await User.findOne({ _id: req.user.id });
        const post = await Post.findOne({ _id: req.params.id });

        post.comments.unshift({
            user: user._id,
            text: req.body.text,
            name: user.name,
            avatar: user.avatar
        })
        await post.save();

        res.status(201).json(post.comments)
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
})

// Delete comment
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.params.id });

        const indexToRemove = post.comments.map(item => item.id.toString()).indexOf(req.params.comment_id)
        if (indexToRemove < 0) return res.status(400).json({ msg: 'Comment not found' })
        post.comments.splice(indexToRemove, 1)
        await post.save()

        res.status(200).json(post.comments)
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
})

module.exports = router;