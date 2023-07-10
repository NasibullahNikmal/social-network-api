const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// Get my profile
router.get('/me', auth, async (req, res) => {
    try {
        let profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'email', 'avatar'])

        if (!profile) {
            return res.status(400).json({ errors: [{ msg: "There is no profile for this user" }] });
        }

        res.json(profile)
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})

// create and update profile
router.post('/', [auth,
    check('status', "Please define your status").not().isEmpty(),
    check('skills', "Skills are required").not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const {
            company,
            website,
            location,
            status,
            skills,
            bio,
            githubUserName,
            youtube,
            twitter,
            facebook,
            linkedin,
            instagram
        } = req.body;

        const profileFiels = {};
        profileFiels.user = req.user.id;
        if (company) profileFiels.company = company;
        if (website) profileFiels.website = website;
        if (location) profileFiels.location = location;
        if (status) profileFiels.status = status;
        if (skills) profileFiels.skills = skills.split(',').map(skill => skill.trim())
        if (bio) profileFiels.bio = bio;
        if (githubUserName) profileFiels.githubUserName = githubUserName;
        profileFiels.social = {};
        if (youtube) profileFiels.social.youtube = youtube;
        if (twitter) profileFiels.social.twitter = twitter;
        if (facebook) profileFiels.social.facebook = facebook;
        if (linkedin) profileFiels.social.linkedin = linkedin;
        if (instagram) profileFiels.social.instagram = instagram;

        let profile = await Profile.findOne({ user: req.user.id })

        if (profile) {
            profile = await Profile.findOneAndUpdate({ user: req.user.id }, profileFiels, { new: true })
            return res.json(profile)
        }

        profile = new Profile(profileFiels);
        profile.save();
        res.send(profile);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
})

// get all profiles
router.get('/profiles', auth, async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'email', 'avatar']);

        res.status(200).json(profiles);
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});

// get profile by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.id }).populate('user', ['name', 'email', 'avatar'])

        if (!profile) return res.status(400).json({ errors: [{ msg: 'Profile not found' }] });

        res.status(200).json(profile);
    } catch (error) {
        if (error.kind == 'ObjectId') return res.status(400).json({ errors: [{ msg: 'Profile not found' }] });
        console.log(error)
        res.status(500).send('Server error');
    }
})

// delete profile and user
router.delete('/:id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOneAndDelete({ user: req.params.id });

        if (!profile) return res.status(400).json({ errors: [{ msg: 'Profile not found' }] })

        await User.findOneAndDelete({ _id: req.params.id });

        res.status(200).json("Deleted");
    } catch (error) {
        if (error.kind == 'ObjectId') return res.status(400).json({ errors: [{ msg: 'Profile not found' }] });
        console.log(error);
        res.status(500).send('Server error');
    }
})

// add profile experience
router.put('/experience', [auth,
    check('title', 'Enter title').not().isEmpty(),
    check('company', 'Enter company').not().isEmpty(),
    check('location', 'Enter location').not().isEmpty(),
    check('from', 'Enter from date').not().isEmpty(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(201).json({ errors: errors.array() });
        }

        let experience = await Profile.findOne({ user: req.user.id });

        experience.experience.unshift(req.body);

        await experience.save();
        res.status(200).json(experience);
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
})

// delete profile experience
router.delete('/experience/:id', auth, async (req, res) => {
    try {

        const profile = await Profile.findOne({ user: req.user.id });

        const indexToRemove = profile.experience.map(item => item.id).indexOf(req.params.id);

        if (indexToRemove < 0) return res.status(400).json({ errors: [{ msg: 'Experience not fount' }] })

        profile.experience.splice(indexToRemove, 1);

        await profile.save()
        res.status(200).json(profile);
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
})

// add profile education
router.put('/education', [auth,
    check('school', 'Enter school').not().isEmpty(),
    check('degree', 'Enter degree').not().isEmpty(),
    check('fieldOfStudy', 'Enter fieldOfStudy').not().isEmpty(),
    check('from', 'Enter from date').not().isEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(201).json({ errors: errors.array() });
        }

        const profile = await Profile.findOne({ user: req.user.id });
        if (!profile) return res.status(400).json({ errors: [{ msg: 'Profile not found' }] })
        profile.education.unshift(req.body);
        await profile.save();

        res.status(200).json(profile);
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
})

// delete profile education
router.delete('/education/:id', auth, async (req, res) => {
    try {

        const profile = await Profile.findOne({ user: req.user.id });
        if (!profile) return res.status(400).json({ errors: [{ msg: 'Profile not found' }] });

        const indexToRemove = profile.education.map(item => item.id).indexOf(req.params.id);
        if (indexToRemove < 0) return res.status(400).json({ errors: [{ msg: 'Education not found' }] });

        profile.education.splice(indexToRemove, 1);
        await profile.save();

        res.status(200).json(profile);
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
})

module.exports = router;