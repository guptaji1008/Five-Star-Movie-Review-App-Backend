const User = require('../model/userSchema')
const EmailVerToken = require('../model/emailVerToken')
const { isValidObjectId } = require('mongoose')
const { generateMailTransporter, generateOtp } = require('../utils/mail')
const { generateRandomBytes } = require('../utils/helper')
const { helperError } = require('../utils/helper')
const ResetPasswordToken = require("../model/resetPasswordToken")
const jwt = require('jsonwebtoken')

exports.home = (req, res) => {
  res.send("<h1>This is a movie review server's home page.</h1>")
}

exports.signup = async (req, res) => {
  const { name, email, password } = req.body

  const checkEmail = await User.findOne({ email })
  if (checkEmail) return helperError(res, "This email is already registered")

  const newUser = new User({ name, email, password })
  await newUser.save()
  // create 6 digit otp
  let OTP = generateOtp()

  // save otp to database
  const newEmailVerToken = new EmailVerToken({
    owner: newUser._id,
    token: OTP
  })

  await newEmailVerToken.save()

  // send otp to email
  var transport = generateMailTransporter();

  transport.sendMail({
    from: "verification@reviewapp.com",
    to: newUser.email,
    subject: "EMAIL VERIFICATION",
    html: `
          <p>Your Verification OTP : </p>
          <h1>${OTP}</h1>`
  })

  res.status(201).json({
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email
    }
  })
}

exports.verifyEmail = async (req, res) => {
  const { userId, OTP } = req.body

  if (!isValidObjectId(userId)) return helperError(res, "Invalid User!")

  const user = await User.findById(userId)
  if (!user) return helperError(res, "User not found!")

  if (user.isVerified) helperError(res, "User is already verified!")

  const token = await EmailVerToken.findOne({ owner: userId })
  console.log(token)
  if (!token) return helperError(res, "Token not found!")

  const isMatched = await token.compareToken(OTP)
  if (!isMatched) return helperError(res, "Enter Valid OTP!")

  user.isVerified = true
  await user.save()

  await EmailVerToken.findByIdAndDelete(token._id)

  var transport = generateMailTransporter();

  transport.sendMail({
    from: "verification@reviewapp.com",
    to: user.email,
    subject: "WELCOME EMAIL",
    html: `<h1>Wecome to our app, and thanks for choosing us.</h1>`
  })

  const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET)

  res.status(201).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      token: jwtToken,
      role: user.role,
      isVerified: user.isVerified
    }, message: "Your email is verified"
  })

}

exports.resendEmailVerToken = async (req, res) => {
  const { userId } = req.body

  const user = await User.findById(userId)
  if (!user) return helperError(res, "User does not exist")

  if (user.isVerified) return helperError(res, "User is already verified!")

  const alreadyHasToken = await EmailVerToken.findOne({ owner: userId })

  if (alreadyHasToken) return helperError(res, "You can request for new token after one hour")

  // create 6 digit otp
  let OTP = generateOtp()

  // save otp to database
  const newEmailVerToken = new EmailVerToken({
    owner: user._id,
    token: OTP
  })

  await newEmailVerToken.save()

  // send otp to email
  var transport = generateMailTransporter()

  transport.sendMail({
    from: "verification@reviewapp.com",
    to: user.email,
    subject: "EMAIL VERIFICATION",
    html: `
            <p>Your Verification OTP : </p>
            <h1>${OTP}</h1>`
  })

  res.status(201).json({ message: "OTP has been send to your email account" })
}

exports.forgotPassword = async (req, res) => {
  const { email } = req.body

  if (!email) return helperError(res, "Email Id not found!")

  const user = await User.findOne({ email })
  if (!user) return helperError(res, "User not found")

  const alreadyHasResetToken = await ResetPasswordToken.findOne({ owner: user._id })
  if (alreadyHasResetToken) return helperError(res, "You can request for new token after one hour")

  const token = await generateRandomBytes()
  const newPasswordResetToken = new ResetPasswordToken({ owner: user._id, token })
  await newPasswordResetToken.save()

  const resetPasswordUrl = `https://fivestarreviewapp.netlify.app/auth/resetpassword?token=${token}&id=${user._id}` || `https://localhost:3000/auth/resetpassword?token=${token}&id=${user._id}`

  var transport = generateMailTransporter()

  transport.sendMail({
    from: "security@reviewapp.com",
    to: user.email,
    subject: "RESET PASSWORD",
    html: `<h3> <a href="${resetPasswordUrl}">Click here</a> to change password.</h3>`
  })

  res.json({ message: "Link has been sent to you email!" })
}

exports.sendMessageVerifyResetPassToken = (req, res) => {
  res.json({ valid: true })
}

exports.resetPassword = async (req, res) => {
  const { newPassword, userId } = req.body

  const user = await User.findById(userId)
  const matched = await user.comparePassword(newPassword)
  if (matched) return helperError(res, "The new password must be different from old password")

  user.password = newPassword

  await user.save()

  await ResetPasswordToken.findByIdAndDelete(req.resetToken._id)

  const transport = generateMailTransporter()

  transport.sendMail({
    from: "security@reviewapp.com",
    to: user.email,
    subject: "PASSWORD RESET SUCCESFULLY",
    html: `
          <h2>Password reset successfully.</h2>        
        `
  })

  res.json({ message: "Password reset successfully" })
}

exports.signIn = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) return helperError(res, "User not found")

  const user = await User.findOne({ email })
  if (!user) return helperError(res, "Invalid email or password")

  const matched = await user.comparePassword(password)
  if (!matched) return helperError(res, "Invalid email or password")

  const { name, _id, role, isVerified } = user

  const jwtToken = jwt.sign({ userId: _id }, process.env.JWT_SECRET)

  res.json({ user: { id: _id, name, email, role, token: jwtToken, isVerified } })

}