const fs = require("fs");
const fs2 = require("fs-extra");
const rimraf = require("rimraf");
const PdfParse = require("pdf-parse");
const agha = require("../Functions/Check_Agha");
const dow = require("../Functions/Check_Dow");
const sind = require("../Functions/Check_Sind");

//path = "F:\\Projects\\FYP\\Download";
//user = "Moosa";
//path2 = "F:\\Projects\\FYP\\Temp";

//* Completed.
const PathFound = (Path, User) => {
	if (fs.existsSync(Path + "\\User-" + User)) {
		return true;
	} else {
		return false;
	}
};

const PathFoundForLabs = (Path, User) => 
{
    let folders = {};  

    if (fs.existsSync(Path + "\\User-" + User))
    {
        Path = Path + "\\User-" + User;
        if (fs.existsSync(Path + "\\DowLab-" + User))
        {
            folders["dow"] = true;
        }
        if(fs.existsSync(Path + "\\SindLab-" + User))
        {
            folders["sind"] = true;
        }
        if(fs.existsSync(Path + "\\AgaKhanLab-" + User))
        {           
            folders["aga"] = true;
        }
        return folders;
    } 
    else 
    {
        return false;
    }
};

//* Completed.
const CopyFolder = (Path, User, Path2) => {
	if (fs.existsSync(Path2 + "\\User-" + User)) {
		console.log("Already Created");
		return true;
	} else {
		Path = Path + "\\User-" + User;
		fs2.copy(Path, Path2 + "\\User-" + User);
		console.log("Copied to temp path");
		return true;
	}
};

const ReadValues = async (Path, User, Path2, Labname) => {
	let return_obj = [];
	if (Labname === "dow") {
		Path = Path + "\\User-" + User + `\\DowLab-` + User;
		Path2 = Path2 + "\\User-" + User + "\\DowLab-" + User;
		let Reports = fs.readdirSync(Path2);
		for (const current_report of Reports) {
			let ppath =
				"F:\\Projects\\FYP\\Temp\\User-" +
				User +
				"\\DowLab-" +
				User +
				"\\" +
				current_report;
			//let path = Path2 + "\\" + Reports[i];
			await DowPDFReader(ppath).then((result) => {
				result["File Name"] = current_report;
				result["Lab Name"] = "DowLab";
				return_obj.push(result);
				//return_obj.push(result);
			});
		}
		return return_obj;
	} else if (Labname === "sindlab") {
		Path = Path + "\\User-" + User + `\\SindLab-` + User;
		Path2 = Path2 + "\\User-" + User + "\\SindLab-" + User;
		let Reports = fs.readdirSync(Path2);
		for (const current_report of Reports) {
			let ppath =
				"F:\\Projects\\FYP\\Temp\\User-" +
				User +
				"\\SindLab-" +
				User +
				"\\" +
				current_report;
			//let path = Path2 + "\\" + Reports[i];
			await PDFReader(ppath).then((result) => {
				result["File Name"] = current_report;
				result["Lab Name"] = "SindLab";
				return_obj.push(result);
				//return_obj.push(result);
			});
		}
		return return_obj;
	} else {
		Path = Path + "\\User-" + User + `\\AgaKhanLab-` + User;
		Path2 = Path2 + "\\User-" + User + "\\AgaKhanLab-" + User;
		if (fs.existsSync(Path2 + "\\User-" + User + "\\AgaKhanLab-" + User)) {
			console.log("Path resolved: " + Path2);
			let Reports = fs.readdirSync(Path2);
			for (let i = 0; i < Reports.length; i++) {
				let path = Path2 + "//" + Reports[i];
				agha(path).then((result) => {
					result["File Name"] = Reports[i];
					return_obj.push(result);
				});
			}
			return return_obj;
		} else {
			console.log("Cannot resolve path: " + Path2);
			return "false";
		}
	}
};

const DeleteFolder = (Path, User) => {
	if (fs.existsSync(Path + "\\User-" + User)) {
		Path = Path + "\\User-" + User;
		rimraf.sync(Path);
		console.log("Folder Deleted");
	} else console.log("Folder Not Found");
};

async function PDFReader(path) {
	// object_to_return = {};
	// //First, Reading the content of the file.
	// await PdfParse(path).then((file_content) => {
	// 	const content = file_content.text.split("\n");
	// 	// content.splice(0, 4);
	// 	object_to_return["MR Number"] = content[2].split(":")[1].trim();
	// 	object_to_return["Patient Name"] = content[4].split(":")[1].trim();
	// 	if(object_to_return["Test Name"] = content[10].split('|')[1] === undefined)
	//     {
	//         object_to_return["Test Name"] = content[11].split('|')[1];
	//     }
	//     else
	//     {
	//         object_to_return["Test Name"] = content[10].split('|')[1];
	//     }
	// 	object_to_return["Requesting Physician"] = content[6].split(":")[1];
	// 	object_to_return["Lab No"] = content[8].split(":")[1];
	// 	if(object_to_return["Date "] = content[13] === 'Result')
	// 	{
	// 		object_to_return["Date "] = content[14]
	// 	}
	// 	else
	// 	{
	// 		object_to_return["Date "] = content[13];
	// 	}

	//});
	let object_to_return = {};
	await PdfParse(path).then((file_content) => {
		const content = file_content.text.split("\n");
		content.splice(0, 2);
		if (content.length > 8 && content[8].includes("Page")) {
			content.splice(8, 1);
		}
		object_to_return["Test Name"] = content[8];
		if (
			object_to_return["Test Name"].includes("Thyroid Profile") === true
		) {
			console.log("Thryoid Gland");
			object_to_return = MetaData(content, object_to_return);
		}else if (
			object_to_return["Test Name"].includes("HbA1c [HPLC]") === false &&
			object_to_return["Test Name"].includes("LDL Cholesterol") === false &&
			object_to_return["Test Name"].includes("Plasma Glucose") === false
		) {
			object_to_return = SimpleReports(content, object_to_return);
		}else {
			object_to_return = MultiLineReports(content, object_to_return);
		}
	});
	return object_to_return;
}

function SimpleReports(content, object_to_return) {
	object_to_return["MR Number"] = content[0].split(":")[1];
	object_to_return["Patient Name"] = content[2].split(":")[1];
	object_to_return["Gender "] = content[3].split("|")[2].trim();
	object_to_return["Age "] = content[3].split("|")[1].split(":")[1].trim();
	object_to_return["Ref. Consultant"] = content[4].split(":")[1];
	object_to_return["Date "] = content[7].split(":")[1];
	let attributes = [];
	for (let i = 13; i < content.length - 5; i++) {
		let currentObj = {};
		currentObj["Attribute"] = content[i];
		currentObj["Value"] = content[++i];
		//const unit = content[++i].match(/^[^0-9.<]+/);
		const range = content[++i].match(/[0-9. <-]*$/);
		currentObj["Unit"] = content[i].substring(
			0,
			content[i].length - range[0].length
		);
		if (range === "-") {
			range = "null";
		} else {
			currentObj["Range"] = range[0];
		}
		attributes.push(currentObj);
	}
	object_to_return["Attributes"] = attributes;
	return object_to_return;
}
function MultiLineReports(content, object_to_return) {
	let attributes = {};
	object_to_return["MR Number"] = content[0].split(":")[1];
	object_to_return["Patient Name"] = content[2].split(":")[1];
	object_to_return["Date "] = content[11];
	attributes["Attribute"] = content[13];
	let lookbehind = content[15].match(/.*(?=[A-Z])/);
	attributes["Value"] = content[14];
	attributes["Unit"] = lookbehind[0];
	object_to_return["Age "] = content[3].split("|")[1].split(":")[1];
	object_to_return["Gender "] = content[3].split("|")[2];
	let ranges = [];
	for (let j = 15; j < content.length - 1; j++) {
		if (content[j] === " ") {
			break;
		} else {
			if (j === 15) {
				ranges.push(content[j].split(lookbehind)[1]);
			} else {
				ranges.push(content[j]);
			}
			attributes["Ranges"] = ranges;
		}
	}
	object_to_return["Attribute"] = attributes;
	return object_to_return;
}
function MetaData(content, object_to_return)
{
	object_to_return["MR Number"] = content[0].split(":")[1];
	object_to_return["Patient Name"] = content[2].split(":")[1];
	object_to_return["Gender "] = content[3].split("|")[2].trim();
	object_to_return["Age "] = content[3].split("|")[1].split(":")[1].trim();
	object_to_return["Ref. Consultant"] = content[4].split(":")[1];
	object_to_return["Date "] = content[7].split(":")[1];
	return object_to_return;
}

async function DowPDFReader(path)
{
	object_to_return = {};
    //First, Reading the content of the file.
    await PdfParse(path).then((file_content) => {
        const content = file_content.text.split('\n');
        
        // console.log(content)
        let attributes = [];
        if(content[content.length-4] === 'VITAMIN D TOTAL (25-OH) D2+D3')
        {
            object_to_return["MR Number"] = content[3];
            object_to_return["Patient Name"] = content[10].split(':')[1].trim();
            object_to_return["Test Name"] = content[content.length-4];
            object_to_return["Requesting Physician"] = content[9];
            object_to_return["Lab No"] = content[7];
            object_to_return["Date "] = content[12];
            let tempObj = {};
            tempObj[`Attribute`]= content[14].match(/([A-Za-z]+[ ]?[A-Z]*[ ]?[A-Z]*)/)[0];
            tempObj[`Value`]= content[14].match(/([0-9]*[.]?[0-9]*[ ]*[a-z]*[\/][a-z]*)/g)[0];
            tempObj[`Unit`] = content[14].match(/(Vitamin[ ]D[ ][A-Za-z]*[ ][ ]+[<][0-9]+)/g)[0];
            console.log(content.length - 18)
            // for(let i = 0; i < content.length - 18; i++)
            // {
            //     tempObj[`Unit`] = content[i+14].match(/(Vitamin[ ]D[ ][A-Za-z]*[ ]+[<]?[0-9]+)/g)[0];
            // }
            attributes.push(tempObj);
        }
        else if(content[content.length-4] === 'URINE D/R')
        {
            object_to_return["MR Number"] = content[3];
            object_to_return["Patient Name"] = content[10].split(':')[1].trim();
            object_to_return["Test Name"] = content[content.length-4];
            object_to_return["Requesting Physician"] = content[9];
            object_to_return["Lab No"] = content[7];
            object_to_return["Date "] = content[12];
        
            for(let i = 0; i < content.length - 18; i++)
            {
                let tempObj = {};
                tempObj[`Attribute`]= content[i+14].match(/[ A-Za-z]+(?=NILNIL)|[ A-Za-z]+(?=NIL)|[ A-Za-z]+(?=NEGATIVENEGATIVE)|[ A-Za-z]+(?=CLEARCLEAR)|COLOR|[A-Za-z]+[ A-Za-z]*/)[0];
                tempObj[`Value`]= content[i+14].match(/NEGATIVE|POSITIVE|NIL|CLEAR|YELLOW|[0-9]+[-][0-9]?|[0-9]+[.]?[0-9]*|([<|> ]?[0-9]*[.]?[ -]*[ ]*[0-9]*[ ]?[a-zA-Z]*[ ]?[\/][ ]?[a-zA-Z]+(?=NEGATIVE))/g)[0];
                tempObj[`Unit`] = content[i+14].match(/(PALE[ ]YELLOW[ ]-YELLOW)|(CLEAR)|(NEGATIVE)|(0-4 \(HPF\))|(0-2 \(HPF\))|([ ]\([A-Z]*\))|(1.005[ ]-[ ]1.025|(5-8))/g)[0];
                attributes.push(tempObj);
            }
        }
        else if(content[content.length-4] === 'CBC & ESR')
        {
            object_to_return["MR Number"] = content[3];
            object_to_return["Patient Name"] = content[10].split(':')[1].trim();
            object_to_return["Test Name"] = content[content.length-4];
            object_to_return["Requesting Physician"] = content[9];
            object_to_return["Lab No"] = content[7];
            object_to_return["Date "] = content[12];
            console.log(content.length - 20)
            for(let i = 0; i < content.length - 20; i++)
            {
                let tempObj = {};
                tempObj[`Attribute`]= content[i+16].match(/([A-Z]*%?)/)[0];
                tempObj[`Value`]= content[i+16].match(/([0-9]+[.]?[0-9]?[ ][a-zA-Z]*[\/]?[a-zA-Z]*[ %]*[0-9^e\/A-Z]*)/g)[0];
                tempObj[`Unit`] = content[i+16].match(/([0-9]+[.]?[0-9]*[-][0-9]*[.]?[0-9]*)/g)[0];
                attributes.push(tempObj);
            }
        }
        else if(content[content.length-4] === 'URIC ACID')
        {
            object_to_return["MR Number"] = content[3];
            object_to_return["Patient Name"] = content[10].split(':')[1].trim();
            object_to_return["Test Name"] = content[content.length-4];
            object_to_return["Requesting Physician"] = content[9];
            object_to_return["Lab No"] = content[7];
            object_to_return["Date "] = content[12];
        
            for(let i = 0; i < content.length - 18; i++)
            {
                let tempObj = {};
                tempObj[`Attribute`]= content[i+14].match(/([A-Z]*)/)[0];
                tempObj[`Value`]= content[i+14].match(/([0-9]*[.]?[0-9]*[ ]?[a-z]*[\/][a-z]*)/g)[0];
                tempObj[`Unit`] = content[i+14].match(/([0-9]+[.]?[0-9]*[-][0-9]+[.]?[0-9]*)/g)[0];
                attributes.push(tempObj);
            }
        }
        else if(content[content.length-4] === 'SGPT')
        {
            object_to_return["MR Number"] = content[3];
            object_to_return["Patient Name"] = content[10].split(':')[1].trim();
            object_to_return["Test Name"] = content[content.length-4];
            object_to_return["Requesting Physician"] = content[9];
            object_to_return["Lab No"] = content[7];
            object_to_return["Date "] = content[12];
        
            for(let i = 0; i < content.length - 18; i++)
            {
                let tempObj = {};
                tempObj[`Attribute`]= content[i+14].match(/([A-Z]*[ ][\(][A-Z\)]+)/)[0];
                tempObj[`Value`]= content[i+14].match(/([0-9]+[ ][U][\/][L])/g)[0];
                tempObj[`Unit`] = content[i+14].match(/([<][0-9]+)/g)[0];
                attributes.push(tempObj);
            }
        }
        else
        {
            console.log("Invalid Report");
        }
        
        object_to_return["Attributes"] = attributes;
    });
    
    return object_to_return;
}

// CopyFolder(path, user, path2)
// ReadValues(path, user, path2)
// DeleteFolder(path2, user)
module.exports = { PathFound, CopyFolder, ReadValues, DeleteFolder, PathFoundForLabs };
