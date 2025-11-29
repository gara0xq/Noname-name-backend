const express = require('express')
require("dotenv").config()
const connectDB = require('./API/config/db')
const userRoutes = require('./API/features/user/routes/user_route');
const app = express()

app.use(express.json())
connectDB()

app.use('/user', userRoutes);

app.listen(process.env.port , ()=>console.log("server running"))

