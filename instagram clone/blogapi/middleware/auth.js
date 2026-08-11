const restrictToAuthenticated = (req, res, next) => {
  console.log('restrictToAuthenticated middleware: userId -', req.session ? req.session.userId : 'No Session', 'role -', req.session ? req.session.role : 'No Session');
  if (!req.session || !req.session.userId) {
    req.flash('error_msg', 'Please log in to view that resource');
    return res.redirect('/auth/login');
  }
  next();
};

const restrictToAdmin = (req, res, next) => {
  if (!req.session || !req.session.userId || req.session.role !== 'admin') {
    req.flash('error_msg', 'You do not have permission to view that resource');
    return res.redirect('/auth/login');
  }
  next();
};

module.exports = { restrictToAuthenticated, restrictToAdmin };
