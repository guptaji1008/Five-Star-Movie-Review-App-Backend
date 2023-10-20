const { check, validationResult } = require("express-validator");
const genres = require("../utils/genres");
const { isValidObjectId } = require("mongoose");

exports.userValidator = [
  check("name").trim().not().isEmpty().withMessage("Name is missing!"),
  check("email").normalizeEmail().isEmail().withMessage("Invalid Email"),
  check("password")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password must not be empty")
    .isLength({ min: 8, max: 20 })
    .withMessage("Password must be 8 to 20 character long!"),
];

exports.userPassValidator = check("newPassword")
  .trim()
  .not()
  .isEmpty()
  .withMessage("Password must not be empty")
  .isLength({ min: 8, max: 20 })
  .withMessage("Password must be 8 to 20 character long!");

exports.signInValidator = [
  check("email").normalizeEmail().isEmail().withMessage("Invalid Email"),
  check("password")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password must not be empty"),
];

exports.actorInfoValidator = [
  check("name").trim().not().isEmpty().withMessage("Actor name is missing!"),
  check("about").trim().not().isEmpty().withMessage("About is required field!"),
  check("gender").trim().not().isEmpty().withMessage("Gender is missing!"),
];

exports.validateMovie = [
  check("title").trim().not().isEmpty().withMessage("Movie title is missing!"),
  check("storyLine")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Story line is important!"),
  check("language").trim().not().isEmpty().withMessage("Language is missing!"),
  check("releaseDate").isDate().withMessage("Release date is missing!"),
  check("status")
    .isIn(["public", "private"])
    .withMessage("Movie status must be public or private!"),
  check("type").trim().not().isEmpty().withMessage("Movie type is missing!"),
  check("genres")
    .isArray()
    .withMessage("Genres must be an array of string!")
    .custom((value) => {
      for (let g of value) {
        if (!genres.includes(g)) throw new Error("Invalid genres!");
      }
      return true;
    }),
  check("tags")
    .isArray({ min: 1 })
    .withMessage("Tags must be an array of strings!")
    .custom((tags) => {
      for (let tag of tags) {
        if (typeof tag !== "string") throw new Error("Tags must be string!");
      }
      return true;
    }),
  check("cast")
    .isArray()
    .withMessage("Cast must be an array of string!")
    .custom((cast) => {
      for (let c of cast) {
        if (!isValidObjectId(c.actor))
          throw new Error("Invalid cast id inside cast!");
        if (!c.roleAs?.trim())
          throw new Error("Role as is missing inside cast");
        if (typeof c.leadActor !== "boolean") {
          throw new Error(
            "Only accept boolean value inside leadActor inside cast!"
          );
        }
      }
      return true;
    }),
];

exports.validateTrailer = check("trailer")
  .isObject()
  .withMessage("trailerInfoe must be an object witrrh url and public id")
  .custom(({ url, public_id }) => {
    try {
      const result = new URL(url);
      if (!result.protocol.includes("http"))
        throw new Error("Trailer url is invalid!");

      const arr = url.split("/");
      const publicId = arr[arr.length - 1].split(".")[0];

      if (public_id !== publicId)
        throw new Error("Trailer public id is invalid");

      return true;
    } catch (error) {
      throw new Error("Trailer url is invaild");
    }
  });

exports.validateRating = check(
  "rating",
  "Rating must be a number between 0 and 10."
).isFloat({ min: 0, max: 10 });

exports.validator = (req, res, next) => {
  const error = validationResult(req).array();
  if (error.length) {
    return res.json({ error: error[0].msg });
  }
  next();
};
