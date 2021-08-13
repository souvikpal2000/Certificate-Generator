const { google, chat_v1 } = require('googleapis');
const { connection } = require('mongoose');
const secret = require('../client_secret.json');

const client = new google.auth.JWT(
	secret.client_email,
	null,
	secret.private_key,
	['https://www.googleapis.com/auth/spreadsheets.readonly']
);							

client.authorize((err) => {
	if(err){
		console.log(`Error : ${err}`);
	}
	else{
		console.log("Google Spreadsheet Connected!!");
		const sheets = google.sheets({version: 'v4', client});
		//gsrun(client);
	}
});