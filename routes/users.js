//Loading all the requirments.
const express = require("express");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const router = express.Router();
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const { SendEmailVerification, SendForgotPasswordLink } = require("./mailer");
const { v4: uuidv4 } = require("uuid");

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

//* Completed.
//Create User.
router.post("/create", async (req, res) => {
  const userName = req.body.name;
  const email = req.body.email;

  //! Stored procedure to check whether the email or username already taken or not.
  //#region
  const user_email_verification = `CALL chk_email(\"${email}\",\"${userName}\",@result); SELECT @result;`;
  connection.query(user_email_verification, async (errors, result) => {
    if (errors) {
      console.log(errors);
      return;
    }
    const result_query = result[1][0]["@result"].toString();
    if (result_query === "True Email") {
      console.log("I am here.");
      return res.status(401).send("Email already exist.");
    }
    if (result_query === "True Username") {
      console.log("I am here in true username");
      return res.status(401).send("Username already exist.");
    }
    //? Now we know that username and email both do not exist in the database.
    //? The user can be created.

    //#region
    //* Generating hashed password
    try {
      const salt = await bcrypt.genSalt();
      const hashed_password = await bcrypt.hash(req.body.password, salt);

      const new_entry_query = `CALL create_user(\"${userName}\", \"${email}\", \"${hashed_password}\", @output1, @output2); SELECT @output1, @output2`;

      connection.query(new_entry_query, (errors, result) => {
        if (errors) {
          console.log(errors);
          return;
        }

        const output1 = result[1][0]["@output1"].toString();
        const output2 = result[1][0]["@output2"].toString();

        const otp_query = `CALL add_otp(\"${output1}\", @_otpcode); SELECT @_otpcode;`;
        connection.query(otp_query, (error, result) => {
          if (error) {
            console.log(error);
            return res.status(401).send("Can't send email verification code.");
          }
          const otp_code = result[1][0]["@_otpcode"].toString();
          const response = SendEmailVerification(email, otp_code);

          if (response === "False") {
            console.log("Can't verify email.");
            return res.status(401).send("Can't send email verification code.");
          }
          res
            .status(200)
            .send(
              `User with id : ${output1} and Username : ${output2} successfully created.`
            );
          return;
        });
      });
    } catch (error) {
      res.status(500).send(error);
      return;
    }
  });
  //#endregion
  //#endregion
});

//* Verifying user email.
router.post("/verify", (req, res) => {
  const code = req.body.verify;
  const query = `CALL verify_user(\"${code}\", @_response); SELECT @_response;`;
  connection.query(query, (error, result) => {
    if (error) {
      console.log("Can't verify code right now.");
      return res.status(422).send("Query can't be executed right now.");
    }
    const otp_result = result[1][0]["@_response"].toString();
    if (otp_result === "True") {
      return res.status(200).send("Email succesfully verified.");
    }
    return res.status(422).send("Invalid code.");
  });
});

//* Done.
router.post("/login", (req, res) => {
  const email = req.body.loginUser;
  const password = req.body.loginPassword;
  let identify = "Username";

  if (email.includes("@")) {
    console.log("Username override.");
    identify = "Email";
  }
  const verify_email = `CALL chk_usr(\"${email}\", \"${identify}\", @_result); SELECT @_result;`;
  connection.query(verify_email, async (error, result) => {
    if (error) {
      return res
        .status(503)
        .send("Can't execute the query. Please try again later.");
    }

    const query_result = result[1][0]["@_result"].toString();

    //* Checking that email doesn't exist.
    if (query_result === "False") {
      return res.status(404).send("The entered email or password is invalid.");
    }

    //* Checking that email is verified or not.
    if (query_result === "Not Verified") {
      return res
        .status(401)
        .send("Your email is not verified. Please verify your email first.");
    }

    //* At this point. User password will be matched.
    if (await bcrypt.compare(password, query_result)) {
      const user_details_query = `CALL login(\"${email}\", \"${identify}\", @_id, @_email, @_username); SELECT @_id, @_email, @_username;`;
      connection.query(user_details_query, (seconderror, secondresult) => {
        if (seconderror) {
          return res.status(503).send("Can't connect to database.");
        }
        const query_id = secondresult[1][0]["@_id"].toString();
        const query_email = secondresult[1][0]["@_email"].toString();
        const query_username = secondresult[1][0]["@_username"].toString();
        const jwt_token = jwt.sign(
          {
            email: query_email,
            id: query_id,
            username: query_username,
          },
          "loginverificationkey"
        );
        return res
          .set("x-auth-token", jwt_token)
          .status(200)
          .send("Succesfull login");
      });
    }
  });
});

//* To be testd.
router.post("/forgot/password", (req, res) => {
  const email = req.body.forgotEmail;

  const query_verify_email = `CALL chk_email(\"${email}\", \"\", @_result); SELECT @_result;`;
  connection.query(query_verify_email, (error, result) => {
    if (error) {
      return res.status(503).send("Can't execute query.");
    }

    const query_result = result[1][0]["@_result"].toString();

    //* Check for the verification of the email.
    if (query_result === "False") {
      return res.status(401).send("The entered email is invalid.");
    }

    const forgot_password = uuidv4();

    const add_forgot_token = `CALL add_forget(\"${email}\",\"${forgot_password}\", @_result); SELECT @_result;`;

    connection.query(add_forgot_token, (seconderror, secondresult) => {
      if (seconderror) {
        return res.status(503).send("Database not responding.");
      }

      const add_forgot_result = secondresult[1][0]["@_result"].toString();

      if (add_forgot_result === "False") {
        return res.status(503).send("Can't save link.");
      }

      const send = SendForgotPasswordLink(email, forgot_password);

      if (send === "False") {
        return res.status(424).send("Can't send forgot passwordd rightnow.");
      }

      return res
        .status(200)
        .send(
          "Check your email. Forgot password link has been succesfully send."
        );
    });
  });
});

//* To be tested.
router.post("/confirm/password", async (req, res) => {
  const new_password = req.body.password;
  const token_link = req.body.token;

  const salt = await bcrypt.genSalt();
  const hashed_password = await bcrypt.hash(new_password, salt);

  console.log(token_link);

  const query = `CALL verify_forgot_link(\"${hashed_password}\", \"${token_link}\", @_result); SELECT @_result;`;
  connection.query(query, (error, result) => {
    if (error) {
      console.log("I am here.\n\n\n\n\n\n");
      console.log(error);
      return res.status(503).send("Database query can't run.");
    }

    const query_result = result[1][0]["@_result"].toString();

    if (query_result === "False") {
      return res.status(500).send("Internal server error.");
    }

    return res.status(200).send("Password succesfully changed.");
  });
});

router.post("/remove", (req, res) => {
  const query = "SET FOREIGN_KEY_CHECKS = 0; DELETE FROM test_size.users; DELETE FROM test_size.otp_user; SET FOREIGN_KEY_CHECKS = 1; INSERT INTO `test_size`.`users`(`usr_id`) VALUES (1);";
  connection.query(query, (error, result) => {
    if(error)
    {
      console.log(error);
      return res.status(503).send("Can't perform the action.");
    }
    return res.status(200).send("All users have been deleted.");
  });
});

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

handleDisconnect();

module.exports = router;
