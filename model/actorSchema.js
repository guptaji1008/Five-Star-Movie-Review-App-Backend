const mongoose = require("mongoose")
const bcrypt = require('bcrypt')

const actorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    about: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    avatar: {
        type: Object,
        url: String,
        public_id: String
    }
}, { timestamps: true })

actorSchema.index({ name: "text" })

module.exports = mongoose.model("Actor", actorSchema)