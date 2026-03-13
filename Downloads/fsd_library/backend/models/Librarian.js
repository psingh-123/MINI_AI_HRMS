const mongoose = require("mongoose");

const librarianSchema = new mongoose.Schema({
    username: String,
    password: String
});

module.exports = mongoose.model("Librarian", librarianSchema);