const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const auth = require("../auth");


router.post("/register", userController.register);
router.post("/login", userController.login);


router.get("/me", auth.authenticate, userController.getProfile);


router.get("/all", auth.authenticate, auth.requireAdmin, userController.getAllUsers);

module.exports = router;
