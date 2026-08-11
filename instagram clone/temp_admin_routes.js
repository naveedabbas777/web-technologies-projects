
// Admin routes
router.get('/admin/users', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.put('/admin/users/:id/role', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        user.role = req.body.role;
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/admin/posts', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const posts = await Post.find().populate('author', 'username').sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.delete('/admin/posts/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        if (post.image) {
            fs.unlink(path.join(__dirname, '../public', post.image), err => {
                if (err) console.error(err);
            });
        }
        await post.deleteOne();
        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/admin/comments', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const comments = await Comment.find().populate('author', 'username').sort({ createdAt: -1 });
        res.json(comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.delete('/admin/comments/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }
        await comment.deleteOne();
        res.json({ msg: 'Comment removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
