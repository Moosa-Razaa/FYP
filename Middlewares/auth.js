const jwt = require("jsonwebtoken");

function Authorize(req, res, next)
{
    const token = req.get("x-auth-token");
    jwt.verify(token, "loginverificationkey", (error, user) => {
        if(error)
        {
            return res.status(404).send("Can't authorize user.");
        }
        req.body.user = user;
        next();
    });
}

module.exports = Authorize;