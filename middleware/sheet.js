const { google, chat_v1 } = require('googleapis');
const { GoogleSpreadsheet } = require('google-spreadsheet');;

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
}