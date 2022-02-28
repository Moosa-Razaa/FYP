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
		if (fs.existsSync(Path2 + "\\User-" + User + "\\DowLab-" + User)) {
			console.log("Path resolved: " + Path2);
			let Reports = fs.readdirSync(Path2);
			for (let i = 0; i < Reports.length; i++) {
				let path = Path2 + "\\" + Reports[i];
				dow(path).then((result) => {
					result["File Name"] = Reports[i];
					return_obj.push(result);
				});
			}
			return return_obj;
		} else {
			console.log("Cannot resolve path: " + Path2);
			return "false";
		}
	} else if (Labname === "sindlab") {
		Path = Path + "\\User-" + User + `\\SindLab-` + User;
		Path2 = Path2 + "\\User-" + User + "\\SindLab-" + User;
		let Reports = fs.readdirSync(Path2);
		for (const current_report of Reports) {
            let ppath = "F:\\Projects\\FYP\\Temp\\User-" + User + "\\SindLab-" + User + "\\" + current_report;
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
		//12
		object_to_return["MR Number"] = content[0].split(":")[1];
		object_to_return["Patient Name"] = content[2].split(":")[1];
		object_to_return["Gender "] = content[3].split("|")[2].trim();
		object_to_return["Age "] = content[3]
			.split("|")[1]
			.split(":")[1]
			.trim();
		object_to_return["Ref. Consultant"] = content[4].split(":")[1];
		object_to_return["Date "] = content[7].split(":")[1];
		object_to_return["Test Name"] = content[8];
		if (
			object_to_return["Test Name"].includes("HbA1c [HPLC]") === false &&
			object_to_return["Test Name"].includes("LDL Cholesterol") === false &&
			object_to_return["Test Name"].includes("Plasma Glucose") ===  false
		) {
			let attributes = [];
			for (let i = 13; i < content.length - 3; i++) {
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
		}
	});
	return object_to_return;
}

// CopyFolder(path, user, path2)
// ReadValues(path, user, path2)
// DeleteFolder(path2, user)
module.exports = { PathFound, CopyFolder, ReadValues, DeleteFolder };
