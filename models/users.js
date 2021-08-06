const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
	emailSubject: {
		type: String,
		required: true
	},
	emailBody: {
		type: String,
		required: true
	},
	emailCC: {
		type: String
	},
	emailBCC: {
		type: String
	},
	certificatePath: {
		type: String,
		required: true
	},
	excelSheetId: {
		type: String,
		required: true
	},
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
		required: true
	},
	password: {
		type: String,
		required: true
	},
	certificates: [certificateSchema]
});

const user = new mongoose.model("user", userSchema);
const certificate = new mongoose.model("certificate", certificateSchema);

module.exports.User = user;
module.exports.Certificate = certificate;