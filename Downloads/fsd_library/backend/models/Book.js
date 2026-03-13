const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
    title: String,
    author: String,
    available: {
        type: Boolean,
        default: true
    },
    borrowedBy: String
});

module.exports = mongoose.model("Book", bookSchema);