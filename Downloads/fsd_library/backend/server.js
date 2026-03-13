const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const Student = require("./models/Student");
const Librarian = require("./models/Librarian");
const Book = require("./models/Book");

const app = express();

app.use(cors());
app.use(bodyParser.json());

mongoose.connect("mongodb+srv://admin:Psingh%4012345@cluster0.dti89.mongodb.net/LibraryManagement?retryWrites=true&w=majority");


// -----------------------------
// Student Registration
// -----------------------------

app.post("/student/register", async (req, res) => {

    const student = new Student(req.body);
    await student.save();

    res.json({message:"Student Registered"});
});


// -----------------------------
// Student Login
// -----------------------------

app.post("/student/login", async (req, res) => {

    const {email, password} = req.body;

    const student = await Student.findOne({email, password});

    if(student){
        res.json({message:"Login successful", student});
    }else{
        res.status(401).json({message:"Invalid credentials"});
    }

});


// -----------------------------
// Librarian Login
// -----------------------------

app.post("/librarian/login", async (req, res) => {

    const {username, password} = req.body;

    const librarian = await Librarian.findOne({username, password});

    if(librarian){
        res.json({message:"Login successful"});
    }else{
        res.status(401).json({message:"Invalid credentials"});
    }

});


// -----------------------------
// Add Book (Librarian)
// -----------------------------

app.post("/books/add", async (req, res) => {

    const book = new Book(req.body);
    await book.save();

    res.json({message:"Book Added"});
});


// -----------------------------
// View All Books
// -----------------------------

app.get("/books", async (req, res) => {

    const books = await Book.find();
    res.json(books);

});


// -----------------------------
// Borrow Book
// -----------------------------

app.post("/books/borrow", async (req, res) => {

    const {bookId, studentName} = req.body;

    await Book.findByIdAndUpdate(bookId,{
        available:false,
        borrowedBy:studentName
    });

    res.json({message:"Book Borrowed"});
});


// -----------------------------
// Return Book
// -----------------------------

app.post("/books/return", async (req, res) => {

    const {bookId} = req.body;

    await Book.findByIdAndUpdate(bookId,{
        available:true,
        borrowedBy:null
    });

    res.json({message:"Book Returned"});
});


// -----------------------------

app.listen(5000, ()=>{
    console.log("Server running on port 5000");
});