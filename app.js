require('./connections/dbconnection');
const { Auth } = require('./connections/sheetconnection');
const express = require('express');
const path = require('path');
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require('cookie-parser');
const multer = require('multer');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { google, chat_v1 } = require('googleapis');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const AdmZip = require('adm-zip');
const nodemailer = require('nodemailer');
const secret = require('./client_secret.json');
const { User, Sheet, Certificate, Properties, Email } = require('./models/users');
const auth = require('./middleware/auth');
const { resolve } = require('path');
const app = express();

require('dotenv').config();

const staticPath = path.join(__dirname, "public");
const viewsPath = path.join(__dirname, "templates/views");

app.set("views", viewsPath);
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.static(staticPath));
app.use(cookieParser());

var uniqueNo;
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
        uniqueNo = Date.now();
        cb(null, `${file.fieldname}-${uniqueNo}${path.extname(file.originalname)}`)
    }
});
var upload = multer({ storage: storage });

app.get('/',auth, (req,res) => {
	if(req.id){
		return res.render("index", {status: "loggedIn"});
	}
	res.render("index", {status: "loggedOut"});
});

app.get('/register', (req,res) => {
	res.render("register", {status: "loggedOut", message: null, success: null});
});

app.post('/register', async (req,res) => {
	try{
		if(req.body.password != req.body.conPassword){
			res.render("register", {status: "loggedOut", message: "Password doesn't match", success: "0"});
		}
		else{
			const findUser = await User.findOne({email:req.body.email});
			if(findUser){
				return res.render("register", {status: "loggedOut", message: "This Email is Already Registered", success: "0"});
			}
			const hashedPassword = await bcrypt.hash(req.body.password, 10);
			const register = new User({
				name: req.body.name,
				email: req.body.email,
				password: hashedPassword,
			}); 
			await register.save();
			res.render("register", {status: "loggedOut", message: "Registered Successfully", success: "1"});
		}
	}
	catch(err){
		console.log(err);
	}
});

app.get('/login', (req,res) => {
	res.render("login", {status: "loggedOut", message: null});
});

app.post('/login', async (req,res) => {
	try{
		const findUser = await User.findOne({email:req.body.email});
		if(findUser){
			const check = await bcrypt.compare(req.body.password, findUser.password);
			if(check==true){
				const token = await jwt.sign({ _id: findUser._id }, process.env.SECRET_KEY);
				res.cookie("jwt", token, { expires:new Date(Date.now() + 253402300000000), httpOnly:true });
				return res.redirect("/");
			}
			res.render("login", {status: "loggedOut", message: "Incorrect Password"});
		}
		else{
			res.render('login', {status: "loggedOut", message: "Invalid Email"});
		}
	}
	catch(err){
		console.log(err);
	}
});

app.get("/logout", (req,res) => {
    res.clearCookie("jwt");
    res.redirect("/");
});

app.get("/add", auth, async (req,res) => {
	try{
		if(req.id){
			const userData = await User.findOne({_id:req.id});
			userData.sheets.sort((a, b) => b.createdAt - a.createdAt);
			return res.render("add", {status: "loggedIn", allData: userData.sheets});
		}
		res.redirect('/');
	}
	catch(err){
		console.log(err);
	}
});

app.get("/add/linksheet", auth, (req,res) => {
	if(req.id){
		return res.render("linksheet", {status: "loggedIn", sheetData: null});
	}
	res.redirect('/');
});

app.post("/add/linksheet", auth, async (req,res) => {
	if(req.id){
		const userData = await User.findOne({_id:req.id});
		const sheetData = new Sheet({
			title: req.body.title,
			description: req.body.description,
			googleId: req.body.googleId
		});
		userData.sheets.push(sheetData);
		await userData.save();
		return res.redirect('/add');
	}
	res.redirect("/");
});

app.get('/edit/linksheet/:id', auth, async (req,res) => {
	if(req.id){
		const sheet = await User.findOne({ _id: req.id }, { 'sheets': { $elemMatch: { "_id": req.params.id } } });
		res.render("linksheet", {status: "loggedIn", sheetData: sheet.sheets[0]});
		return;
	}
	res.redirect('/');
});

app.post('/edit/linksheet/:id', auth, async (req,res) => {
	if(req.id){
		await User.updateOne({"_id": req.id, "sheets._id": req.params.id}, {
            $set:{
                "sheets.$.title": req.body.title,
                "sheets.$.description": req.body.description,
                "sheets.$.googleId": req.body.googleId
            }
        });
		return res.redirect('/add');
	}
	res.redirect('/');
});

/*app.post('/add/:id', auth, async (req,res) => {
	if(req.id){
		await User.updateOne({ _id: req.id }, { '$pull': { 'sheets': { "_id": req.params.id } } });
		return res.redirect("/add");
	}
	res.redirect("/");
});*/

app.get('/add/template/:id', auth, async (req,res) => {
	if(req.id){
		const sheet = await User.findOne({ _id: req.id }, { 'sheets': { $elemMatch: { "_id": req.params.id } } });
		//console.log(sheet.sheets[0]);
		if(sheet.sheets[0].certificate != undefined){
			if(sheet.sheets[0].certificate.properties != undefined){
				const content = await PDFDocument.load(fs.readFileSync("public/"+sheet.sheets[0].certificate.certificatePath));
				const pages = await content.getPages();
				const firstPg = pages[0];
				const color = sheet.sheets[0].certificate.properties.color;
				firstPg.drawText("abcdxyz abcdxyz", {
					x : Number(sheet.sheets[0].certificate.properties.xCoordinate),
					y : Number(sheet.sheets[0].certificate.properties.yCoordinate),
					size : Number(sheet.sheets[0].certificate.properties.fontSize),
					color : rgb(parseInt(color.substr(1,2), 16)/255, parseInt(color.substr(3,2), 16)/255, parseInt(color.substr(5,2), 16)/255)
				});
				fs.writeFileSync('public/savedPdf/test.pdf', await content.save());
				const path = "public/savedPdf/test.pdf".substring(7);
				return res.render("upPre", {status: "loggedIn", sheetId: req.params.id, alertMessage: null, certificate: sheet.sheets[0].certificate.certificatePath, modifiedPdf: path});
			}
			return res.render("upPre", {status: "loggedIn", sheetId: req.params.id, alertMessage: null, certificate: sheet.sheets[0].certificate.certificatePath, modifiedPdf: sheet.sheets[0].certificate.certificatePath});
		}
		return res.render("upPre", {status: "loggedIn", sheetId: req.params.id, alertMessage: null, certificate: null, modifiedPdf: null});
	}
	res.redirect("/");
});

app.post('/add/template/:id', auth, upload.single('template'), async (req,res) => {
	if(req.id){
		if(req.file != undefined){
			var x = 'uploads/'+ req.file.fieldname + "-" + uniqueNo + path.extname(req.file.originalname);
			const upload = new Certificate({
				certificatePath: x
			});
			const sheet = await User.findOne({ _id: req.id }, { 'sheets': { $elemMatch: { "_id": req.params.id } } });
			if(sheet.sheets[0].certificate != undefined){
				const deletePath = "public/" + sheet.sheets[0].certificate.certificatePath;
				fs.unlinkSync(deletePath);
			}
			sheet.sheets[0].certificate = upload;
			sheet.save();
			return res.redirect(`/add/template/${req.params.id}`);
		}
		return res.render("upPre", {status: "loggedIn", sheetId: req.params.id, alertMessage: "Choose File", certificate: null});
	}
	res.redirect('/');
});

app.post('/saveproperties/:id', auth, async (req,res) => {
	try{
		if(req.id){
			const sheet = await User.findOne({ _id: req.id }, { 'sheets': { $elemMatch: { "_id": req.params.id } } });
			const pdfProperties = new Properties({
				xCoordinate: req.body.xcoord,
				yCoordinate: req.body.ycoord,
				fontSize: req.body.fontSize,
				color: req.body.color
			});
			sheet.sheets[0].certificate.properties = pdfProperties;
			sheet.save();
			return res.redirect('/add');
		}
		res.redirect('/');
	}
	catch(err){
		console.log(err);
	}
});

app.post('/delete/:id', auth, async (req,res) => {
	if(req.id){
		const sheet = await User.findOne({ _id: req.id }, { 'sheets': { $elemMatch: { "_id": req.params.id } } });
		if(sheet.sheets[0].certificate != undefined){
			const deletePath = "public/" + sheet.sheets[0].certificate.certificatePath;
			await User.updateOne({ _id: req.id }, { '$pull': { 'sheets': { "_id": req.params.id } } });
			fs.unlink(deletePath, () => {
            	res.redirect("/add");
        	});
			return;
		}
		await User.updateOne({ _id: req.id }, { '$pull': { 'sheets': { "_id": req.params.id } } });
		return res.redirect("/add");
	}
	res.redirect('/');
});

app.get('/add/email/:id', auth, async (req,res) => {
	if(req.id){
		const sheet = await User.findOne({ _id: req.id }, { 'sheets': { $elemMatch: { "_id": req.params.id } } });
		if(sheet.sheets[0].email != undefined){
			return res.render("addEmail", {status: "loggedIn", edit: "possible", data: sheet.sheets[0]});
		}
		return res.render("addEmail", {status: "loggedIn", edit:"notPossible", data: sheet.sheets[0]});
	}
	res.redirect('/');
});

app.post('/add/email/:id', auth, async (req,res) => {
	if(req.id){
		const sheet = await User.findOne({ _id: req.id }, { 'sheets': { $elemMatch: { "_id": req.params.id } } });
		const emailData = new Email({
			cc: req.body.cc,
			bcc: req.body.bcc,
			subject: req.body.subject,
			body: req.body.body
		});
		sheet.sheets[0].email = emailData;
		sheet.save();
		return res.redirect("/add");
	}
	res.redirect("/");
});

app.get("/viewsheet/:id", auth, async (req,res) => {
	if(req.id){
		try{
			const sheet = await User.findOne({ _id: req.id }, { 'sheets': { $elemMatch: { "_id": req.params.id } } });

			const doc = new GoogleSpreadsheet(sheet.sheets[0].googleId);
			await doc.useServiceAccountAuth(secret);
			await doc.loadInfo();
			const sheetData = doc.sheetsByIndex[0];

			const sheets = google.sheets({version: 'v4', auth: Auth});
			const data = await sheets.spreadsheets.values.get({
				spreadsheetId: sheet.sheets[0].googleId,
				range: `${sheetData.title}!B2:E`
			});
			const rows = data.data.values;
			if(sheet.sheets[0].certificate == undefined){
				return res.render("viewSheet", {status: "loggedIn", message: "Please Upload Template", id: req.params.id, rows: rows});
			}
			else if(sheet.sheets[0].certificate.properties == undefined){
				return res.render("viewSheet", {status: "loggedIn", message: "Please set Properties for Template", id: req.params.id, rows: rows});
			}
			else if(sheet.sheets[0].email == undefined){
				return res.render("viewSheet", {status: "loggedIn", message: "Please Fill Email Info", id: req.params.id, rows: rows});
			}
			return res.render("viewSheet", {status: "loggedIn", message: null, id: req.params.id, rows: rows});
		}
		catch(err){
			return res.render("viewSheet", {status: "loggedIn", message: "invalid"});
		}
	}
	res.redirect('/');
});

app.post("/viewsheet/:id", auth, async (req,res) => {
	if(req.id){
		let names = [];
		let emails = [];
		names = req.body.studentsName.split(',');
		emails = req.body.studentsEmail.split(',');
		const sheet = await User.findOne({ _id: req.id }, { 'sheets': { $elemMatch: { "_id": req.params.id } } });
		
		if(sheet.sheets[0].certificate == undefined || sheet.sheets[0].certificate.properties == undefined || sheet.sheets[0].email == undefined){
			return res.redirect(`/viewsheet/${req.params.id}`);	
		}

		async function saveCertificate(name){
			//Save PDF inside certificates Folder for each Participants
			const content = await PDFDocument.load(fs.readFileSync("public/"+sheet.sheets[0].certificate.certificatePath));
			const pages = await content.getPages();
			const firstPg = pages[0];
			const color = sheet.sheets[0].certificate.properties.color;
			firstPg.drawText(name, {
				x : Number(sheet.sheets[0].certificate.properties.xCoordinate),
				y : Number(sheet.sheets[0].certificate.properties.yCoordinate),
				size : Number(sheet.sheets[0].certificate.properties.fontSize),
				color : rgb(parseInt(color.substr(1,2), 16)/255, parseInt(color.substr(3,2), 16)/255, parseInt(color.substr(5,2), 16)/255)
			});
			fs.writeFileSync(`public/certificates/${name}.pdf`, await content.save());
			return new Promise((resolve,reject) => resolve("Done"));
		}
		
		(async () => {
			await Promise.all(
				names.map(name => saveCertificate(name))
			);
			
			//Make Zip of Files present in Certificates Folder
			const certificatesDir = await fs.readdirSync(__dirname+"/public/certificates/");
			const zip = new AdmZip();
			for(let i = 0; i < certificatesDir.length; i++){
				if(certificatesDir[i] != "Info.txt"){
					zip.addLocalFile(__dirname+"/public/certificates/"+certificatesDir[i]);
				}
			} 
			const zipName = `Certificates.zip`;
			fs.writeFileSync(`public/email-zip/${zipName}`,  zip.toBuffer());

			//Delete Files from Certificates Folder
			const directory = __dirname+'/public/certificates';
			fs.readdir(directory, (err, files) => {
				if (err) throw err;
				for (const file of files) {
					if(file!="Info.txt"){
						fs.unlink(path.join(directory, file), err => {
							if (err) throw err;
						});
					}
				}
			});

			//Send Email
			const transporter = nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: process.env.APP_EMAIL,
					pass: process.env.APP_EMAIL_PASSWORD
				}
			});

			await transporter.sendMail({
				from: process.env.APP_EMAIL,
				to: emails,
				cc: sheet.sheets[0].email.cc,
				bcc: sheet.sheets[0].email.bcc,
				subject: sheet.sheets[0].email.subject,
				text: sheet.sheets[0].email.body,
				attachments: [
					{
						path: __dirname + '/public/email-zip/Certificates.zip'
					}
				]
			});

			//Delete Zip File present in email-zip Folder
			let zipPath = __dirname+"/public/email-zip/Certificates.zip";
			fs.unlinkSync(zipPath);

			return res.redirect(`/viewsheet/${req.params.id}`);	
		})();
	}
	else{
		res.redirect("/");
	}
});

app.get('/delete', async (req,res) => {
	try{
		await User.deleteMany();
		res.send("All Users Deleted");
	}
	catch(err){
		res.send(err);
	}
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