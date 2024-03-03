const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.local' });
const {
    getLoginUser,
    createUser,
    checkEmailUnique,
    getAllUsersDB,
    getUserInfoFromDatabase,
    updateUser,
    deleteUser,
    getCarousel,
    createCarouselItem,
    updateCarouselItem,
    deleteCarouselItem
} = require('../mongodb');

const router = express.Router();
const secretKey = process.env.JWT_SECRET;

async function generateToken(user) {
    return jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
}

function authenticate(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Token not provided' });
    }
    try {
        const decoded = jwt.verify(token, secretKey);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(401).json({ message: 'Invalid token' });
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

router.get('/protected', authenticate, (req, res) => {
    res.json({ message: 'Protected route accessed successfully' });
});

router.get('/user-content', async (req, res) => {
    const email = req.query.email;
    try {
        const userInfo = await getUserInfoFromDatabase(email);
        if (userInfo) {
            res.json({ message: 'User info retrieved successfully', userInfo });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error retrieving user account', error);
        res.status(500).send('Error retrieving user account');
    }
});

router.post('/posts', async (req, res) => {
    const { title, content } = req.body;
    try {
        // Your MongoDB post creation logic here
        res.json({ message: 'Post created successfully', title, content });
    } catch (error) {
        console.error('Error creating post', error);
        res.status(500).send('Error creating post');
    }
});


router.post('/register', async (req, res) => {
    const { name, email, password, age, role, gender,  } = req.body;

    try {
        const isUnique = await checkEmailUnique(email);
        if (!isUnique) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        const user = await createUser(name, email, password, age, role, gender, );
        const token = await generateToken(user);
        res.json({ message: 'Registration successful', token });
    } catch (error) {
        console.error('Error registering user', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await getLoginUser(email);
        if (user) {
                const token = jwt.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET);
                res.cookie('token', token, { httpOnly: true, secure: true });
                if (user.role === 'admin') {
                    res.json({ message: 'Login successful as admin', token, redirectTo: '/admin-content' });
                } else if (user.role === 'moderator') {
                    res.json({ message: 'Login successful as moderator', token, redirectTo: '/moderator-content' });
                } else {
                    res.json({ message: 'Login successful as user', token, redirectTo: '/user-content' });
                }
            } 
        else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error logging in', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/users', async (req, res) => {
    try {
        const allUsers = await getAllUsersDB();
        res.json(allUsers);
    } catch (error) {
        console.error('Cannot connect to MongoDB:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/getUser/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const userInfo = await getUserInfoFromDatabase(email);
        if (userInfo) {
            res.json({ message: 'Get user info successful', userInfo });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error connecting to DB', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/checkEmailUnique/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const isUnique = await checkEmailUnique(email);
        res.json({ isUnique });
    } catch (error) {
        console.error('Error while checking email uniqueness:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/postUser', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await createUser(name, email, password);
        res.status(200).json({ message: 'User created successfully', user });
    } catch (error) {
        console.error('Error when creating user', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.patch('/patchUser/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, age, gender, role, } = req.body;
        const updated = await updateUser(id, name, email, age, gender, role);
        res.status(200).json({ message: 'User updated successfully', updated });
    } catch (error) {
        console.error('Error while updating user', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.delete('/deleteUser/:id',async (req,res)=>{
    try{
        const {id} = req.params
        const deleted=await deleteUser(id)
        res.status(200).json({message:'User deleted successfully',deleted})
    }
    catch(err)
    {
        console.error('Error : ',err)
        res.status(500).json({message:'Cant delete user'})
    }
})

//#region Carousel

router.get('/images', async (req,res)=>{
    try{
        const images= await getCarousel();
       // console.log(images);
        res.json(images)
    }
    catch(err){
        console.error('Error:',err)
    }
})
router.post('/image',async (req,res)=>{
    try{
        const {title,description,url}=req.body;
        const newImage=await createCarouselItem(title,description,url);
        res.json({message:'succesfull created image', newImage})
    }
    catch(err){
        console.error('Error:',err)
    }
})
router.patch('/updateImage/:id',async (req,res)=>{
    try{
        const {id}=req.params
        console.log(id)
        const {title,description,url}=req.body
        console.log(title,description,url)
        const newImage=await updateCarouselItem(id, title,description,url)
        res.json({message:'succesfull update of image',newImage})
    }
    catch(err){
        console.error('Error:',err)
    }
})
router.delete('/deleteImage/:id', async (req,res)=>{
    try{
        const {id}=req.params
        console.log(id)
        const delImage=await deleteCarouselItem(id) 
        res.json({message:'deleted successgully',delImage})
    }
    catch(err){
        console.error('Error:',err)
    }
})
//#endregion

module.exports = router;
