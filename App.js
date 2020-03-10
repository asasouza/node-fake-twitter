// modules
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const mongoRateLimit = require('rate-limit-mongo');
const helmet = require('helmet');
// constants
const { MONGODB_URL } = require('./src/config/constants');

const app = express();
const server = require('http').Server(app);

const authRoutes = require('./src/routes/auth');
const tweetRoutes = require('./src/routes/tweet');
const userRoutes = require('./src/routes/user');

app.use('/uf', express.static('uf'));

//headers protection
app.use(helmet());

//rate limiter
app.use(rateLimit({
	max: 60,
	headers: false,
	store: new mongoRateLimit({
		uri: MONGODB_URL,
	}),
}));

app.use(bodyParser.json());

app.use(authRoutes);
app.use(tweetRoutes);
app.use(userRoutes);

// error handler
app.use((error, req, res, next) => {
	const { statusCode, message, data } = error;
	res.status(statusCode || 500).json({ message, data });
});

mongoose.connect(MONGODB_URL, { useNewUrlParser: true })
.then(() => {
	server.listen(3000, () => console.log('Server Started'));	
})
.catch(err => console.log(err));
