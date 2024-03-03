const { MongoClient } = require('mongodb')
const { ObjectId } = require('mongodb');

const uri = "mongodb://localhost:27017/webFinal"

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function connectMongodb() {
    try {
        await client.connect()
        console.log("Connected to Mongodb")
        return client
    }
    catch (error) {
        console.error("Failed to connect to Mongodb", error)
        throw error
    }
}





async function createUser(name, email, password, age, role, gender) {
    try {
        if (!name || !email || !password || !age || !role || !gender)
            throw new Error('Missing required parametres')
        const database = client.db('webFinal')
        const collection = database.collection('users')
        const result = await collection.insertOne({ name, email, password, age, role, gender })

        if (result.acknowledged)
            console.log('You succesfully create user')
        else
            throw Error('No domunets inserted')
            return getUserInfoFromDatabase(email)
    }
    catch (error) {
        console.error('Error while creating new user', error)
    }
}





async function getLoginUser(loginEmail) {
    try {
        const database = client.db('webFinal');
        const collection = database.collection('users');
        const user = await collection.findOne({ email: loginEmail });
        return user;
    }
    catch (error) {
        console.error('Error while getting users for login from db', error)
        throw error
    }
}
async function getUserInfoFromDatabase(loginEmail) {
    console.log(loginEmail);
    try {
        const database = client.db('webFinal');
        const collection = database.collection('users');
        const user = await collection.findOne({ email: loginEmail });
        console.log(user);
        return user;
    } catch (error) {
        console.error('Error while getting users for login from db', error);
        throw error;
    }
}

async function getAllUsersDB(){
    try{
        const database=client.db('webFinal')
        const collection= database.collection('users')
        const result = await collection.find().toArray()
        return result
    }
    catch(error){
        console.error('error in db', error)
    }
}


async function checkEmailUnique(email) {
    try {
        const database = client.db('webFinal');
        const collection = database.collection('users');
        const existingUser = await collection.findOne({ email });
        return !existingUser; 
    } catch (error) {
        console.error('Error while checking email uniqueness:', error);
        throw error;
    }
}

async function updateUser(id,name,email,age,gender,role){
    try{
        console.log(id,name,email,age,gender,role)
        const database=client.db('webFinal')
        const collection=database.collection('users')
        const Id= new ObjectId(id)
        const updateItem=await collection.updateOne({_id:Id},{$set:{name:name,email:email,age:age,gender:gender,role:role}})
        return updateItem.modifiedCount > 0;
    }
    catch(err){
        console.error('Error: ',err)
    }
}

async function deleteUser(id){
    try{
        const database=client.db('webFinal')
        const collection=database.collection('users')
        const Id= new ObjectId(id)
        const deleteUser=await collection.deleteOne({_id:Id})
        return deleteUser.deletedCount > 0;
    }
    catch(err)
    {
        console.error('Error :',err)
        throw err;
    }
}


async function getCarousel(){
    try{
        const database = client.db('webFinal')
        const collection=database.collection('carousel')
        const allImages= await collection.find().toArray()
        return allImages
    }
    catch(err)
    {
        console.error('Error:',err)
        throw err;
    }
} 

async function createCarouselItem(title,description,url){
    try{
        const database=client.db('webFinal')
        const collection=database.collection('carousel')
        const createItem= await collection.insertOne({title,description,url})
        if (createItem.acknowledged)
        console.log('You successfully created the task');
        else
        throw Error('No documents inserted');
        return createItem
    }
    catch(err)
    {
        console.error('Error: ',err)
        throw err
    }
}

async function updateCarouselItem(id,title,description,url){
    try{
        console.log(id)
        const database=client.db('webFinal')
        const collection=database.collection('carousel')
        const Id= new ObjectId(id)
        const updateItem=await collection.updateOne({_id:Id},{$set:{title:title,description:description,url:url}})
        return updateItem.modifiedCount > 0;
    }
    catch(err)
    {
        console.error('Error: ',err)
        throw err
    }
}

async function deleteCarouselItem(id){
    try{
        const database=client.db('webFinal')
        const collection=database.collection('carousel')
        const Id=new ObjectId(id)
        const deleteItem=await collection.deleteOne({_id: Id})
        return deleteItem.deletedCount > 0
    }
    catch(Err){
        console.log('Error: ',Err)
        throw Err
    }
}

module.exports = { connectMongodb,  getLoginUser,createUser,checkEmailUnique,getAllUsersDB,getUserInfoFromDatabase,updateUser,deleteUser,getCarousel,createCarouselItem,updateCarouselItem,deleteCarouselItem}