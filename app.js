const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const sampleRoutes = require('./routes/sample')
const { connectMongodb } = require('./mongodb')




const server = https.createServer({
  key:fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
  cert:fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem')),
}, app)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.json())
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin-content', (req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
});

app.get('/moderator-content', (req, res) => {
  res.sendFile(__dirname + '/public/moderator.html');
});

app.get('/user-content', (req, res) => {
  res.sendFile(__dirname + '/public/user.html');
});
app.use('/api', sampleRoutes)

const PORT = process.env.PORT || 3000



connectMongodb()
    .then(() => {
        server.listen(PORT, () => console.log(`Server running on PORT ${PORT}`))
    })
    .catch((error) => {
        console.error("Failed to connect to the Mongodb", error)
        process.exit(1)
    })