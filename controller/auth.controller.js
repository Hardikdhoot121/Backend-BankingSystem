const userModel = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const { sendRegistrationEmail } = require("../services/email.service.js");
const tokenBlackList = require("../models/blackList.model.js");

async function userRegisterController(req, res) {
  try {
    const { email, name, password } = req.body;

    // 1. check ki empty entry na ho
    if (!email || !name || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. check if user exists or not
    const isExist = await userModel.findOne({
      email: email,
    });

    if (isExist) {
      return res.status(422).json({
        message: "User already exists with the email.",
        status: "failed",
      });
    }

    // 3. create new user
    const user = await userModel.create({
      email,
      password,
      name,
    });

    // 4. sign JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "JWT_SECRET", {
      expiresIn: "1h",
    });

    user.token = token;
    await user.save();

    // 5. Send registration email
    try {
      await sendRegistrationEmail(user.email, user.name);
    } catch (emailErr) {
      console.error("⚠️ Failed to send welcome email:", emailErr.message);
    }

    res.cookie("token", token, {
      httpOnly: true,
    });

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        token: token,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function userLoginController(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // email kai saath saath i need one more field password for validation 
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid Email Address" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "JWT_SECRET", {
      expiresIn: "1h",
    });

    user.token = token;
    await user.save();

    res.cookie("token", token, {
      httpOnly: true,
    });

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        token: token,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function userLogoutController(req,res){
  // fetch the token from the req.cookies 
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];  
  if(!token){
    return res.status(400).json({message:"USER LOGGED OUT SUCCESSFULLY THROUGH THE END POINT /api/auth/logout"});
  }


  // sending it to the blackListDB model
  await tokenBlackList.create({
    token:token,
  });

  // now clear those cookies 
  res.cookie("token","",{
    httpOnly:true
  })
  
  res.status(200).json({message:"USER LOGGED OUT SUCCESSFULLY THROUGH THE END POINT /api/auth/logout"});
  
}

module.exports = {
  userRegisterController,
  userLoginController,
  userLogoutController,
};