const { google, chat_v1 } = require('googleapis');
const { GoogleSpreadsheet } = require('google-spreadsheet');;
const secret = require('../client_secret.json');

const client = new google.auth.JWT(
	secret.client_email,
	null,
	secret.private_key,
	['https://www.googleapis.com/auth/spreadsheets.readonly']
);							

client.authorize(async (err) => {
	if(err){
		console.log(`Error : ${err}`);
	}
	else{
		console.log("Google Spreadsheet Connected!!");
		console.log(client);
		gsrun(client);
	}
});

async function gsrun(auth){
	try{
		const doc = new GoogleSpreadsheet('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
 		await doc.useServiceAccountAuth(secret);
 		await doc.loadInfo();
 		const sheet = doc.sheetsByIndex[0];
		const sheets = google.sheets({version: 'v4', auth});
  		sheets.spreadsheets.values.get({
    		spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
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
}