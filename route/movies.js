const express = require("express");

const { isAuth, isAdmin } = require("../middleware/auth");
const { uploadVideo, uploadImage } = require("../middleware/multer");
const {
  uploadTrailer,
  createMovie,
  removeMovie,
  getMovies,
  getMovieForUpdate,
  updateMovie,
  searchMovie,
  getLatestUploads,
  getSingleMovie,
  getRelatedMovies,
  getTopRatedMovies,
  searchPublicMovie,
} = require("../controller/movie");
const { parseData } = require("../utils/helper");
const { validateMovie, validator, validateTrailer } = require("../middleware/validator");

const router = express.Router();

router.post(
  "/uploadtrailer",
  isAuth,
  isAdmin,
  uploadVideo.single("video"),
  uploadTrailer
);

router.post(
  "/createmovie",
  isAuth,
  isAdmin,
  uploadImage.single("poster"),
  parseData,
  validateMovie,
  validateTrailer,
  validator,
  createMovie
);

// router.patch(
//   "/updatemoviewithoutposter/:movieId",
//   isAuth,
//   isAdmin,
//   parseData,
//   validateMovie,
//   validator,
//   updateMovieWithoutPoster
// );

router.patch(
  "/update/:movieId",
  isAuth,
  isAdmin,
  uploadImage.single("poster"),
  parseData,
  validateMovie,
  validator,
  updateMovie
);

router.delete("/:movieId", isAuth, isAdmin, removeMovie);

router.get("/movies", isAuth, isAdmin, getMovies);

router.get("/forupdate/:movieId", isAuth, isAdmin, getMovieForUpdate)

router.get("/search", isAuth, isAdmin, searchMovie)

// for normal users :

router.get("/latestuploads", getLatestUploads)

router.get("/single/:movieId", getSingleMovie)

router.get("/related/:movieId", getRelatedMovies)

router.get("/toprated", getTopRatedMovies)

router.get("/searchpublicmovie", searchPublicMovie)

module.exports = router;
