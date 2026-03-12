const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const User = require("./models/User");
const Assignment = require("./models/Assignment");
const Submission = require("./models/Submission");

const app = express();

app.use(cors());
app.use(bodyParser.json());

mongoose.connect("mongodb+srv://admin:Psingh%4012345@cluster0.dti89.mongodb.net/Student1?retryWrites=true&w=majority")
.then(()=>console.log("MongoDB Connected"));

app.post("/register", async (req,res)=>{

const {username,password,role} = req.body;

const user = new User({
username,
password,
role
});

await user.save();

res.json({message:"User Registered Successfully"});

});

/* LOGIN */

app.post("/login", async(req,res)=>{

const {username,password} = req.body;

const user = await User.findOne({username,password});

if(user)
res.json(user);
else
res.json({message:"Invalid Login"});

});


/* CREATE ASSIGNMENT */

app.post("/assignment/create", async(req,res)=>{

const assignment = new Assignment(req.body);

await assignment.save();

res.json({message:"Assignment Created"});

});


/* GET ASSIGNMENTS */

app.get("/assignments", async(req,res)=>{

const assignments = await Assignment.find();

res.json(assignments);

});


/* SUBMIT ASSIGNMENT */

app.post("/submit", async(req,res)=>{

const submission = new Submission(req.body);

await submission.save();

res.json({message:"Submitted Successfully"});

});


/* VIEW SUBMISSIONS */

app.get("/submissions", async(req,res)=>{

const submissions = await Submission.find();

res.json(submissions);

});


app.listen(5000,()=>{
console.log("Server running on port 5000");
});