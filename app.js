require('dotenv').config()
require('express-async-errors')
const express = require('express')
const userRouter = require('./route/user')
const actorRouter = require('./route/actors')
const movieRouter = require('./route/movies')
const reviewRouter = require('./route/review')
const adminRouter = require('./route/admin')
const cors = require('cors')
require('./db/conn')
const {handleError} = require('./middleware/error')
const { handleNotFound } = require('./utils/helper')

const app = express()
app.use(cors())
app.use(express.json())
app.use("/api/user", userRouter)
app.use("/api/actor", actorRouter)
app.use("/api/movie", movieRouter)
app.use("/api/review", reviewRouter)
app.use("/api/admin", adminRouter)

app.use('/*', handleNotFound)

app.use(handleError)

app.listen(8000, () => {
    console.log("Listening to port no. " + 8000)
})