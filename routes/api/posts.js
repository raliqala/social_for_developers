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
router.post(
  "/",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Sever error");
    }
  }
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });

    if (!posts) {
      return res
        .status(404)
        .json({ success: false, errors: [{ msg: "No posts at all" }] });
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
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    console.log("hello");
    if (!post) {
      return res
        .status(404)
        .json({ success: false, errors: [{ msg: "Post not found" }] });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res
        .status(404)
        .json({ success: false, errors: [{ msg: "Post not found" }] });
    }
    res.status(500).send("Sever error");
  }
});

// @route   GET api/posts/:id
// @desc    Delete post
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, errors: [{ msg: "Post not found" }] });
    }

    //check if my post
    if (post.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ success: false, errors: [{ msg: "User not authorized" }] });
    }

    await post.remove();

    res.json({ msg: "Post removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res
        .status(404)
        .json({ success: false, errors: [{ msg: "Post not found" }] });
    }
    res.status(500).send("Sever error");
  }
});

// @route   GET api/posts/me
// @desc    Get all my posts
// @access  Private
router.post("/me", auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .where({ user: req.user.id })
      .sort({ date: -1 });

    if (!posts) {
      return res.status(200).json({
        success: true,
        message: [{ msg: "You don't have posts yet.." }],
      });
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
router.put(
  "/update/:p_id",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      let post = await Post.findById({ _id: req.params.p_id });
      //TODO update here
      const oldPost = {
        _id: req.params.p_id,
        text: req.body.text,
        date: post.date,
      };

      if (!post) {
        return res
          .status(404)
          .json({ success: false, errors: [{ msg: "Post not found" }] });
      }

      //check if my post
      if (post.user.toString() !== req.user.id) {
        return res
          .status(401)
          .json({ success: false, errors: [{ msg: "User not authorized" }] });
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
      if (err.kind === "ObjectId") {
        return res
          .status(404)
          .json({ success: false, errors: [{ msg: "Post not found" }] });
      }
      res.status(500).send("Sever error");
    }
  }
);

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(200).json({
        success: true,
        message: [{ msg: "Sorry this post does not exist.." }],
      });
    }

    // check if user already liked post
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(404).json({
        success: false,
        errors: [{ msg: "Sorry already liked this post.." }],
      });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        errors: [{ msg: "Sorry this post does not exist.." }],
      });
    }
    res.status(500).send("Sever error");
  }
});

// @route   PUT api/posts/unlike/:id
// @desc    Like a post
// @access  Private
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(200).json({
        success: true,
        message: [{ msg: "Sorry this post does not exist.." }],
      });
    }

    // check if user already liked post
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(404).json({
        success: false,
        errors: [{ msg: "Sorry has not liked this post yet.." }],
      });
    }

    // Get remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        errors: [{ msg: "Sorry has not liked this post yet.." }],
      });
    }
    res.status(500).send("Sever error");
  }
});

// @route   POST api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
router.post(
  "/comment/:id",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(200).json({
          success: true,
          message: [{ msg: "Sorry this post does not exist.." }],
        });
      }

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") {
        return res.status(404).json({
          success: false,
          errors: [{ msg: "Sorry has not liked this post yet.." }],
        });
      }
      res.status(500).send("Sever error");
    }
  }
);

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete comment
// @access  Private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(200).json({
        success: true,
        message: [{ msg: "Sorry this post does not exist.." }],
      });
    }

    // Get remove index
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    // check if comment exist
    if (!comment) {
      return res.status(404).json({
        success: false,
        errors: [{ msg: "Sorry comment does not exists.." }],
      });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        errors: [{ msg: "Sorry unauthorized.." }],
      });
    }

    // Get remove index
    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        errors: [{ msg: "Sorry this post does not exist.." }],
      });
    }
    res.status(500).send("Sever error");
  }
});

// @route   UPDATE api/posts/comment/update/:id/:comment_id
// @desc    Create post
// @access  Private
router.put(
  "/comment/update/:id/:comment_id",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      let post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(200).json({
          success: true,
          message: [{ msg: "Sorry this post does not exist.." }],
        });
      }

      // Get remove index
      const comment = post.comments.find(
        (comment) => comment.id === req.params.comment_id
      );

      // check if comment exist
      if (!comment) {
        return res.status(404).json({
          success: false,
          errors: [{ msg: "Sorry comment does not exists.." }],
        });
      }

      if (comment.user.toString() !== req.user.id) {
        return res.status(401).json({
          success: false,
          errors: [{ msg: "Sorry unauthorized.." }],
        });
      }

      const oldComment = {
        _id: req.params.comment_id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
        date: comment.date,
      };

      //update Post
      post = await Post.findOneAndUpdate(
        { "comments._id": req.params.comment_id },
        { $set: { "comments.$": oldComment } },
        { new: true }
      );

      return res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") {
        return res
          .status(404)
          .json({ success: false, errors: [{ msg: "Post not found" }] });
      }
      res.status(500).send("Sever error");
    }
  }
);

module.exports = router;
