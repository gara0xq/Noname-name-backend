const express = require('express')
const app = express()
const JWT = require('jsonwebtoken')

app.use(express.json())

const posts = [
    {
        username : 'abdelrhman',
        title : 'hello1'
    },
    {
        username : 'ali',
        title : 'hello2'
    },
    {
        username : 'hassan',
        title : 'hello3'
    }
]

app.get('/posts', (req, res)=>{
    res.json(posts)
})

app.listen(3000,()=>{console.log("server is running")})