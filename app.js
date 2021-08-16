require('./connections/dbconnection');
require('./connections/sheetconnection');
const express = require('express');
const path = require('path');
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require('cookie-parser');
const multer = require('multer');
const { User, Sheet, Certificate, Email } = require('./models/users');
const auth = require('./middleware/auth');
const app = express();

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
	if(req.id){
		const userData = await User.findOne({_id:req.id});
		return res.render("add", {status: "loggedIn", allData: userData.sheets});
	}
	res.redirect('/');
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
			res.render("upPre", {status: "loggedIn", sheetId: req.params.id, certificate: sheet.sheets[0].certificate.certificatePath});
			return;
		}
		return res.render("upPre", {status: "loggedIn", sheetId: req.params.id, alertMessage: null});
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
			return res.render("upPre", {status: "loggedIn", sheetId: req.params.id, alertMessage: null});
		}
		return res.render("upPre", {status: "loggedIn", sheetId: req.params.id, alertMessage: "Choose File"});
	}
	res.redirect('/');
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
})

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