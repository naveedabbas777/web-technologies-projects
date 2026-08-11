var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const cors = require('cors');
const appLogger = require('./utils/logger');
var morgan = require('morgan');
var session = require('express-session');
var MongoStore = require('connect-mongo').default;
var fileUpload = require('express-fileupload');
var requestLogger = require('./middleware/logger');
var flash = require('connect-flash');
var mongoose = require('mongoose');
// var expressLayouts = require('express-ejs-layouts');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var postsRouter = require('./routes/posts');
var commentsRouter = require('./routes/comments');
var videosRouter = require('./routes/videos'); // New video router
var apiRouter = require('./routes/api'); // API router

var app = express();

// Enable CORS for frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  credentials: true
}));



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// app.use(expressLayouts);
// app.set('layout', 'layout');

// Enable morgan only for request-level tracing or debug
if (appLogger.getLevel() === 'requests' || appLogger.getLevel() === 'debug') {
  app.use(morgan('dev'));
  appLogger.info('HTTP request logging enabled (morgan)');
} else {
  appLogger.debug('HTTP request logging disabled (LOG_LEVEL=%s)', appLogger.getLevel());
}

// Force request logging when explicitly requested via env
if (process.env.LOG_REQUESTS === 'true') {
  appLogger.info('Request-level logging forced via LOG_REQUESTS=true');
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// request logger: placed after body parsing so req.body is available
app.use(requestLogger);

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
appLogger.debug('Initializing express-session middleware...');
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({
    mongoUrl: 'mongodb://127.0.0.1:27017/instagram-clone',
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 days. Default
  }),
  cookie: { secure: false } // Set to false for HTTP development. Set to true for HTTPS in production.
}));
appLogger.debug('express-session middleware initialized.');

// Connect Flash
app.use(flash());

// Global variables for flash messages
app.use((req, res, next) => {
  if (req.method !== 'OPTIONS') {
    appLogger.debug('res.locals middleware: Session ID - %s userId - %s role - %s', req.sessionID, req.session ? req.session.userId : 'none', req.session ? req.session.role : 'none');
  }
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.session && req.session.userId ? new mongoose.Types.ObjectId(req.session.userId) : null;
  res.locals.role = req.session ? req.session.role : null; // Make user role available to all views
  next();
});

// File upload middleware
app.use(fileUpload());

// Use routes
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/posts', postsRouter);
app.use('/comments', commentsRouter);
app.use('/videos', videosRouter); // New video routes
app.use('/api', apiRouter); // API routes

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
