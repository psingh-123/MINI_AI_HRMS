const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
    student_name:String,
    assignment_title:String,
    answer:String,
    submission_date:String,
    status:String
});

module.exports = mongoose.model("Submission",submissionSchema);