const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const bookController = require("../controllers/bookController");
const reviewController = require("../controllers/reviewController");
const mw = require("../middleware/auth");

//.............test api........................
router.get("/test-me", function (req, res) {
  res.send({ msg: "working properly" });
});
//.............project apis..............................
router.post("/register", userController.createUser);
router.post("/login", userController.createLogin);
router.post("/books", bookController.createbook);
router.get("/books", bookController.getBookByQuery);
router.get("/books/:bookId", bookController.getBooksDetails);
router.delete("/books/:bookId", mw.auth, bookController.deleteBook);

module.exports = router;
