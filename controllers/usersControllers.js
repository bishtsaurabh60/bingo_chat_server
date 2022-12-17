import asyncHandler from "express-async-handler"; // error handler for middleware
import User from "../models/userModel.js";
import generateToken from "../config/generateToken.js";

//@description     Register new user
//@route           POST /api/user/
//@access          Public
const registerUser = asyncHandler(async (req, res)=>{
  const { name, email, password, pic } = req.body;

  // Check if any of them is undefined
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all the Fields");
  }

  // Check if user already exists in our DB
  const userExists = await User.findOne({ email }).exec(); // {email:email} hence we used destructuring

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    pic, //we used object destructuring here bcz the keys and values are same
  });

  if (user)
    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token: generateToken(user._id),
    });
  else {
    res.status(400);
    throw new Error("Failed to create the user");
  }
});

//@description     Auth the user
//@route           POST /api/users/login
//@access          Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if any of them is undefined
  if (!email || !password) {
    return res.status(400).json({
      message: "Please enter all the fields",
    });
  }

  // Check if user already exists in our DB
  const user = await User.findOne({ email }).exec();

  // If user exists and password is verified
  if (user && (await user.matchPassword(password))) {
    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid Credentials");
  }
});


//@description     Get or Search all users
//@route           GET /api/user?search=
//@access          Public
const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  // Find and return users except current user
  const users = await User.find(keyword)
    .find({ _id: { $ne: req.user._id } })
    .exec();
  res.status(200).send(users);
});

export {registerUser, authUser, allUsers}