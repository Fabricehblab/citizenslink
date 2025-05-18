const express = require("express");
const app = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
require("dotenv").config();

const multer = require("multer");
const fs = require("fs");
const uploadDocument = multer({ dest: "public/docs" });

const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

// Middleware to parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const sessionStore = new MySQLStore({}, db);
// set up session middleware
app.use(
  session({
    key: "CitizenLink",
    secret: "CitizenLinkSecret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);
//render login
 app.get("/login", (req, res) => {
  res.render("login", { content: "" });
});
//  check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.session_id) {
    next();
  } else {
    res.render("login", { content: "" });
  }
}
// ==========Super admin===============

//render home page
app.get("/", (req, res) => {
  res.render("home");
});

// district account page
app.get("/addaccount", (req, res) => {
  res.render("admin/addaccount");
});
// district account page
app.get("/addaccountsector", (req, res) => {
  res.render("admin/addaccountsector", { content: "" });
});

// cell account page
app.get("/addcellaccount", (req, res) => {
  res.render("admin/addcellaccount", { content: "" });
});

// render profile
app.get("/profile", (req, res) => {
  res.render("admin/profile");
});
// render edit
app.get("/edit", (req, res) => {
  res.render("admin/edit");
});
 
// ==============Cell==================
// render addcase
app.get("/addcase", isAuthenticated, (req, res) => {
  res.render("cell/addcase", { content: "", contents: "" });
});
// render edit cell
app.get("/celledit", (req, res) => {
  res.render("cell/edit");
});

// render for get password
app.get("/forgetpassword", (req, res) => {
  res.render("forgetpassword", { content: "" });
});

// render reset password page
app.get("/reset", (req, res) => {
  const username = req.query.email;
  req.session.globalUsername = username;
  res.render("reset", { content: "" });
});

// Super admin login
app.post("/adminLogin", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(401).json({ message: "No field must be empty" });
  } else {
    const checkEmail =
      "SELECT username,password from superadmin WHERE username=?";
    db.query(checkEmail, [username], async (error, result) => {
      if (error) throw error;
      if (result.length > 0) {
        const user = result[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
          res.status(201).json({ message: "Welcome" });
        } else {
          res.status(404).json({ message: "Invalid password" });
        }
      } else {
        console.log("Wrong cridatials");
      }
    });
  }
});

// Super admin cretate account
// app.post("/adminSignup",async(req,res)=>{
//   const {username,password} = req.body;
//   if(!username || !password){
//     res.status(401).json({message:"No field must be empty"});
//   }else{
//     const HashPassword=await bcrypt.hash(password,10);;
//     const query="INSERT INTO superadmin SET ?";
//     const values={username,password:HashPassword};

//     db.query(query,values,async(error,result)=>{
//       if(error) throw error;
//       res.status(200).json({result:result});
//     })

//   }
// });

// create district account
app.post("/admin/create", async (req, res) => {
  const { province, district, username, status, level } = req.body;
  // random password
  let mixedArray = [];
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < 3; i++) {
    mixedArray.push(Math.floor(Math.random() * 9) + 1);
  }
  for (let i = 0; i < 3; i++) {
    mixedArray.push(
      characters.charAt(Math.floor(Math.random() * characters.length))
    );
  }
  mixedArray = mixedArray.sort(() => Math.random() - 0.5);
  let password = mixedArray.join("");

  const HashPassword = await bcrypt.hash(password, 8);
  const valquery = "SELECT * FROM leaders WHERE district=? OR username=?";
  const validData = [district, username];
  db.query(valquery, validData, (error, result) => {
    if (error) throw error;
    if (result.length > 0) {
      console.log("Datas available");
      res.status(300).json({ message: "Credentials have already been used." });
    } else {
      const query = "INSERT INTO leaders SET ?";
      const datas = {
        province,
        district,
        username,
        password: HashPassword,
        status,
        level
      };
      db.query(query, datas, (error, result) => {
        if (error) throw error;
        // res.send(result);
      });

      // send email to end users
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASS
        }
      });

      const mailOption = {
        from: {
          name: "CitizenLink",
          address: process.env.EMAIL
        },
        to: `${username}`, // list of receivers
        subject: "Welcome to CitizenLink",
        text: "Use this Username and password to login ",
        html: ` 
  Username:
  <b>${username}<b/>
  password:<b>
  ${password}</b>
 <br/>
  https://citizenlink.onrender.com/login
  `,

        html: ` 
        <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="display: flex; justify-content: center; align-items: center; text-align: center; margin-top: 5px; font-family: Arial, sans-serif;">
    
        <div style="width: 100%; max-width: 50%; padding: 10px; background-color: #ffffff; border-radius: 15px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);   justify-content: center; align-items: center; text-align: center;">
               
            <img style="width: 80px;" src="https://cdn-icons-png.flaticon.com/512/5087/5087579.png" alt="">
            <h1 style="margin-top: 13px; margin-bottom: 20px; font-size: 14px;  text-align:center;">Use this credential to login as <b>${district}</b> Leader.</h1>
            <p>Please remember to change your password after login</p>
            <p>  Username: <span style="color:blue;">${username}</span>.</p>
            <p style="margin-bottom: 30px; ">Password: <span style="color:blue;">${password}</span>.</p>
             <button style="background-color: #1E3A8A; padding: 8px 20px; width: 208px; color: white; text-decoration: none; border-radius: 15px; font-size: 18px; display: inline-block; margin-bottom: 80px;">
                <a href="https://citizenlink.onrender.com/login" style="color: white; text-decoration: none; border:none;">Join Now</a>
            </button>
            <div style="width: 100%; border-top: 1px solid #000; margin-top: 80px;"></div>
            <p style="margin-top: 40px;">©2024 CitizenLink</p>
        </div>
    
    </body>
    </html>

  `
      };
      const sendMail = async (transporter, mailOption) => {
        try {
          await transporter.sendMail(mailOption);
          res
            .status(200)
            .json({ message: `Login cridatials sent to ${username}` });
        } catch (error) {
          console.error(error);
        }
      };
      sendMail(transporter, mailOption);
      // end of send email to end users
    }
  });
});

// create cell account
app.post("/admin/createcell", async (req, res) => {
  const { province, district, sector, cell, username, status, level } =
    req.body;
  // random password
  let mixedArray = [];
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < 3; i++) {
    mixedArray.push(Math.floor(Math.random() * 9) + 1);
  }
  for (let i = 0; i < 3; i++) {
    mixedArray.push(
      characters.charAt(Math.floor(Math.random() * characters.length))
    );
  }
  mixedArray = mixedArray.sort(() => Math.random() - 0.5);
  let password = mixedArray.join("");

  const HashPassword = await bcrypt.hash(password, 8);
  const valquery =
    "SELECT * FROM leaders WHERE district=? AND sector=? AND cell=? OR username=?";
  const validData = [district, sector, cell, username];
  db.query(valquery, validData, (error, result) => {
    if (error) throw error;
    if (result.length > 0) {
      console.log("Datas available");
      return res.render("admin/addcellaccount", {
        content: "Cridatials have aready used"
      });
      // res.status(300).json({message:"Cridatials have aready used"})
    } else {
      const query = "INSERT INTO leaders SET ?";
      const datas = {
        province,
        district,
        sector,
        cell,
        username,
        password: HashPassword,
        status,
        level
      };
      db.query(query, datas, (error, result) => {
        if (error) throw error;
      });

      // send email to end users

      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASS
        }
      });
      const mailOption = {
        from: {
          name: "CitizenLink",
          address: process.env.EMAIL
        },
        to: `${username}`, // list of receivers
        subject: "Welcome to CitizenLink",
        text: "Use this Username and password to login ",

        html: ` 
        <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="display: flex; justify-content: center; align-items: center; text-align: center; margin-top: 5px; font-family: Arial, sans-serif;">
    
        <div style="width: 100%; max-width: 50%; padding: 10px; background-color: #ffffff; border-radius: 15px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);   justify-content: center; align-items: center; text-align: center;">
               
            <img style="width: 80px;" src="https://cdn-icons-png.flaticon.com/512/5087/5087579.png" alt="">
            <h1 style="margin-top: 13px; margin-bottom: 20px; font-size: 14px;  text-align:center;">Use this credential to login as <b>${district}</b> Leader.</h1>
            <p>Please remember to change your password after login</p>
            <p>  Username: <span style="color:blue;">${username}</span>.</p>
            <p style="margin-bottom: 30px; ">Password: <span style="color:blue;">${password}</span>.</p>
             <button style="background-color: #1E3A8A; padding: 8px 20px; width: 208px; color: white; text-decoration: none; border-radius: 15px; font-size: 18px; display: inline-block; margin-bottom: 80px;">
                <a href="https://citizenlink.onrender.com/login" style="color: white; text-decoration: none; border:none;">Join Now</a>
            </button>
            <div style="width: 100%; border-top: 1px solid #000; margin-top: 80px;"></div>
            <p style="margin-top: 40px;">©2024 CitizenLink</p>
        </div>
    
    </body>
    </html>

  `
      };
      const sendMail = async (transporter, mailOption) => {
        try {
          await transporter.sendMail(mailOption);
          res.render("admin/addcellaccount", {
            content: `Login cridatials sent to ${username}`
          });

          //  res.status(200).json({message:`Login cridatials sent to ${username}`});
        } catch (error) {
          console.error(error);
        }
      };
      sendMail(transporter, mailOption);
    }
  });
});
// create cell account
app.post("/admin/createsector", async (req, res) => {
  const { province, district, sector, username, status, level } =
    req.body;
  // random password
  let mixedArray = [];
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < 3; i++) {
    mixedArray.push(Math.floor(Math.random() * 9) + 1);
  }
  for (let i = 0; i < 3; i++) {
    mixedArray.push(
      characters.charAt(Math.floor(Math.random() * characters.length))
    );
  }
  mixedArray = mixedArray.sort(() => Math.random() - 0.5);
  let password = mixedArray.join("");

  const HashPassword = await bcrypt.hash(password, 8);
  const valquery =
    "SELECT * FROM leaders WHERE district=? AND sector=? AND username=?";
  const validData = [district, sector, username];
  db.query(valquery, validData, (error, result) => {
    if (error) throw error;
    if (result.length > 0) {
      console.log("Datas available");
      return res.render("admin/addcellaccount", {
        content: "Cridatials have aready used"
      });
      // res.status(300).json({message:"Cridatials have aready used"})
    } else {
      const query = "INSERT INTO leaders SET ?";
      const datas = {
        province,
        district,
        sector,
         username,
        password: HashPassword,
        status,
        level
      };
      db.query(query, datas, (error, result) => {
        if (error) throw error;
      });

      // send email to end users

      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASS
        }
      });
      const mailOption = {
        from: {
          name: "CitizenLink",
          address: process.env.EMAIL
        },
        to: `${username}`, // list of receivers
        subject: "Welcome to CitizenLink",
        text: "Use this Username and password to login ",

        html: ` 
        <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="display: flex; justify-content: center; align-items: center; text-align: center; margin-top: 5px; font-family: Arial, sans-serif;">
    
        <div style="width: 100%; max-width: 50%; padding: 10px; background-color: #ffffff; border-radius: 15px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);   justify-content: center; align-items: center; text-align: center;">
               
            <img style="width: 80px;" src="https://cdn-icons-png.flaticon.com/512/5087/5087579.png" alt="">
            <h1 style="margin-top: 13px; margin-bottom: 20px; font-size: 14px;  text-align:center;">Use this credential to login as <b>${district}</b> Leader.</h1>
            <p>Please remember to change your password after login</p>
            <p>  Username: <span style="color:blue;">${username}</span>.</p>
            <p style="margin-bottom: 30px; ">Password: <span style="color:blue;">${password}</span>.</p>
             <button style="background-color: #1E3A8A; padding: 8px 20px; width: 208px; color: white; text-decoration: none; border-radius: 15px; font-size: 18px; display: inline-block; margin-bottom: 80px;">
                <a href="https://citizenlink.onrender.com/login" style="color: white; text-decoration: none; border:none;">Join Now</a>
            </button>
            <div style="width: 100%; border-top: 1px solid #000; margin-top: 80px;"></div>
            <p style="margin-top: 40px;">©2024 CitizenLink</p>
        </div>
    
    </body>
    </html>

  `
      };
      const sendMail = async (transporter, mailOption) => {
        try {
          await transporter.sendMail(mailOption);
          res.render("admin/addaccountsector", {
            content: `Login cridatials sent to ${username}`
          });

          //  res.status(200).json({message:`Login cridatials sent to ${username}`});
        } catch (error) {
          console.error(error);
        }
      };
      sendMail(transporter, mailOption);
    }
  });
});

// Registers a new user in the system
app.post("/register", async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    res.status(401).json({ message: "No fieled must be empty" });
  } else {
    // check if email is already used
    const checkEmail = "SELECT email FROM users WHERE email=?";
    db.query(checkEmail, [email], async (error, results) => {
      if (error) throw error;
      // Optionally, automatically log the user in after registration
      // req.session.session_id = results.insertId;
      if (results.length > 0) {
        res.status(200).json({ message: "Email already registered" });
      } else {
        const query = "INSERT INTO users SET ?";
        const HashPassword = await bcrypt.hash(password, 10);
        const user = { username, password: HashPassword, email };
        db.query(query, user, (error, results) => {
          if (error) throw error;
          res.send(results);
        });
      }
    });
  }
});

//Leaders login
app.post("/aut/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(403).json({ message: "No field must be empty" });
  } else {
    if (username=="admin@gmail.com" && password=="admin") {
          return  res.redirect("/superadmins");
          }
    const query = "SELECT * FROM leaders WHERE username = ?";
    db.query(query, [username], async (error, results) => {
      if (error) throw error;

      if (results.length > 0) {
        console.log(username);

        let user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
          req.session.session_id = user.administrationId;

          // res.redirect("/cell")
          if (user.level == "Cell") {
            req.session.administrationId = results[0].administrationId;

            req.session.cell = results[0].cell;
            req.session.sector = results[0].sector;
            req.session.district = results[0].district;

            res.redirect("/cell");
          } else if (user.level == "District") {
            res.render("login", {
              content: "District Page not found right now"
            });
          }else if(user.level == "Sector"){
            res.redirect("/sector");
          }

        } else {
          res.render("login", { content: "Wrong username or password" });
        }
      } else {
        res.render("login", { content: "Wrong username or password" });
      }
    });
  }
});

// all users
app.get("/superadmins", async (req, res) => {
  const query = "SELECT * FROM leaders";
  db.query(query, (error, result) => {
    if (error) throw error;
    // res.status(200).json({message:result});
    res.render("admin/dashboard", { message: result });
  });
});

// Activated accounts
app.get("/admin/activeAccounts", (req, res) => {
  const query = "SELECT * FROM leaders WHERE status ='active'";
  db.query(query, (error, result) => {
    if (error) throw error;
    res.json(result);
  });
});

// forget password
app.post("/resetpassword", (req, res) => {
  const { email } = req.body;
  console.log(email);
  // send email to end users
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS
    }
  });
  const mailOption = {
    from: {
      name: "CitizenLink",
      address: process.env.EMAIL
    },
    to: `${email}`, // list of receivers
    subject: "Password recovery",

    html: ` 
        <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="display: flex; justify-content: center; align-items: center; text-align: center; margin-top: 5px; font-family: Arial, sans-serif;">
    
        <div style="width: 100%; max-width: 50%; padding: 10px; background-color: #ffffff; border-radius: 15px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);   justify-content: center; align-items: center; text-align: center;">
               
            <img style="width: 80px;" src="https://ci3.googleusercontent.com/meips/ADKq_NadEUtIdQewFl9d47X13P4D6u_rWcGuTK75G3rQpIEXClUphGtBk8exbJ8ltrg-xf7db6RbhejBmnazQSu7KGrStg-5t8McE5zGjFLZGDFF7qwPeEf3lOpXsXIAIYv0dlYr4eSpkIGW-g=s0-d-e1-ft#https://res.cloudinary.com/dbhdpelno/image/upload/v1716839404/Group-5421_yeiq4d.png" alt="">
            <h1 style="margin-top: 13px; margin-bottom: 20px; font-size: 14px;  text-align:center;">Account Recovery</h1>
            <p style="margin-bottom: 56px;">Hi to reset your password and regain access, simply <br> click on the button below.</p>
            <button style="background-color: #1E3A8A; padding: 8px 20px; width: 208px; color: white; text-decoration: none; border-radius: 15px; font-size: 18px; display: inline-block; margin-bottom: 80px;">
                <a href="https://citizenlink.onrender.com/reset?email=${email}" style="color: white; text-decoration: none; border:none;">Reset Password</a>
            </button>
            <div style="width: 100%; border-top: 1px solid #000; margin-top: 80px;"></div>
            <p style="margin-top: 40px;">©2024 CitizenLink</p>
        </div>
    
    </body>
    </html>

  `
  };
  const sendMail = async (transporter, mailOption) => {
    try {
      await transporter.sendMail(mailOption);
      res.render("forgetpassword", {
        content: `Password reset link sent to ${email}`
      });
    } catch (error) {
      console.error(error);
    }
  };
  sendMail(transporter, mailOption);
  // end of send email to end users
});

// reset password
app.post("/newreset", async (req, res) => {
  let username = req.session.globalUsername;
  try {
    const { newpassword, confirmnewpassword } = req.body;
    const query = "SELECT * FROM leaders WHERE username=?";
    db.query(query, [username], async (error, results) => {
      if (results.length > 0) {
        if (newpassword === confirmnewpassword) {
          if (newpassword.length >= 8) {
            const HashPassword = await bcrypt.hash(newpassword, 10);

            let updates = `UPDATE leaders SET password=? WHERE username='${username}'`;

            db.query(updates, HashPassword, (error, results) => {
              if (error) throw error;
              res.render("login", { content: "" });
            });
          } else {
            return res.render("reset", {
              content: "Password must be at least 8 characters"
            });
          }
        } else {
          return res.render("reset", { content: "password doesn't match" });
        }
      } else {
        return res.render("reset", {
          content: "Email doesn't exist in database"
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

// validate number
const isValidNumber = (number) => {
  const phoneRegex = /^(078|079|073)\d{7}$/;
  return phoneRegex.test(number);
};

// validate date
const validateDate = () => {
  // Get the current date in UTC
 const utcDate = new Date();
  const year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth() + 1;
  const day = utcDate.getUTCDate();
    const dates = `${year}/${month}/${day} `;
  const [y,m,d,time] = dates.split("/");
   return (recordedDate = `${d}/${m}/${y}`);
};

// validate password stength
function isValidPassword(password) {
  const regex = /^(?=.*[A-Z]).{8,}$/;
  return regex.test(password);
}

// record citizen issue
app.post(
  "/cell/recoredcase",
  uploadDocument.single("addDocument"),
  isAuthenticated,
  async (req, res) => {
    const {
      citizen_name,
      citizen_number,
      problem_category,
      problem_title,
      problem_description
    } = req.body;
    let administrationId = req.session.administrationId;
    let status = "pending";

    const myfile = req.file;
    let attachment = "";

    // Move the uploaded file to the desired location
    if (myfile) {
      fs.rename(
        myfile.path,
        "public/docs/" + myfile.originalname,
        async (error) => {
          if (error) {
            res.status(500).json({ message: "File upload failed" });
          }
        }
      );
      attachment = myfile.originalname;
    }

    const recordedDate = validateDate();
    if (isValidNumber(citizen_number)) {
      const query = "INSERT INTO cases SET ?";
      const datas = {
        administrationId,
        citizen_name,
        citizen_number,
        problem_category,
        problem_title,
        problem_description,
        attachment: attachment || null,
        status,
        recordedDate
      };
      db.query(query, datas, (error, results) => {
        if (error) throw error;
        res.render("cell/addcase", {
          contents: "",
          content: `Case of ${citizen_name} record to the system.`
        });
      });
    } else {
      res.render("cell/addcase", {
        content: "",
        contents: `This phone number ${citizen_number} is invalid.`
      });
    }
  }
);
 
app.get("/sector", isAuthenticated, (req, res) => {
  const administrationId = req.session.administrationId;
  const query =
    "SELECT * FROM cases WHERE administrationId=? ORDER BY problemId DESC";
  db.query(query, [administrationId], (error, results) => {
    // res.status(200).json({results})
    if (error) throw error;
    res.render("sector/dashboard", { Allcases: results });
  });
});

// cell get solved cases
app.get("/cell/solvedCase", isAuthenticated, (req, res) => {
  const administrationId = req.session.administrationId;
  const query =
    "SELECT * FROM cases WHERE status ='solved' AND administrationId=?";
  db.query(query, [administrationId], (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});
// cell get Pending Cases
app.get("/cell/pendingCase", isAuthenticated, (req, res) => {
  const administrationId = req.session.administrationId;
  const query =
    "SELECT * FROM cases WHERE status ='pending' AND administrationId=?";
  db.query(query, [administrationId], (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});
// cell get Submitted Cases
app.get("/cell/SubmittedCase", isAuthenticated, (req, res) => {
  const administrationId = req.session.administrationId;
  const query =
    "SELECT * FROM cases WHERE status ='Submitted' AND administrationId=?";
  db.query(query, [administrationId], (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});
// cell user profile

app.get("/cellprofile", isAuthenticated, (req, res) => {
  const administrationId = req.session.administrationId;
  const query = "SELECT * FROM leaders WHERE administrationId=?";
  db.query(query, [administrationId], (errors, results) => {
    if (errors) throw errors;
    req.session.profiles = results;
    res.render("cell/profile", { results, success: "", content: "" });
  });
});

//update cell password froms settings

app.post("/cell/settings", isAuthenticated, async (req, res) => {
  try {
    const { Currentpassword, newpassword, Confirmnewpassword } = req.body;
    const administrationId = req.session.administrationId;
    const query = "SELECT * FROM leaders WHERE administrationId=?";
    db.query(query, [administrationId], async (error, result) => {
      if (error) throw error;
      const password = result[0].password;
      // console.log(Currentpassword);
      const isPasswordValid = await bcrypt.compare(Currentpassword, password);
      if (isPasswordValid) {
        if (newpassword === Confirmnewpassword) {
          // validate password
          if (isValidPassword(newpassword)) {
            const hashNewpassword = await bcrypt.hash(newpassword, 7);
            const query = `UPDATE leaders SET password=? WHERE administrationId=${administrationId}`;
            db.query(query, hashNewpassword, (error, results) => {
              if (error) throw error;
              res.render("cell/profile", {
                results: req.session.profiles,
                success: "Password change",
                content: ""
              });
            });
          } else {
            res.render("cell/profile", {
              results: req.session.profiles,
              success: "",
              content:
                "Choose strong password contain uppercase letter and 8 characters long."
            });
          }
        } else {
          res.render("cell/profile", {
            results: req.session.profiles,
            success: "",
            content: "New password not match."
          });
        }
      } else {
        res.render("cell/profile", {
          results: req.session.profiles,
          success: "",
          content: "Current password not match."
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

// Get cell user information

app.get("/cell/profile", isAuthenticated, (req, res) => {
  const administrationId = req.session.administrationId;
  const query = "SELECT * FROM leaders WHERE administrationId=?";
  db.query(query, [administrationId], async (error, result) => {
    res.status(200).json(result);
  });
});

// render  cell single case
app.get("/cellsinglecase/:id", isAuthenticated, (req, res) => {
  const problemId = req.params.id;
  const administrationId = req.session.administrationId;
  const query = "SELECT * FROM citizen_submition WHERE  submitionId=?";
  db.query(query, [problemId], (error, result) => {
    if (error) throw error;
    if (result.length > 0) {
      res.render("cell/singlecase", {
        result,
        content: "",
        contents: "",
        solve_result: ""
      });
    } else {
      res.render("cell/singlecase", {
        result: [],
        content: "No Case found for this cell"
      });
    }
  });
});

 
app.post("/cell/solved/:id", isAuthenticated, (req, res) => {
  const submitionId = req.params.id;
  const { solve_description } = req.body;
  console.log(solve_description);
 
  const updateQuery = "UPDATE citizen_submition SET status='Solved', solve_description=? WHERE submitionId=?";

  db.query(updateQuery, [solve_description, submitionId], (error, result) => {
    if (error) throw error;

    const selectQuery = "SELECT * FROM citizen_submition WHERE submitionId=?";
    db.query(selectQuery, [submitionId], (error, caseResult) => {
      if (error) throw error;
      res.render("cell/singlecase", {
        result: caseResult,
        content: "",
        contents: "Case marked as solved.",
        solve_result: ""
      });

const citizen_email=caseResult[0].citizen_email;
const ticket=caseResult[0].ticket;
const citizen_name=caseResult[0].citizen_name;

 const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS
    }
  });
  const mailOption = {
    from: {
      name: "CitizensLink",
      address: process.env.EMAIL
    },
    to: `${citizen_email}`, // list of receivers
    subject: "CitizensLink",

    html: ` 
        <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="display: flex; justify-content: center; align-items: center; text-align: center; margin-top: 5px; font-family: Arial, sans-serif;">
    
        <div style="width: 100%; max-width: 50%; padding: 10px; background-color: #ffffff; border-radius: 15px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);   justify-content: center; align-items: center; text-align: center;">
             <h1 style="margin-top: 13px; margin-bottom: 20px; font-size: 19px;  text-align:center;">Complaint Feedback</h1>
            <p style="margin-bottom: 56px;font-size:19px;">Hello ${citizen_name} <br>There is new feedback regarding the complaint you submitted use ticket code below to read more.</p>
            <div style="width: 100%; margin-top: 80px; font-size:19px;">${ticket}</div>
            <a href="https://citizenlink.onrender.com/complaints" style="color: blue;font-size:15px;">Navigate to system</a>
            <p style="margin-top: 40px;">©2025 CitizensLink</p>
        </div>
    
    </body>
    </html>

  `
  };
  const sendMail = async (transporter, mailOption) => {
    try {
      await transporter.sendMail(mailOption);
      
    } catch (error) {
      console.error(error);
    }
  };
  sendMail(transporter, mailOption);
  

 

    });
  });
});
 

app.get("/cell/solvedcase/:id", (req, res) => {
  // display how case solved
  const Solve_query = `
  SELECT 
    problems_solved.solve_description, 
    problems_solved.solve_attachment, 
    cases.citizen_name, 
    cases.problem_title 
  FROM 
    problems_solved 
  INNER JOIN 
    cases 
  ON 
    problems_solved.problemId = cases.problemId 
    AND problems_solved.administrationId = cases.administrationId 
  WHERE 
    problems_solved.problemId = ? 
    AND problems_solved.administrationId = ?`;

  const problemId = req.params.id;
  const administrationId = req.session.administrationId;
  db.query(Solve_query, [problemId, administrationId], (error, result) => {
    if (error) throw error;
    res.render("cell/solvedcase", { result });
  });
});
 
// Cell submit case to sector
app.post("/cell/submit/:id", uploadDocument.single("solve_attachment"), isAuthenticated, (req, res) => {
  const problemId = req.params.id;
  const submitedeDate = validateDate();
  const administrationId = req.session.administrationId;
  const district = req.session.district;
  const sector = req.session.sector;
  const level = "sector";
  const solveDescription = req.body.solve_description; // Ensure this field is in your form

  // Store file
  const myfile = req.file;
  let attachment = "";
  if (myfile) {
      fs.rename(myfile.path, "public/docs/" + myfile.originalname, async (error) => {
          if (error) {
              return res.status(500).json({ message: "File upload failed" });
          }
      });
      attachment = myfile.originalname;
  }

  // Update cases table to mark case as submitted
  const updateCaseQuery = "UPDATE cases SET status='submitted' WHERE problemId=? AND administrationId=?";
  db.query(updateCaseQuery, [problemId, administrationId], (error, result) => {
      if (error) throw error;

      // Validate if the case already exists in the submitted table
      const checkProblem = "SELECT * FROM submitted WHERE problemId=?";
      db.query(checkProblem, [problemId], (error, results) => {
          if (error) throw error;

          if (results.length <= 0) {
              const insertSubmittedQuery = "INSERT INTO submitted SET ?";
              const submittedValues = {
                  problemId,
                  administrationId,
                  sector,
                  district,
                  submitedeDate,
                  level
               };
              
              // Insert into the submitted table
              db.query(insertSubmittedQuery, submittedValues, (error, result) => {
                  if (error) throw error;

                  // Insert into problems_solved table
                  const insertProblemsSolvedQuery = "INSERT INTO problems_solved SET ?";
                  const solvedValues = {
                      problemId,
                      administrationId,
                      solve_description: solveDescription,
                      solve_attachment: attachment || null
                  };
                  db.query(insertProblemsSolvedQuery, solvedValues, (error, result) => {
                      if (error) throw error;

                      // Render the single case view
                      const selectCaseQuery = "SELECT * FROM cases WHERE problemId=? AND administrationId=?";
                      db.query(selectCaseQuery, [problemId, administrationId], (error, result) => {
                          res.render("cell/singlecase", {
                              result: result,
                              content: "",
                              contents: `Case has been submitted to ${sector} sector`
                          });
                      });
                  });
              });
          } else {
              const selectCaseQuery = "SELECT * FROM cases WHERE problemId=? AND administrationId=?";
              db.query(selectCaseQuery, [problemId, administrationId], (error, result) => {
                  res.render("cell/singlecase", {
                      result: result,
                      content: "",
                      contents: `Case has already been submitted to ${sector} sector`
                  });
              });
          }
      });
  });
});



// ========================================================================================================================================
//                                                                    Citizen submition 
// ==========================================================================================================================================


// report case to sector
app.get("/reportcase", (req, res) => {
  res.render("citizen/problem_report", { content: "", contents: "" });
});

// store reported cases
app.post("/report", uploadDocument.single("addDocument"), async (req, res) => {
  const {
    citizen_name,
    citizen_number,
    citizen_email,
    problem_category,
    problem_title,
    problem_description,
    province,
    district,
    sector,
    cell,
    village
  } = req.body;

  const myfile = req.file;
  let attachment = "";

  // Move the uploaded file to the desired location
  if (myfile) {
    fs.rename(
      myfile.path,
      "public/docs/" + myfile.originalname,
      async error => {
        if (error) {
          res.status(500).json({ message: "File upload failed" });
        }
      }
    );
    attachment = myfile.originalname;
  }

  // generate ticket number
  
const ticket = Math.floor(100 + Math.random() * 900);

  const recordedDate = validateDate();
  if (isValidNumber(citizen_number)) {
    const query = "INSERT INTO citizen_submition SET ?";
    const datas = {
      citizen_name,
      citizen_number,
      citizen_email,
      problem_category,
      problem_title,
      problem_description,
      ticket:ticket,
       attachment: attachment || null,
      recordedDate,
      province,
      district,
      sector,
      cell,
      village
    };
    db.query(query, datas, (error, results) => {
      if (error) throw error;
      res.render("citizen/problem_report", {
        contents: "",
        content: `Case of ${citizen_name} sent  to ${cell} cell.`
      });
           
    const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS
    }
  });
  const mailOption = {
    from: {
      name: "CitizensLink",
      address: process.env.EMAIL
    },
    to: `${citizen_email}`, // list of receivers
    subject: "CitizensLink",

    html: ` 
        <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="display: flex; justify-content: center; align-items: center; text-align: center; margin-top: 5px; font-family: Arial, sans-serif;">
    
        <div style="width: 100%; max-width: 50%; padding: 10px; background-color: #ffffff; border-radius: 15px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);   justify-content: center; align-items: center; text-align: center;">
             <h1 style="margin-top: 13px; margin-bottom: 20px; font-size: 19px;  text-align:center;">Follow up a complaint</h1>
            <p style="margin-bottom: 56px;font-size:19px;">Hello ${citizen_name} <br>Use ticket code below to follow up a complaint.</p>
            <div style="width: 100%; margin-top: 80px; font-size:19px;">${ticket}</div>
            <a href="https://citizenlink.onrender.com/complaints" style="color: blue;font-size:15px;">Click here to Follow up</a>
            <p style="margin-top: 40px;">©2025 CitizensLink</p>
        </div>
    
    </body>
    </html>

  `
  };
  const sendMail = async (transporter, mailOption) => {
    try {
      await transporter.sendMail(mailOption);
      
    } catch (error) {
      console.error(error);
    }
  };
  sendMail(transporter, mailOption);
  

 


    });
  } else {
    res.render("citizen/problem_report", {
      content: "",
      contents: `This phone number ${citizen_number} is invalid.`
    });
  }
});


app.get("/complaints", async (req, res) => {
      res.render("citizen/complaints", { result:[] });
 });

app.post("/complaints", async (req, res) => {
  try {
    const { ticket } = req.body;
    const query = "SELECT * FROM citizen_submition WHERE ticket=?";
    db.query(query, [ticket], (error, result) => {
      if (error) throw error;
      if (result.length > 0) { 
      //  console.log(result);
        res.render("citizen/complaints", { result });
      } else {
        res.render("citizen/complaints", { result: [] });
      }
    });
  } catch (error) {
    console.log(error);
  }
});





// get case for cell revel

app.get("/cell", isAuthenticated, (req, res) => {
  const administrationId = req.session.administrationId;

  const query1="SELECT * FROM leaders WHERE administrationId=?";
  db.query(query1, [administrationId], (error, result) => {
    if (error) throw error;
const datas=result[0].cell; 

const query ="SELECT * FROM citizen_submition WHERE cell=? ORDER BY submitionId DESC";
  db.query(query, [datas], (error, results) => {
     if (error) throw error;
    res.render("cell/dashboard", { Allcases: results });
  });
  });
  



});











 


// logout
app.get("/aut/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed." });
    }
    res.render("login", { content: "You have been logged out" });
  });
});

app.use((req, res) => {
  res.render("404");
});
 

module.exports = app;
