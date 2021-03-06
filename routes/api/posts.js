const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const Post = require('../../models/Posts');
const Profile = require('../../models/Profile');
const validatePostInput = require('../../validation/post');

router.get('/test', (req, res) => res.json({ msg: 'Posts works!' }));

// @route Get api/posts
// @desc Create post
// @access Private

router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    const newPosts = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });
    newPosts.save().then(post => res.json(post));
  }
);

router.get('/', (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .populate('user', ['name'])
    .then(posts => {
      if (posts.length === 0) {
        return res.status(404).json({ nopostfound: 'no posts found' });
      } else return res.json(posts);
    })
    .catch(err => res.status(404).json({ nopostfound: 'no posts found' }));
});

router.get('/:id', (req, res) => {
  Post.findById(req.params.id)
    .populate('user', ['name'])
    .then(post => res.json(post))
    .catch(err =>
      res.status(404).json({ nopostfound: 'no post found on this id' })
    );
});

router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ notauthorize: 'User not authorize' });
          }
          post.remove().then(() => res.json({ success: true }));
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
    });
  }
);
router.post(
  '/like/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyliked: 'User already liked this post' });
          } else {
            // Add user id to likes array
            post.likes.unshift({ user: req.user.id });

            post.save().then(post => res.json(post));
          }
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
    });
  }
);
router.post(
  '/unlike/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ notliked: 'You have not yet like the post' });
          } else {
            // Add user id to likes array
            const removeIndex = post.likes
              .map(item => item.user.toString)
              .indexOf(req.user.id);
            post.likes.splice(removeIndex, 1);

            post.save().then(post => res.json(post));
          }
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
      // .catch(err=>console.log(err));
    });
  }
);

router.post(
  '/comment/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }
    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };

        post.comments.unshift(newComment);
        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: 'There is no post' }));
    // .catch(err=>console.log(err))
  }
);
router.delete(
  '/comment/:id/:comment_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res.status(404).json({ commentnotexist: 'comment not exist' });
        }
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        post.comments.splice(removeIndex, 1);

        post.save().then(post => res.json(post));
      })
      //  .catch(err=>res.status(404).json({postnotfound:"There is no post"}))
      .catch(err => console.log(err));
  }
);

module.exports = router;
