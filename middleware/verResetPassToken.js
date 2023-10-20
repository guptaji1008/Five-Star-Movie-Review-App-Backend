const { isValidObjectId } = require('mongoose')
const ResetPasswordToken = require('../model/resetPasswordToken')
const { helperError } = require('../utils/helper')

exports.verifyResetPasswordToken = async (req, res, next) => {
    const {token, userId} = req.body

    if(!token.trim() || !isValidObjectId(userId)) return helperError(res, "Invalid Request!")

    const resetToken = await ResetPasswordToken.findOne({owner: userId})
    if (!resetToken) return helperError(res, "Unauthorized access, Invalid Request!")

    const isMatch = await resetToken.compareToken(token)
    if (!isMatch) return helperError(res, "Unauthorized access, Invalid Request!")

    req.resetToken = resetToken
    next()

}