const express = require("express");
const request = require("request");
// const mongoose = require("mongoose");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { check, validationResult } = require("express-validator");
const { route } = require("./users");

/**
 * https://mongoosejs.com/docs/index.html
 */

// @route   GET api/profile/me
// @desc    Get current users profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private
router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required").not().isEmpty(),
      check("skills", "Skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // destructuring the request
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    //build profile object
    const profileFields = {};

    profileFields.user = req.user.id;

    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills
        .split(",")
        .map((skill) => skill.trim().toUpperCase());
    }

    // build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        //update profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      profile = new Profile(profileFields);
      await profile.save();
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Sever error");
    }
  }
);

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);

    res.json(profiles);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Sever error");
  }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by id
// @access  Public

router.get('/user/:user_id', async (req, res) => {
  try {

    /**
     * to be more precise cast user_id to a new ObjectId()
     * if it changes then it was invalid but if it was valid it wont change..
     * https://stackoverflow.com/questions/13850819/can-i-determine-if-a-string-is-a-mongodb-objectid
     */
    // const OId = mongoose.Types.ObjectId;
    // if (!OId.isValid(req.params.user_id)) {
    //   return res.status(400).json({ msg: 'Profile not found..' })
    // }
    const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found..' });
    }

    res.json(profile);

  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found..' });
    }
    res.status(500).send("Sever error");
  }
});

// @route   DELETE api/profile
// @desc    Delete profile, user & posts
// @access  Private

router.delete('/', auth, async (req, res) => {
  try {

    // @TODO - remove users posts

    // Remove profile
    // const profile = await Profile.findOne({ user: req.user.id });
    // await Profile.findByIdAndRemove({ _id: profile.id });
    // await User.findByIdAndRemove({ _id: req.user.id });

    await Profile.findOneAndRemove({ user: req.user.id });

    // Remove user mongoose ^5.11.15 not working
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'User removed..' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Sever error");
  }
});

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  

router.put('/experience', [auth, [
  check('title', 'Title is required')
    .not()
    .isEmpty();
check('company', 'Company is required')
  .not()
  .isEmpty();
check('from', 'From date is required')
  .not()
  .isEmpty();
]], async (req, res) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Sever error");
  }
})

module.exports = router;
