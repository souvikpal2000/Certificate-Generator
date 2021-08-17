const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
	emailCC: {
		type: String
	},
	emailBCC: {
		type: String
	},
	emailSubject: {
		type: String,
		required: true
	},
	emailBody: {
		type: String,
		required: true
	}
},{ _id : false });

const coordinateSchema = new mongoose.Schema({
	xCoordinate: {
		type: Number,
		required: true
	},
	yCoordinate: {
		type: Number,
		required: true
	}
},{ _id: false });

const certificateSchema = new mongoose.Schema({
	certificatePath: {
		type: String,
		required: true
	},
	coordinates: coordinateSchema
},{ _id : false });

const sheetSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	googleId: {
		type: String,
		required: true
	},
	certificate: certificateSchema,
	email: emailSchema,
	createdAt: {
        type: Date,
        default: Date.now
    }
});

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	sheets: [sheetSchema]
});

const user = new mongoose.model("user", userSchema);
const sheet = new mongoose.model("sheet", sheetSchema);
const certificate = new mongoose.model("certificate", certificateSchema);
const coordinate = new mongoose.model("coordinate", coordinateSchema);
const email = new mongoose.model("email", emailSchema);

module.exports.User = user;
module.exports.Sheet = sheet;
module.exports.Certificate = certificate;
module.exports.Coordinate = coordinate;
module.exports.Email = email;