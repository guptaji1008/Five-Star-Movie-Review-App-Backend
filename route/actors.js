const express = require("express");
const {
  createActor,
  updateActor,
  deleteActor,
  searchActor,
  searchLatestActors,
  searchSingleActor,
  getActors,
} = require("../controller/actors");
const { uploadImage } = require("../middleware/multer");
const { actorInfoValidator, validator } = require("../middleware/validator");
const { isAuth, isAdmin } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/create",
  uploadImage.single("avatar"),
  isAuth,
  isAdmin,
  actorInfoValidator,
  validator,
  createActor
);

router.post(
  "/update/:actorId",
  isAuth,
  isAdmin,
  uploadImage.single("avatar"),
  actorInfoValidator,
  validator,
  updateActor
);

router.delete("/:actorId", isAuth, isAdmin, deleteActor);

router.get("/search", isAuth, isAdmin, searchActor);

router.get("/latestupload", isAuth, isAdmin, searchLatestActors);

router.get('/actors', isAuth, isAdmin, getActors)

router.get("/search/:id", searchSingleActor);

module.exports = router;
