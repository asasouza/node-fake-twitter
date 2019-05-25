const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const server = require('http').Server(app);

app.use(bodyParser.json());

app.get('/', (req, res, next) => {
	console.log(req);
	res.send('Teste');
});

server.listen(3000, () => console.log('Server Started'));
