const jwt = require("jsonwebtoken");
const { User, Sheet, Certificate, Email } = require("../models/users");

const auth = async (req, res, next) => {
    if(!req.cookies.jwt){
        req.id = null;
        return next();
    }
    else{
        try{
            const token = req.cookies.jwt;
            const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
            const user = await User.findOne({_id:verifyUser._id});
            req.id = user._id;
            next();
        }catch(err){
            req.id = null;
            next();
        }
    }
}

module.exports = auth;