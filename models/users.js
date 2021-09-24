const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
	cc: {
		type: String
	},
	bcc: {
		type: String
	},
	subject: {
		type: String,
		required: true
	},
	body: {
		type: String,
		required: true
	}
},{ _id : false });

const propertiesSchema = new mongoose.Schema({
	xCoordinate: {
		type: Number,
		required: true
	},
	yCoordinate: {
		type: Number,
		required: true
	},
	fontSize: {
		type: Number,
		required: true
	},
	color: {
		type: String,
		required: true
	}
},{ _id: false });

const certificateSchema = new mongoose.Schema({
	certificatePath: {
		type: String,
		required: true
	},
	properties: propertiesSchema
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
const properties = new mongoose.model("properties", propertiesSchema);
const email = new mongoose.model("email", emailSchema);

module.exports.User = user;
module.exports.Sheet = sheet;
module.exports.Certificate = certificate;
module.exports.Properties = properties;
module.exports.Email = email;