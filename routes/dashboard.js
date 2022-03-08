const express = require("express");
const mysql = require("mysql");
const fs = require("fs");
const auth = require("../Middlewares/auth");
const spawn = require("child_process").spawn;
const dotenv = require("dotenv");
const check = require("./check");
const { isError } = require("lodash");

const router = express.Router();

//* Configuring Environment Variables.
const dotenv_result = dotenv.config({ path: "Envs/dashboard.env" });
if (dotenv_result.error) {
	console.log(
		"Can't configure database.env properly. Exiting with code ENV ERROR."
	);
	process.exit();
}

//* Creating connection to database.
let connection = mysql.createConnection({
	host: process.env.Db_host, // Host will come here. Probably LocalHost.
	user: process.env.Db_user, // DB Username will be mentioned here.
	password: process.env.Db_password, //Password of the database. Mostly set by user.
	database: process.env.Db_database, //Name of the database.
	multipleStatements: true,
});

//* Completed
router.post("/downloadreport", auth, (req, res) => {
	const lab_name = req.body.labname;
	const user = req.body.user.username;
	const mrno = req.body.mr_number;
	const password = req.body.password;
	const path = process.env.reports_path;
	const temp_path = process.env.temp_path;
	//Will scrap the reports and download that in the folder.
	RunPythonFunction(lab_name, user, mrno, password)
		.then((resolve) => {
			if (resolve.length === 4) {
				//Just for confirmation : Checking whether the path exists or not.
				if (check.PathFound(path, user)) {
					//If the path exists, it CopyFolder will copy all the files in that folder to downloadreports.
					check.CopyFolder(path, user, temp_path);
				} else {
					return res.status(403).send("Can't copy the folder files.");
				}
				return res
					.status(200)
					.send("Reports have been downloaded successfully.");
			} else {
				return res
					.status(403)
					.send("Can't run the functions right now.");
			}
		})
		.catch((reject) => {
			return res.status(403).send("Username or password is invalid.");
		});
});

//* Completed - Tested
router.post("/reports", auth, async (req, res) => {
	const user = req.body.user.username;
	const user_id = req.body.user.id;
	const path = process.env.reports_path;
	const temp_path = process.env.temp_path;
	let is_error = false;

	const checkPathFound = check.PathFoundForLabs(path, user);
	if (!checkPathFound) {
		return res.status(404).send("Folder not found.");
	}

	if (check.PathFound(path, user)) {
		if (checkPathFound["sind"]) {
			//! Reading values from SindLab
			let read_values = await check.ReadValues(
				path,
				user,
				temp_path,
				"sindlab"
			);
			if (read_values === "false") {
				return res.status(503).send("Can't read reports.");
			}
			//Reading every PDF file from temp folder and deleting that folder.
			for (const current_obj of read_values) {
				const current_date = current_obj["Date "].split(",");
				const current_month = current_date[0].split(" ");
				//const current_date = current_obj["Date "].split("/");
				const date =
					current_date[1].trim() +
					"-" +
					current_month[0].trim() +
					"-" +
					current_date[1].trim(); //current_date[2] + "-" + current_date[1] + "-" + current_date[0];
				const query_filename_check = `CALL CheckExistingFile(${user_id}, \"${current_obj["File Name"]}\", @_result); SELECT @_result;`;
				connection.query(query_filename_check, (error, result) => {
					//console.log(result);
					if (error) {
						return res.status(503).send("Database not responding.");
					} else if (
						result[1][0]["@_result"].toString().trim().length === 5
					) {
						//user_id, mrno, report_name, report_date, lab_id, return report_id, download_report_id
						//console.log("I am still running......");
						const query = `CALL add_rpt(${user_id}, \"${current_obj["MR Number"]}\", \"${current_obj["Patient Name"]}\", \"${current_obj["Test Name"]}\", \"${date}\", 2, \"${current_obj["File Name"]}\", @_report_id, @_download_id); SELECT @_report_id, @_download_id;`;
						connection.query(query, (error, result) => {
							if (error) {
								is_error = true;
								console.log(error);
								return res
									.status(503)
									.send("Database server down.");
							}
							const report_id = result[1][0]["@_report_id"];
							const download_id = result[1][0]["@_download_id"];
							if (current_obj.hasOwnProperty("Attributes")) {
								for (const obj of current_obj["Attributes"]) {
									//report_id, download_id, aatribute_name, attr_value, range, status
									const add_attribute = `CALL add_attrib(${report_id}, ${download_id}, "${obj["Attribute"]}", "${obj["Value"].trim() + obj["Unit"]}", "${obj["Range"]}", @_status); SELECT @_status;`;
									connection.query(
										add_attribute,(error, result) => {
											if (error) 
											{
												console.log(error);
												is_error = true;
												return res.status(503).send("Attributes : Database server down.");
											} 
											else 
											{
												const attr_result = result[1][0]["@_status"];
												if (attr_result !== "success") {
													console.log("Attribute not added correctly.");
													is_error = true;
													return res.status("503").send("Database can't save attributes.");
												}
											}
										}
									);
								}
							}
							if(current_obj.hasOwnProperty("Attribute"))
							{
								console.log("-------------------------------------");
								console.log(current_obj);
								console.log("-------------------------------------");
								const currentAttribute = current_obj["Attribute"];
								const add_attribute = `CALL add_attrib(${report_id}, ${download_id}, "${currentAttribute["Attribute"]}", "${currentAttribute["Value"].trim() + currentAttribute["Unit"]}", "${currentAttribute["Ranges"].join(", ")}", @_status); SELECT @_status;`;
								console.log(add_attribute);
								connection.query(
									add_attribute,(error, result) => {
										if (error) 
										{
											console.log(error);
											is_error = true;
											return res.status(503).send("Attributes : Database server down.");
										} 
										else 
										{
											const attr_result = result[1][0]["@_status"];
											if (attr_result !== "success") {
												console.log("Attribute not added correctly.");
												is_error = true;
												return res.status("503").send("Database can't save attributes.");
											}
										}
									}
								);
							}
						});
					}
				});
			}
		}

		//! Reading values from DowLab
		if (checkPathFound["dow"]) {
			let dowReadValues = await check.ReadValues(
				path,
				user,
				temp_path,
				"dow"
			);
			if (dowReadValues === "false") {
				return res.status(503).send("Can't read reports.");
			} else {
				//console.log(dowReadValues);
				for (const current_obj of dowReadValues) {
					//const current_date = current_obj["Date "].split(",");
					//const current_month = current_date[0].split(" ");
					//const current_date = current_obj["Date "].split("/");
					const date = current_obj["Date "]; //current_date[2] + "-" + current_date[1] + "-" + current_date[0];
					const query_filename_check = `CALL CheckExistingFile(${user_id}, \"${current_obj["File Name"]}\", @_result); SELECT @_result;`;
					connection.query(query_filename_check, (error, result) => {
						//console.log(result);
						if (error) {
							return res
								.status(503)
								.send("Database not responding.");
						} else if (
							result[1][0]["@_result"].toString().trim()
								.length === 5
						) {
							//user_id, mrno, report_name, report_date, lab_id, return report_id, download_report_id
							//console.log("I am still running......");
							const query = `CALL add_rpt(${user_id}, \"${current_obj["MR Number"]}\", \"${current_obj["Patient Name"]}\", \"${current_obj["Test Name"]}\", \"${date}\", 1, \"${current_obj["File Name"]}\", @_report_id, @_download_id); SELECT @_report_id, @_download_id;`;
							connection.query(query, (error, result) => {
								if (error) {
									is_error = true;
									console.log(error);
									return res
										.status(503)
										.send("Database server down.");
								}
								const report_id = result[1][0]["@_report_id"];
								const download_id =
									result[1][0]["@_download_id"];
								if (current_obj.hasOwnProperty("Attributes")) {
									for (const obj of current_obj[
										"Attributes"
									]) {
										//report_id, download_id, aatribute_name, attr_value, range, status
										const add_attribute = `CALL add_attrib(${report_id}, ${download_id}, "${obj["Attribute"]}", "${obj["Value"].trim()}", "${obj["Unit"]}", @_status); SELECT @_status;`;

										//console.log(add_attribute);
										connection.query(
											add_attribute,
											(error, result) => {
												if (error) {
													console.log(error);
													is_error = true;
													return res
														.status(503)
														.send(
															"Attributes : Database server down."
														);
												} else {
													const attr_result =
														result[1][0][
															"@_status"
														];
													if (
														attr_result !==
														"success"
													) {
														console.log(
															"Attribute not added correctly."
														);
														is_error = true;
														return res
															.status("503")
															.send(
																"Database can't save attributes."
															);
													}
												}
											}
										);
									}
								}
							});
						}
					});
				}
			}
		}
	}

	setTimeout(() => {
		if (!is_error) {
			const all_reports_query = `SELECT * FROM test_size.allreport WHERE usr_id = ${user_id};`;
			return_obj = [];
			connection.query(all_reports_query, (error2, rows) => {
				if (error2) {
					return res
						.status(503)
						.send("Can't retrieve data from database.");
				}
				for (const current of rows) {
					obj_related = {};
					obj_related["patient_id"] = current["patientid"];
					obj_related["report_download_id"] = current["rpt_down_id"];
					obj_related["lab_name"] = current["lab_nm"];
					obj_related["report_name"] = current["rpt_nm"];
					obj_related["patient_name"] = current["patientname"];
					obj_related["sample_date"] = current["Sample_date"];
					obj_related["mr_number"] = current["mr_num"];
					return_obj.push(obj_related);
				}
				console.log(return_obj);
				console.log("Response send successfully.");
				return res.status(200).send(return_obj);
			});
		}
	}, 30000);

	// const all_reports_query = `SELECT * FROM test_size.allreport WHERE usr_id = ${user_id};`;
	// console.log("Hhehehe! I run before.");
	// return_obj = [];
	// connection.query(all_reports_query, (error2, rows) => {
	// 	if (error2) {
	// 		return res.status(503).send("Can't retrieve data from database.");
	// 	}
	// 	for (const current of rows) {
	// 		obj_related = {};
	// 		obj_related["report_download_id"] = current["rpt_down_id"];
	// 		obj_related["lab_name"] = current["lab_nm"];
	// 		obj_related["report_name"] = current["rpt_nm"];
	// 		obj_related["patient_name"] = current["patientname"];
	// 		obj_related["sample_date"] = current["Sample_date"];
	// 		obj_related["mr_number"] = current["mr_num"];
	// 		return_obj.push(obj_related);
	// 	}
	// 	console.log(return_obj);
	// 	console.log("Response send successfully.");
	// 	return res.status(200).send(return_obj);
	// });
});

//*Completed
router.post("/get/report", auth, (req, res) => {
	const user = req.body.user.username;
	const report_id = req.body.download_report_id;
	const lab_name = req.body.lab_name.substring(0, 4) + "Lab";

	const query = `CALL get_rpt(${report_id}, @_file_name); SELECT @_file_name;`; //Query to return the report with that username.
	connection.query(query, (error, result) => {
		if (error) {
			return res.status(503).send("Can't connect to database.");
		}
		res.contentType("application/pdf");
		const file_path =
			process.env.reports_path +
			`\\User-${user}\\${lab_name}-${user}\\` +
			result[1][0]["@_file_name"].toString();
		const file_data = fs.readFileSync(file_path);
		return res.status(200).send(file_data);
	});
});

router.post("/get/report/view", auth, (req, res) => {
	const reportId = req.body.download_report_id;
	console.log(`Id : ${reportId}`);
	const query = `SELECT * FROM reportdetail WHERE rpt_down_id = ${reportId};`;
	const userData = `SELECT * FROM allreport WHERE rpt_down_id = ${reportId};`;

	connection.query(query, (error, rows) => {
		if (error) {
			return res
				.status(503)
				.send("Can't get report details from database.");
		} else {		
			let objToReturn = {};
			objToReturn["Attributes"] = [];
			for (const currentObj of rows) {
				objToReturn["Attributes"].push({
					Attribute: currentObj["attri_nm"],
					Value: currentObj["value"],
					Range: currentObj["range"],
				});
			}
			connection.query(userData, (error2, rows2) => {
				if(error2)
				{
					return res.status(503).send("Can't get metadata of reports from database.");
				}
				console.log(rows2);
				objToReturn["Test Name"] = rows2[0]["rpt_nm"];
				objToReturn["Sample Date"] = rows2[0]["Sample_date"];
				objToReturn["Lab Name"] = rows2[0]["lab_nm"];
				objToReturn["Patient Name"] = rows2[0]["patientname"];
				objToReturn["MR Number"] = rows2[0]["mr_num"];

				console.log(objToReturn);
				return res.status(200).send(objToReturn);
			});			
		}
	});
});

router.post("/compare/report", auth, (req, res) => {
	const reportName = req.body.report_name;
	const userId = req.body.user.userId;
});

//Function to download reports.
function RunPythonFunction(lab_name, user, mrno, password) {
	let output;
	const pyProg = spawn("python", [
		"F:\\Projects\\FYP\\Backend\\routes\\main.py",
		lab_name,
		user,
		mrno,
		password,
	]);
	return new Promise((resolve, reject) => {
		pyProg.stdout.on("data", function (data) {
			output = data.toString().trim();
			if (output.length === 4) {
				resolve(output);
			} else {
				reject(output);
			}
		});
	});
}

function handleDisconnect() {
	connection = mysql.createConnection({
		host: process.env.Db_host, // Host will come here. Probably LocalHost.
		user: process.env.Db_user, // DB Username will be mentioned here.
		password: process.env.Db_password, //Password of the database. Mostly set by user.
		database: process.env.Db_database, //Name of the database.
		multipleStatements: true,
	}); // Recreate the connection, since                                                    // the old one cannot be reused.
	connection.connect(function (err) {
		// The server is either down
		if (err) {
			// or restarting (takes a while sometimes).
			console.log("Database connection dropped...");
			setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
		} else {
			console.log("Database reconnected.");
		} // to avoid a hot loop, and to allow our node script to
	}); // process asynchronous requests in the meantime.                                        // If you're also serving http, display a 503 error.
	connection.on("error", function (err) {
		if (err.code === "PROTOCOL_CONNECTION_LOST") {
			// Connection to the MySQL server is usually
			handleDisconnect(); // lost due to either server restart, or a
		} else {
			// connnection idle timeout (the wait_timeout
			throw err; // server variable configures this)
		}
	});
}

function ReadValues(read_values, user_id) {
	let counter = 0;
	return new Promise((resolve, reject) => {
		for (const current_obj of read_values) {
			const current_date = current_obj["Date "].split(",");
			const current_month = current_date[0].split(" ");
			const date =
				current_date[1].trim() +
				"-" +
				current_month[0].trim() +
				"-" +
				current_date[1].trim();
			console.log(date);
			const query_filename_check = `CALL CheckExistingFile(${user_id}, \"${current_obj["File Name"]}\", @_result); SELECT @_result;`;
			connection.query(query_filename_check, (error, result) => {
				if (error) {
					reject(false);
				} else if (
					result[1][0]["@_result"].toString().trim().length === 5
				) {
					//user_id, mrno, report_name, report_date, lab_id, return report_id, download_report_id
					const query = `CALL add_rpt(${user_id}, \"${current_obj["MR Number"]}\", \"${current_obj["Patient Name"]}\", \"${current_obj["Test Name"]}\", \"${date}\", 2, \"${current_obj["File Name"]}\", @_report_id, @_download_id); SELECT @_report_id, @_download_id;`;
					connection.query(query, (error) => {
						if (error) {
							console.log(error);
							reject(false);
						}
						counter++;
						if (counter === read_values.length) {
							resolve(true);
						}
					});
				}
			});
		}
		resolve(true);
	});
}

handleDisconnect();

module.exports = { router: router, connect: handleDisconnect };
