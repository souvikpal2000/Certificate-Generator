const jwt = require("jsonwebtoken");
const {User, Certificate} = require("../models/users");

const auth = async (req, res, next) => {
    if(!req.cookies.jwt){
        req.email = null;
        return next();
    }
    else{
        try{
            const token = req.cookies.jwt;
            const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
            const user = await User.findOne({_id:verifyUser._id});
            req.email = user.email;
            next();
        }catch(err){
            req.email = null;
            next();
        }
    }
}

module.exports = auth;