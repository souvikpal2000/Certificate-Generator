const loggedIn = document.querySelectorAll('.loggedIn');

if(loggedIn.length > 0){
    const li = document.querySelector('.instructions');
    li.insertAdjacentHTML('afterend', `
        <li class="nav-item">
            <a class="nav-link" href="/add">Add</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="/logout">Logout</a>
        </li>
    `);
}
else{
    const li = document.querySelector('.instructions');
    li.insertAdjacentHTML('afterend', `
        <li class="nav-item">
            <a class="nav-link" href="/register">Register</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="/login">Login</a>
        </li>
    `);
}

const generatePDF = async() => {
    const {PDFDocument, rgb} = PDFLib;
    const pdf = document.querySelector(".templateHiddenTag").innerHTML;
    const exBytes = await fetch(pdf).then(res => {
        return res.arrayBuffer();
    });
    const pdfDoc = await PDFDocument.load(exBytes);
    const pages = pdfDoc.getPages();
    const firstPg = pages[0];
    const color =  document.querySelector("#color").value;
    firstPg.drawText("abcdxyz abcdxyz", {
        x : Number(document.querySelector("#xcoord").value),
        y : Number(document.querySelector("#ycoord").value),
        size : Number(document.querySelector("#fontSize").value),
        color : rgb(parseInt(color.substr(1,2), 16)/255, parseInt(color.substr(3,2), 16)/255, parseInt(color.substr(5,2), 16)/255)
    });
    const uri = await pdfDoc.saveAsBase64({dataUri: true});
    document.querySelector("#pdf").src = uri;
}

document.querySelector('.sendMail').disabled = true;
let arrayEmail = [];
let arrayName = [];
function check(student){
    if(student.checked){
        arrayEmail.push(student.value);
        let valuetwo = student.getAttribute("data-valuetwo");
        arrayName.push(valuetwo);
        document.querySelector(".checkedEmail").innerHTML = arrayEmail;
        document.querySelector(".checkedName").innerHTML = arrayName;
        if(arrayEmail.length > 0){
            document.querySelector('.sendMail').disabled = false;
        }
    }
    else{
        document.querySelector(".students").checked = false;
        let i=0;
        arrayEmail.forEach(child => {
            if(child === student.value){
                arrayEmail.splice(i,1);
                arrayName.splice(i,1);
                return;
            }
            i++;
        });
        document.querySelector(".checkedEmail").innerHTML = arrayEmail;
        document.querySelector(".checkedName").innerHTML = arrayName;
        if(arrayEmail.length == 0){
            document.querySelector('.sendMail').disabled = true;
        }
    }
}
function checkAll(tag){
    arrayEmail = [];
    arrayName = [];
    const students = document.getElementsByName("student");
    if(tag.checked){
        students.forEach(child => {
            child.checked = true;
            arrayEmail.push(child.value);
            let valuetwo = child.getAttribute("data-valuetwo");
            arrayName.push(valuetwo);
            document.querySelector(".checkedEmail").innerHTML = arrayEmail;
            document.querySelector(".checkedName").innerHTML = arrayName;
        });
        if(arrayEmail.length > 0){
            document.querySelector('.sendMail').disabled = false;
        }
    }
    else{
        students.forEach(child => {
            child.checked = false;
        });
        arrayEmail = [];
        arrayName = []
        document.querySelector(".checkedEmail").innerHTML = arrayEmail;
        document.querySelector(".checkedName").innerHTML = arrayName;
        if(arrayEmail.length == 0){
            document.querySelector('.sendMail').disabled = true;
        }
    }
}

function findEmail(){
	let filter = document.getElementById('myInput').value.toUpperCase();
	let table = document.querySelector('tbody');
	let tr = table.getElementsByTagName('tr');
	for(var i=0; i<tr.length; i++)
	{
		let email = tr[i].getElementsByTagName('td')[0];
		if(email){
			let textValue = email.textContent || email.innerHTML;
			if(textValue.toUpperCase().indexOf(filter) > -1){
				tr[i].style.display = "";
			}
			else{
				tr[i].style.display = "none";
			}
		}
	}
}