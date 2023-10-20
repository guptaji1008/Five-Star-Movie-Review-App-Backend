const jwt = require("jsonwebtoken");
const { helperError } = require("../utils/helper");
const User = require("../model/userSchema");

exports.isAuth = async (req, res, next) => {
  const token = req.headers?.authorization;
  if (!token) return helperError("Token not found");

  const jwtToken = token.split("Bearer ")[1];
  if (!jwtToken) return helperError(res, "Invalid Token!");
  const decode = jwt.verify(jwtToken, process.env.JWT_SECRET);
  const { userId } = decode;

  const user = await User.findById(userId);
  if (!user) return helperError(res, "Invalid token, user not found", 404);

  req.user = user;
  next();
};

exports.isAdmin = (req, res, next) => {
  const { user } = req;

  if (user.role !== "admin") return helperError(res, "Not an Admin");
  next();
};
