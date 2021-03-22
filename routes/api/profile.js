const express = require("express");
const request = require("request");
const config = require("config");
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
// @access  Private
router.put('/experience', [auth, [
  check('title', 'Title is required')
    .not()
    .isEmpty(),
  check('company', 'Company is required')
    .not()
    .isEmpty(),
  check('from', 'From date is required')
    .not()
    .isEmpty(),
]], async (req, res) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    title,
    company,
    location,
    from,
    to,
    current,
    description
  } = req.body;

  const newExp = {
    title,
    company,
    location,
    from,
    to,
    current,
    description
  }

  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (profile.experience.length > 3) {
      return res.status(200).json({ success: false, errors: [{ msg: 'Sorry you can only have 4 experiences' }] });
    }

    profile.experience.unshift(newExp);

    await profile.save();

    res.json(profile);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Sever error");
  }
});

// @route   PUT api/profile/experience/update
// @desc    Update profile experience
// @access  Private
router.put('/experience/update/:ex_id', [auth, [
  check('title', 'Title is required')
    .not()
    .isEmpty(),
  check('company', 'Company is required')
    .not()
    .isEmpty(),
  check('from', 'From date is required')
    .not()
    .isEmpty(),
]], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    title,
    company,
    location,
    from,
    to,
    current,
    description
  } = req.body;

  const newExp = {
    _id: req.params.ex_id,
    title,
    company,
    location,
    from,
    to,
    current,
    description
  }

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    if (profile) {
      //update profile
      // console.log("Has profile", newExp);
      profile = await Profile.findOneAndUpdate(
        { "experience._id": req.params.ex_id },
        { $set: { 'experience.$': newExp } },
        { new: true }
      );
      return res.json(profile);
    }
    console.log("Has nothing");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Sever error");
  }
});


// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete profile experience
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    // Get remove index
    const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Sever error");
  }
});


// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
router.put('/education', [auth, [
  check('school', 'School is required')
    .not()
    .isEmpty(),
  check('degree', 'Degree is required')
    .not()
    .isEmpty(),
  check('fieldofstudy', 'Field of study is required')
    .not()
    .isEmpty(),
  check('from', 'From date is required')
    .not()
    .isEmpty(),
]], async (req, res) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description
  } = req.body;

  const newEdu = {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description
  }

  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (profile.education.length > 2) {
      return res.status(200).json({ success: false, errors: [{ msg: 'Sorry you can only have 3 education' }] });
    }

    profile.education.unshift(newEdu);

    await profile.save();

    res.json(profile);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Sever error");
  }
});


// @route   PUT api/profile/experience/update
// @desc    Update profile experience
// @access  Private
router.put('/education/update/:ed_id', [auth, [
  check('school', 'School is required')
    .not()
    .isEmpty(),
  check('degree', 'Degree is required')
    .not()
    .isEmpty(),
  check('fieldofstudy', 'Field of study is required')
    .not()
    .isEmpty(),
  check('from', 'From date is required')
    .not()
    .isEmpty(),
]], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description
  } = req.body;

  const newExp = {
    _id: req.params.ed_id,
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description
  }

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    if (profile) {
      //update profile
      // console.log("Has profile", newExp);
      profile = await Profile.findOneAndUpdate(
        { "education._id": req.params.ed_id },
        { $set: { 'education.$': newExp } },
        { new: true }
      );
      return res.json(profile);
    }
    console.log("Has nothing");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Sever error");
  }
});


// @route   DELETE api/profile/education/:edu_id
// @desc    Delete profile education
// @access  Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    
    // Get remove index
    const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Sever error");
  }
});

// @route   GET api/profile/github/:username
// @desc    Get user repos from guthub
// @access  Public
router.get('/github/:username', async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' }
    }

    await request(options, (error, response, body) => {
      if (error) {
        console.error(error)
        return res.status(404).json({ msg: 'No GitHub profile found' });
      };

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No GitHub profile found' });
      }

      res.json(JSON.parse(body));
    });


  } catch (err) {
    console.error(err.message);
    res.status(500).send("Sever error");
  }
});

module.exports = router;
