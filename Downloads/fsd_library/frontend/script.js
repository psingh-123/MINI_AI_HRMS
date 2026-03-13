const API = "http://localhost:5000";


// STUDENT REGISTER
async function registerStudent(){

const data = {
name: document.getElementById("name").value,
email: document.getElementById("email").value,
password: document.getElementById("password").value,
department: document.getElementById("department").value
};

await fetch(API+"/student/register",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(data)
});

alert("Registered Successfully");

window.location="studentLogin.html";

}


async function loginStudent(){

const data = {
email: document.getElementById("email").value,
password: document.getElementById("password").value
};

const res = await fetch(API+"/student/login",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(data)
});

const result = await res.json();

if(res.ok){

localStorage.setItem("studentName", result.student.name);

alert("Login Success");
window.location="studentDashboard.html";

}else{
alert("Invalid Login");
}

}



// LIBRARIAN LOGIN
async function loginLibrarian(){

const data = {
username: document.getElementById("username").value,
password: document.getElementById("password").value
};

const res = await fetch(API+"/librarian/login",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(data)
});

if(res.ok){
alert("Login Success");
window.location="librarianDashboard.html";
}else{
alert("Invalid Login");
}

}



// ADD BOOK
async function addBook(){

const data = {
title: document.getElementById("title").value,
author: document.getElementById("author").value
};

await fetch(API+"/books/add",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(data)
});

alert("Book Added");

loadBooks();

}



// LOAD BOOKS
async function loadBooks(){

const res = await fetch(API+"/books");
const books = await res.json();

let html="";

books.forEach(book=>{

html += `
<div>
${book.title} - ${book.author}

${book.available ?
`<button onclick="borrowBook('${book._id}')">Borrow</button>`
:
`Borrowed by ${book.borrowedBy}
<button onclick="returnBook('${book._id}')">Return</button>`
}

</div>
`;

});

document.getElementById("books").innerHTML = html;

}



async function borrowBook(id){

const studentName = localStorage.getItem("studentName");

await fetch(API+"/books/borrow",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({bookId:id, studentName})
});

loadBooks();

}



// RETURN BOOK
async function returnBook(id){

await fetch(API+"/books/return",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({bookId:id})
});

loadBooks();

}

async function loadBooksStudent(){

const res = await fetch(API+"/books");
const books = await res.json();

let html="";

books.forEach(book=>{

if(book.available){

html += `
<div>
${book.title} - ${book.author}
<button onclick="borrowBook('${book._id}')">Borrow</button>
</div>
`;

}

});

document.getElementById("books").innerHTML = html;

}