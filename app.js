const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const session = require('express-session');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const port = 3000;
const jwt = require('jsonwebtoken');



const sslServer = https.createServer({
  key:fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
  cert:fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem')),
}, app)



app.use(cors());
const axios = require('axios');
const { log } = require('console');
const { Certificate } = require('crypto');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'gersgers44',
  port: 5433,
});
app.use(session({
  secret: 'gersgers44',
  resave: true,
  saveUninitialized: true,
}));

app.use(session({ 
  name: 'sessionId', 
  secret: 'aBcDeFgHiJ', 
  resave: false, 
  saveUninitialized: true, 
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days 
}));




app.use(authenticateUser);



// const secretKey = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';
// const authenticateToken = (req, res, next) => {
//   const token = req.headers['authorization'];
//   if (!token) return res.status(401).send('Access Denied');

//   jwt.verify(token, secretKey, (err, user) => {
//     if (err) return res.status(403).send('Invalid Token');
//     req.user = user;
//     next();
//   });
// };



app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});







app.post('/register', authenticateUser,async (req, res, next) => {
  const { username, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const query = 'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *';
  const values = [username, email, hashedPassword, role];

  try {
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error registering user');
  }
});

app.post('/login', authenticateUser,async (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = $1';
  const values = [username];
  try {
    const result = await pool.query(query, values);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        req.session.user = { id: user.id, role: user.role };

        if (user.role === 'admin') {
          res.redirect('/admin-content');
        } else if (user.role === 'moderator') {
          res.redirect('/moderator-content');
        } else if (user.role === 'user') {
          res.redirect('/user-content');
        }
      } else {
        res.status(401).send('Invalid password');
      }
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error during login');
  }
});

async function authenticateUser(req, res, next) {
  try {
    if (req.session.user) {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.user.id]);

      if (result.rows.length > 0) {
        req.user = result.rows[0];
      } else {
        req.user = null;
      }
    } else {
      req.user = null;
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).send('Error during authentication');
  }
}
function roleAuthorization(roles) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).send('Unauthorized');
    }
  };
}

app.get('/admin-content', authenticateUser,roleAuthorization(['admin']), (req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
});

app.get('/moderator-content', authenticateUser,roleAuthorization(['admin', 'moderator']), (req, res) => {
  res.sendFile(__dirname + '/public/moderator.html');
});

app.get('/user-content', authenticateUser,roleAuthorization(['admin', 'moderator', 'user']), (req, res) => {
  res.sendFile(__dirname + '/public/user.html');
});
app.use(express.static('public'));




app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT username, email FROM users');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving users');
  }
});
app.delete('/users/:username', async (req, res) => {
  const username = req.params.username;
  try {
    await pool.query('DELETE FROM users WHERE username = $1', [username]);
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting user');
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});





app.get('/user-content', async (req, res) => {
  const username = req.query.username;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    res.send(`User: ${user.username}, Email: ${user.email}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving user account');
  }
});





app.post('/posts', async (req, res) => {
  const { title, content } = req.body;
  try {
    const result = await pool.query('INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING *', [title, content]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating post');
  }
});


app.put('/edit', (req, res) => { 
  const { newUsername, newEmail } = req.body; 
  const loggedInUsername = req.session.user.username; 
 
  pool.query('UPDATE users SET username = $1, email = $2 WHERE username = $3', [newUsername, newEmail, loggedInUsername]) 
      .then(() => { 
          req.session.user.username = newUsername; 
          res.json({ success: true, newUsername, newEmail }); 
      }) 
      .catch(error => { 
          console.error('Error updating user profile:', error); 
          res.status(500).json({ success: false, error: 'Error updating user profile' }); 
      }); 
});



















sslServer.listen(port, () => {
  console.log(`Server is running on https://localhost:${port}`);
});









// app.post('/comment', async (req, res, next) => {
//   const { text } = req.body;

//   const query = 'INSERT INTO comments (text) VALUES ($1) RETURNING *';
//   const values = [text];

//   try {
//     const result = await pool.query(query, values);
//     res.json(result.rows[0]);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Failed to save comment');
//   }
// });






// // User Endpoint
// app.get('/comments/:username', async (req, res) => {
//   const username = req.params.username;
//   try {
//     const result = await pool.query('SELECT c.text FROM comments c INNER JOIN users u ON c.user_id = u.id WHERE u.username = $1', [username]);
//     res.json(result.rows);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error retrieving comments');
//   }
// });


// // Admin Endpoint
// app.delete('/delete-comment/:username', authenticateUser, async (req, res) => {
//   const username = req.params.username;
//   const userId = req.user.id; // Assuming req.user contains user information
//   try {
//     await pool.query('DELETE FROM comments WHERE user_id = $1 AND username = $2', [userId, username]);
//     res.sendStatus(204);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error deleting comment');
//   }
// });
