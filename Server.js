const express = require('express')
require("dotenv").config()
const connectDB = require('./API/config/db')
const parentRoutes = require('./API/features/user/routes/parent/register_route');
const app = express()

app.use(express.json())
connectDB()
app.use('/', parentRoutes);

app.listen(process.env.port , ()=>console.log("server running"))

