const API="http://localhost:5000";

async function register(){

let username=document.getElementById("reg_username").value;
let password=document.getElementById("reg_password").value;
let role=document.getElementById("reg_role").value;

let res = await fetch(API+"/register",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({username,password,role})
});

let data = await res.json();

alert(data.message);

}

async function login(){

let username = document.getElementById("login_username").value;
let password = document.getElementById("login_password").value;

let res = await fetch(API+"/login",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({username,password})
});

let data = await res.json();

if(data.role==="student")
window.location="student.html";

else if(data.role==="faculty")
window.location="faculty.html";

else
alert("Invalid Login");

}


/* CREATE ASSIGNMENT */

async function createAssignment(){

let title=document.getElementById("title").value;
let course=document.getElementById("course").value;
let due_date=document.getElementById("due_date").value;
let description=document.getElementById("description").value;

await fetch(API+"/assignment/create",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({title,course,due_date,description})
});

alert("Assignment Created");

}


/* GET ASSIGNMENTS */

async function loadAssignments(){

let res = await fetch(API+"/assignments");
let data = await res.json();

let div = document.getElementById("assignments");

data.forEach(a=>{
div.innerHTML += `<p>${a.title} - ${a.course}</p>`;
});

}


/* SUBMIT */

async function submitAssignment(){

let student_name=document.getElementById("student_name").value;
let assignment_title=document.getElementById("assignment_title").value;
let answer=document.getElementById("answer").value;

await fetch(API+"/submit",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
student_name,
assignment_title,
answer,
submission_date:new Date(),
status:"Submitted"
})
});

alert("Submitted");

}

/* LOAD ASSIGNMENTS */

async function loadAssignments(){

let res = await fetch(API+"/assignments");
let data = await res.json();

let div = document.getElementById("assignments");

div.innerHTML="";

data.forEach(a=>{

div.innerHTML += `
<div class="box">
<h4>${a.title}</h4>
<p><b>Course:</b> ${a.course}</p>
<p><b>Due Date:</b> ${a.due_date}</p>
<p>${a.description}</p>
</div>
`;

});

}


/* LOAD SUBMISSIONS */

async function loadSubmissions(){

let res = await fetch(API+"/submissions");
let data = await res.json();

let div = document.getElementById("submissions");

div.innerHTML="";

data.forEach(s=>{

div.innerHTML += `
<div class="box">
<p><b>Student:</b> ${s.student_name}</p>
<p><b>Assignment:</b> ${s.assignment_title}</p>
<p><b>Answer:</b> ${s.answer}</p>
<p><b>Status:</b> ${s.status}</p>
</div>
`;

});

}