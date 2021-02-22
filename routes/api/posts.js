const express = require("express");
const router = express.Router();
const request = require("request");
const config = require("config");
const mongoose = require("mongoose");
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const Post = require("../../models/Post");
const { check, validationResult } = require("express-validator");
const { route } = require("./users");


// @route   POST api/posts
// @desc    Create post
// @access  Private
router.post("/", [auth, [
  check('text', 'Text is required')
    .not()
    .isEmpty(),
]], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id).select('-password');

    const newPost = new Post({
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    });

    const post = await newPost.save();
    res.json(post);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Sever error");
  }
});

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });

    if (!post) {
      return res.status(404).json({ success: false, errors: [{ msg: "No posts at all" }] });
    }

    res.json(posts);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Sever error");
  }
});

// @route   GET api/posts/:id
// @desc    Get a post by id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    console.log("hello");
    if (!post) {
      return res.status(404).json({ success: false, errors: [{ msg: "Post not found" }] });
    }

    res.json(post);

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, errors: [{ msg: "Post not found" }] });
    }
    res.status(500).send("Sever error");
  }
});

// @route   GET api/posts/:id
// @desc    Delete post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    console.log("hello");
    if (!post) {
      return res.status(404).json({ success: false, errors: [{ msg: "Post not found" }] });
    }

    //check if my post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, errors: [{ msg: "User not authorized" }] });
    }

    await post.remove();

    res.json({ msg: "Post removed" });

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, errors: [{ msg: "Post not found" }] });
    }
    res.status(500).send("Sever error");
  }
});

// @route   GET api/posts/me
// @desc    Get all my posts
// @access  Private
router.post('/me', auth, async (req, res) => {
  try {
    const posts = await Post.find().where({ user: req.user.id }).sort({ date: -1 });

    if (!posts) {
      return res.status(200).json({ success: true, message: [{ msg: "You don't have posts yet.." }] });
    }

    res.json(posts);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Sever error");
  }
});

// @route   POST api/posts/update
// @desc    Create post
// @access  Private
router.put("/update/:p_id", [auth, [
  check('text', 'Text is required')
    .not()
    .isEmpty(),
]], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    
    let post = await Post.findById({ _id: req.params.p_id });

    const oldPost = new Post({
      _id: req.params.p_id,
      text: req.body.text,
      date: post.date
    });

    if (!post) {
      return res.status(404).json({ success: false, errors: [{ msg: "Post not found" }] });
    }

    //check if my post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, errors: [{ msg: "User not authorized" }] });
    }

    if (post) {
      //update Post
      post = await Post.findOneAndUpdate(
        { _id: mongoose.Types.ObjectId(req.params.p_id) },
        { $set: oldPost },
        { new: true }
      );

      return res.json(post);
    }

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, errors: [{ msg: "Post not found" }] });
    }
    res.status(500).send("Sever error");
  }
});

module.exports = router;