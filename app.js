require('./db/connection');
const express = require('express');
const path = require('path');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require('cookie-parser');
const { google } = require('googleapis');
const { GoogleSpreadsheet } = require('google-spreadsheet');;
const secret = require('./client_secret.json');
const { User, Certificate } = require('./models/users');
const app = express();

const staticPath = path.join(__dirname, "public");
const viewsPath = path.join(__dirname, "templates/views");

app.set("views", viewsPath);
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.static(staticPath));
app.use(cookieParser());

app.get('/', (req,res) => {
	res.render("index", {status: "loggedOut"});
});

app.get('/register', (req,res) => {
	res.render("register", {status: "loggedOut"});
});

app.get('/login', (req,res) => {
	res.render("login", {status: "loggedOut"});
});

app.get('*', (req,res) => {
	res.render("404Error", { errMessage: 'Oops! Page not Found'});
});

const port = process.env.PORT || 3000;
app.listen(port, (err) => {
	if(!err){
		console.log(`Server listening at port ${port}`);
	}
	else{
		console.log("Something went Wrong");
	}
});

/*const client = new google.auth.JWT(
	secret.client_email,
	null,
	secret.private_key,
	['https://www.googleapis.com/auth/spreadsheets.readonly']
);							</div>

client.authorize((err) => {
	if(err){
		console.log(`Error : ${err}`);
	}
	else{
		console.log("Google Spreadsheet Connected!!");
		gsrun(client);
	}
});

async function gsrun(auth){
	try{
		const doc = new GoogleSpreadsheet('1AQBxm9nCX304NXuI-adMx8web4sARDxe1VlFEqrAzWU');
 		await doc.useServiceAccountAuth(secret);
 		await doc.loadInfo();
 		const sheet = doc.sheetsByIndex[0];

		const sheets = google.sheets({version: 'v4', auth});
  		sheets.spreadsheets.values.get({
    		spreadsheetId: '1AQBxm9nCX304NXuI-adMx8web4sARDxe1VlFEqrAzWU',
    		range: `${sheet.title}!B2:D`,
  		}, (err, res) => {
    		if (err) return console.log('The API returned an error: ' + err);
    		const rows = res.data.values;
    		if (rows.length) {
				rows.forEach(row => {
					console.log(`${row[0]}`);
				}) 			
    		} 
    		else {
      			console.log('No data found.');
    		}
  		});
	}
	catch(err){
		console.log(`Error : ${err}`);
	}
}*/