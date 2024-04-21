var express = require('express');
var router = express.Router();
var userModel = require('./users');
var postModel = require('./post');
const { name } = require('../app');
const passport = require('passport');
const localStrategy = require('passport-local');
const upload = require('./multer')


passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res, next) {
  res.render('login');
});
router.get('/register', function(req, res, next) {
  res.render('register');
});
router.get('/profile', isLoggedIn, async function(req, res, next) {
  const user = await userModel
  .findOne({username: req.session.passport.user})
  .populate('posts')
  res.render('profile', {user});
});

router.get('/add', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render('add', {user});
});

router.post('/createpost', isLoggedIn,upload.single('image'), async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  })

  user.posts.push(post._id);
  await user.save();
  res.redirect('profile');
});

router.post('/fileupload', isLoggedIn, upload.single('image'), async function(req, res, next) {
  try {
     const user = await userModel.findOne({username: req.session.passport.user});
     user.profileImage = req.file.filename;
     await user.save();
     res.redirect('profile');
  } catch (error) {
     console.error(error);
     res.status(500).send('Internal Server Error');
  }
});


router.post('/register', function(req, res, next) {
  const data = new userModel({
    username: req.body.username,
    // name: req.body.name,
    email: req.body.email,
    // password: req.body.password,
    profileImage: req.body.profileImage,
    contact: req.body.contact

  }) 
  userModel.register(data, req.body.password)
  .then(function(){
    passport.authenticate('local')(req, res, function(){
      res.redirect('/profile')
    })
  })
});

router.post('/login',passport.authenticate('local',{
  successRedirect: '/profile',
  failureRedirect: '/register'
}), function(req, res, next) {
});

router.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/register');
}

module.exports = router;
