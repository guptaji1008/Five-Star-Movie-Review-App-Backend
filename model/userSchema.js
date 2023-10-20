const mongoose = require("mongoose")
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }, 
    isVerified: {
        type: Boolean,
        required: true,
        default: false
    },
    role: {
        type: String,
        required: true, 
        default: "user",
        enum: ["user", "admin"] 
    }
})

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10)
    }
    next()
})

userSchema.methods.comparePassword = async function (pass) {
    const result = await bcrypt.compare(pass, this.password)
    return result
}

module.exports = mongoose.model("User", userSchema)