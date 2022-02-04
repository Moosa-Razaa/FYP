const express = require("express");
const user = require("./routes/users");
const dashboard = require("./routes/dashboard");
const cors = require("cors");
const app = express();

app.use(cors({exposedHeaders :"x-auth-token"}));
app.use(express.json());
app.use("/user", user);
app.use("/dashboard", dashboard.router);

dashboard.connect();
const PORT = process.env.PORT || 3500;

app.listen(PORT, () => console.log(`Listening on port : ${PORT}...`));