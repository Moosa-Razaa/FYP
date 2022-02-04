const express = require("express");
const mysql = require("mysql");
const fs = require("fs");
const auth = require("../Middlewares/auth");
const spawn = require("child_process").spawn;
const dotenv = require("dotenv");
const check = require("./check");

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
const connection = mysql.createConnection({
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
      if (resolve.length > 0) {
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
        return res.status(403).send("Can't run the functions right now.");
      }
    })
    .catch((reject) => {
      return res.status(403).send(reject);
    });
});

//* Completed
router.post("/reports", auth, (req, res) => {
  const user = req.body.user.username;
  const user_id = req.body.user.id;
  const path = process.env.reports_path;
  const temp_path = process.env.temp_path;

  if (check.PathFound(path, user)) {
    const read_values = check.ReadValues(path, user, temp_path);
    if (!read_values) {
      return res.status(503).send("Can't read reports.");
    }

    //Reading every PDF file from temp folder and deleting that folder.
    for (const current_obj of read_values) {
      const current_date = current_obj["Date "].split("/");
      const date =
        current_date[2] + "-" + current_date[1] + "-" + current_date[0];
      //user_id, mrno, report_name, report_date, lab_id, return report_id, download_report_id
      const query = `CALL add_rpt(${user_id}, \"${current_obj["MR Number"]}\", \"${current_obj["Test Name"]}\", \"${date}\", ${lab_id}, ${current_obj["File Name"]}, @_report_id, @_download_id); SELECT @_report_id, @_download_id;`;
      connection.query(query, (error, result) => {
        if (error) {
          return res.status(503).send("Database server down.");
        }
        const report_id = result[1][0]["@_report_id"];
        if (report_id > -1) {
        }
      });
    }
    const all_reports_query = `SELECT * FROM test_size.allreport WHERE usr_id = ${user_id};`;
    return_obj = [];
    connection.query(all_reports_query, (error2, rows) => {
      if (error2) {
        return res.status(503).send("Can't retrieve data from database.");
      }
      for (const current of rows) {
        obj_related = {};
        obj_related["report_download_id"] = current["rpt_down_id"];
        obj_related["lab_name"] = current["lab_nm"];
        obj_related["report_name"] = current["rpt_nm"];
        obj_related["patient_name"] = current["patientname"];
        return_obj.push(obj_related);
      }
      return res.status(200).send(return_obj);
    });
  }
});

//*Completed
router.post("/get/report", auth, (req, res) => {
  const user = req.body.user.username;
  const report_id = parseInt(req.body.id);
  const lab_name = req.body.lab_name;

  const query = `CALL get_rpt(${report_id}, @_file_name; SELECT @_file_name;)`; //Query to return the report with that username.
  connection.query(query, (error, result) => {
    if (error) {
      return res.status(503).send("Can't connect to database.");
    }
    res.contentType("application/pdf");
    const file_path = process.env.reports_path + `\\User-${user}\\${lab_name}-${user}\\` +  result[1][0]["@_file_name"].toString();
    const file_data = fs.readFileSync(file_path);
    return res.status(200).send(file_data);
  });
});

//Function to download reports.
function RunPythonFunction(lab_name, user, mrno, password) {
  let output;
  const pyProg = spawn("python", [
    "F:\\Projects\\FYP\\routes\\main.py",
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

module.exports = router;
