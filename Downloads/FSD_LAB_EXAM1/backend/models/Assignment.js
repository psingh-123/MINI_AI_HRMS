const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
    title:String,
    course:String,
    due_date:String,
    description:String
});

module.exports = mongoose.model("Assignment",assignmentSchema);