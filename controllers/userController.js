const bcrypt = require("bcryptjs");
const User = require("../models/User");
const auth = require("../auth"); 

// Sanitizes returned user object
function cleanUser(user) {
  const obj = user.toObject();
  delete obj.password;
  return obj;
}


exports.register = (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({
      message: "email, username, and password are required"
    });
  }


  User.findOne({ email })
    .then(existing => {
      if (existing) {
        return res.status(409).json({
          message: "Email already registered"
        });
      }


      bcrypt.hash(password, 10, (err, hashed) => {
        if (err) {
          console.error("Hash error:", err);
          return res.status(500).json({ message: "Server error" });
        }

        const newUser = {
          email,
          username,
          password: hashed,
          isAdmin: false 
        };

        User.create(newUser)
          .then(user => {
            return res.status(201).json({
              message: "User registered successfully",
              user: cleanUser(user)
            });
          })
          .catch(error => {
            console.error("Create user error:", error);
            return res.status(500).json({ message: "Server error" });
          });
      });
    })
    .catch(error => {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    });
};


exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "email and password are required"
    });
  }

  User.findOne({ email })
    .then(user => {
      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password"
        });
      }

      bcrypt.compare(password, user.password, (err, match) => {
        if (err) {
          console.error("Compare error:", err);
          return res.status(500).json({ message: "Server error" });
        }

        if (!match) {
          return res.status(401).json({ message: "Invalid email or password" });
        }


        const token = auth.createAccessToken(user);

        return res.status(200).json({
          message: "Login successful",
          access: token
        });

      });
    })
    .catch(error => {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    });
};


exports.getProfile = (req, res) => {
  return res.status(200).json({
    message: "User profile",
    user: req.user
  });
};

exports.getAllUsers = (req, res) => {
  User.find()
    .then(users => {
      const cleaned = users.map(u => {
        const obj = u.toObject();
        delete obj.password; 
        return obj;
      });

      res.status(200).json({
        message: "All users retrieved successfully",
        users: cleaned
      });
    })
    .catch(err => {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "Server error" });
    });
};
