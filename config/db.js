const mongoose = require('mongoose')
require('dotenv').config({
    path: 'variables.env'
})

const conectarDB = async ()=>{
    try {
        await mongoose.connect(process.env.DB_MONGO,{ 
            user: process.env.DB_MONGO_USER, 
            pass: process.env.DB_MONGO_PASSWORD,
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            authSource:'admin'
        })
        console.log('DB Conectada')
    } catch (error) {
        console.log('Hubo un error')
        console.log(error)
        process.exit(1)
    }
}

module.exports = conectarDB