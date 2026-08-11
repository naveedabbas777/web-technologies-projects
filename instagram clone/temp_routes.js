
// PUT /api/users/profile - Update user profile
router.put('/users/profile', authMiddleware, async (req, res) => {
  const { bio } = req.body;
  let profilePicturePath = null;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (req.files && req.files.profilePicture) {
      const profilePicture = req.files.profilePicture;
      const imageName = `${user._id}-${Date.now()}${path.extname(profilePicture.name)}`;
      profilePicturePath = `/images/profile_pictures/${imageName}`;

      const uploadPath = path.join(__dirname, '../public/images/profile_pictures');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      profilePicture.mv(path.join(uploadPath, imageName), err => {
        if (err) {
          console.error('Error uploading profile picture:', err);
          return res.status(500).send('Error uploading profile picture');
        }
      });
    }

    user.bio = bio;
    if (profilePicturePath) {
      user.profilePicture = profilePicturePath;
    }
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// POST /api/users/:id/follow - Follow a user
router.post('/users/:id/follow', authMiddleware, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (userToFollow._id.equals(currentUser._id)) {
      return res.status(400).json({ msg: 'You cannot follow yourself' });
    }

    if (!userToFollow.followers.includes(currentUser._id)) {
      userToFollow.followers.push(currentUser._id);
      await userToFollow.save();
    }

    if (!currentUser.following.includes(userToFollow._id)) {
      currentUser.following.push(userToFollow._id);
      await currentUser.save();
    }

    res.json({ msg: `You are now following ${userToFollow.username}` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/users/:id/unfollow - Unfollow a user
router.post('/users/:id/unfollow', authMiddleware, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    userToUnfollow.followers = userToUnfollow.followers.filter(
      (followerId) => !followerId.equals(currentUser._id)
    );
    await userToUnfollow.save();

    currentUser.following = currentUser.following.filter(
      (followingId) => !followingId.equals(userToUnfollow._id)
    );
    await currentUser.save();

    res.json({ msg: `You have unfollowed ${userToUnfollow.username}` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/users/:id/followers - Get a user's followers
router.get('/users/:id/followers', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('followers', '_id username profilePicture');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user.followers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/users/:id/following - Get a user's following list
router.get('/users/:id/following', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('following', '_id username profilePicture');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user.following);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
