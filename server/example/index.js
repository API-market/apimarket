require('dotenv').config()
const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const {
    apiMarketRequestValidator
} = require('../lib/server')

const app = express()
const PORT = process.env.PORT || 8080


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(cookieParser())
app.use(apiMarketRequestValidator())

const handler = async (req, res) => {
    res.json({
        x: req.body.x + 1
    })
}

app.post('/', handler)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
})

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))