const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const users = require('./routes/api/users');
const profile = require('./routes/api/profile');
const posts = require('./routes/api/posts');
const passport = require('passport');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Connect to mongo db
mongoose
  .connect('mongodb://localhost:27017/SocialMediaApp', {
    useNewUrlParser: true
  })
  .then(() => console.log('Mongo db connected'))
  .catch(err => console.log(err));

app.use(passport.initialize());
require('./config/passport')(passport);

//Use routes
app.use('/api/users', users);
app.use('/api/profile', profile);
app.use('/api/posts', posts);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
