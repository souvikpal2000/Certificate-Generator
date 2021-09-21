const { google, chat_v1 } = require('googleapis');
const secret = require('../client_secret.json');
const client = new google.auth.JWT(
	secret.client_email,
	null,
	secret.private_key,
	['https://www.googleapis.com/auth/spreadsheets.readonly']
);							

client.authorize(async (err) => {
	if(err){
		return console.log(`Error : ${err}`);
	}
	else{
		console.log("Google Spreadsheet Connected!!");
	}
});

module.exports.Auth = client;