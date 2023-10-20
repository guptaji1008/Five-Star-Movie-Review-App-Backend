const express = require("express");
const {
  home,
  signup,
  verifyEmail,
  resendEmailVerToken,
  forgotPassword,
  sendMessageVerifyResetPassToken,
  resetPassword,
  signIn,
} = require("../controller/user");
const {
  userValidator,
  validator,
  userPassValidator,
  signInValidator,
} = require("../middleware/validator");
const { verifyResetPasswordToken } = require("../middleware/verResetPassToken");
const { isAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", home);

router.post("/signup", userValidator, validator, signup);

router.post("/verifyemail", verifyEmail);

router.post("/resendverifyemail", resendEmailVerToken);

router.post("/forgotpassword", forgotPassword);

router.post(
  "/verifyresetpasswordtoken",
  verifyResetPasswordToken,
  sendMessageVerifyResetPassToken
);

router.post(
  "/resetpassword",
  userPassValidator,
  validator,
  verifyResetPasswordToken,
  resetPassword
);

router.post("/signin", signInValidator, validator, signIn);

router.get('/isauth', isAuth, (req, res) => {
  const {user} = req
  res.json({ user: { id: user._id, name: user.name, email: user.email, isVerified: user.isVerified, role: user.role } })
})

module.exports = router;
