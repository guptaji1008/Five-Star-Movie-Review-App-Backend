const { isValidObjectId } = require("mongoose");
const Actor = require("../model/actorSchema");
const {
  helperError,
  uploadImageToCloud,
  formatActor,
} = require("../utils/helper");
const cloudinary = require("../cloud");

exports.createActor = async (req, res) => {
  const { name, about, gender } = req.body;
  const { file } = req;
  const newActor = new Actor({ name, about, gender });
  if (file) {
    const { url, public_id } = await uploadImageToCloud(file.path);
    newActor.avatar = { url, public_id };
  }

  await newActor.save();
  res.status(201).json({ actorInfo: formatActor(newActor) });
};

exports.updateActor = async (req, res) => {
  const { name, about, gender } = req.body;
  const { file } = req;
  const { actorId } = req.params;
  if (!isValidObjectId(actorId)) return helperError(res, "Invalid Token!");

  const actor = await Actor.findById(actorId);
  if (!actor) return helperError(res, "Invalid Token, user not found!");

  const public_id = actor.avatar?.public_id;

  // remove old image if there was one!
  if (public_id && file) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok") {
      return helperError(res, "Could not delete file from cloud!");
    }
  }

  // add new image if there is one
  if (file) {
    const { url, public_id } = await uploadImageToCloud(file.path);
    actor.avatar = { url, public_id };
  }

  actor.name = name;
  actor.about = about;
  actor.gender = gender;

  await actor.save();

  res.status(201).json({actor: formatActor(actor)});
};

exports.deleteActor = async (req, res) => {
  const { actorId } = req.params;

  if (!isValidObjectId(actorId)) return helperError(res, "Invalid Token!");

  const actor = await Actor.findById(actorId);
  if (!actor) return helperError(res, "Invalid Token, user not found!");

  const public_id = actor.avatar?.public_id;

  if (public_id) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok")
      return helperError(res, "Could not delete file from cloud");
  }

  await Actor.findByIdAndDelete(actorId);
  res.json({ message: "Record remove successfully" });
};

exports.searchActor = async (req, res) => {
  const { name } = req.query;

  if (!name.trim()) return helperError(res, "Invalid Request!")

  // const result = await Actor.find({ $text: { $search: `"${query.name}"` } });
  const result = await Actor.find({ name: { $regex: name, $options: "i" } });


  const actor = result.map((elem) => formatActor(elem));

  res.json({ results: actor });
};

exports.searchLatestActors = async (req, res) => {
  const result = await Actor.find().sort({ createdAt: "-1" }).limit(12);
  const actor = result.map((elem) => formatActor(elem));
  res.json(actor);
};

exports.searchSingleActor = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) return helperError(res, "Invalid Token!");

  const actor = await Actor.findById(id);
  if (!actor) return helperError(res, "Invalid Token, user not found!", 404);

  res.status(200).json({actor: formatActor(actor)});
};

exports.getActors = async (req, res) => {
  const { pageNo, limit } = req.query;

  const actors = await Actor.find()
    .sort({ createdAt: -1 })
    .skip(parseInt(pageNo) * parseInt(limit))
    .limit(parseInt(limit));

    const profiles = actors.map(actor => formatActor(actor))

    res.json({ profiles })
};
