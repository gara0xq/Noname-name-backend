const express = require('express')

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const connectDB = require('./API/Config/db')
const userRoutes = require('./API/features/user/routes/user_route');
const app = express()

app.use(express.json())
connectDB()
app.get('/', (req, res)=> res.send("Welcome Here!"))
app.use('/user', userRoutes);

app.listen(process.env.port , ()=>console.log("server running"))

