/*
Server wihtout api.market middleware
Accessing the api.market checkOreAcessToken directly
*/
require('dotenv').config()
const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const {
    checkOreAccessToken
} = require('../lib/server')

const app = express()
const PORT = process.env.PORT || 8080


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(cookieParser())

const handler = async (req, res) => {

    if (!req.headers['ore-access-token']) {
        return res.status(401).json({
            message: "ore-access-tokennot found"
        })
    }
    if (checkOreAccessToken(req.headers['ore-access-token'], req)) {
        return res.json({
            x: req.body.x + 1
        })
    } else {
        return res.status(401).json({
            message: "ore-access-tokenis invalid"
        })
    }
}

app.post('/', handler)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
})

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))