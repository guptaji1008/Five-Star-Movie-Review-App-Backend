const router = require('express').Router()
const { getAppInfo, getMostRated } = require('../controller/admin')
const {isAuth, isAdmin} = require('../middleware/auth')

router.get('/appinfo', isAuth, isAdmin, getAppInfo)

router.get('/mostrated', isAuth, isAdmin, getMostRated)

module.exports = router