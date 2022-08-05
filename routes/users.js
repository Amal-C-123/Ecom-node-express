var express = require("express");
const session = require("express-session");
require("dotenv").config();
var router = express.Router();
const userHelpers = require("../helpers/user-helpers");
var productHelpers = require("../helpers/product-management");

const client = require("twilio")(
  process.env.ACCOUNT_SID,
  process.env.AUTH_TOKEN,
  {
    lazyLoading: true,
  }
);

let User_number = "";

const verifyAuth = (req, res, next) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    next();
  }
};
/* GET users listing. */
router.get("/", function (req, res, next) {
  let user = req.session.user;
  let userSession = req.session;

  //   productHelpers.getAlluser().then((products) => {
  //     res.render("index", { products, user });
  //  });
  userHelpers.isExist(userSession);
  productHelpers.getAllProducts().then((products) => {
    console.log(products);
    res.render("index", { userHead: true, user, products });
  });
});

router.get("/login", verifyAuth, (req, res) => {
  let blocked = req.session.blockedUser;
  console.log(blocked);
  res.render("user/login", {
    userHead: true,
    loginErr: req.session.loginErr,
    blocked,
  });
  req.session.loginErr = false;
  blocked = false;
});

router.post("/login", (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.userBlock) {
      req.session.blockedUser = true;
      res.redirect("/login");
    } else if (response.status) {
      req.session.user = response.user;
      req.session.loggedIn = true;
      res.redirect("/");
    } else {
      req.session.loginErr = true;
      res.redirect("/login");
    }
  });
});

//view products in users home page
router.get("/view-product/:id", function (req, res) {
  productHelpers.getProductData(req.params.id)
    .then((product) => {
     res.render("user/product-details", { product, userHead: true });
  })
        
}); 

router.get("/user-dashboard", (req, res) => {
  let user = req.session.user;
  console.log(user);
  if (req.session.loggedIn) {
    res.render("user/user-dashboard", { user, userHead: true });
  } else {
    res.redirect("/login");
  }
});

router.get("/logout", (req, res) => {
  req.session.loggedIn = null;
  req.session.user = null;
  res.redirect("/");
});

router.get("/signup", verifyAuth, (req, res) => {
  res.render("user/signup", { userHead: true, signErr: req.session.signErr });
  req.session.signErr = false;
});

router.post("/signup", (req, res) => {
  let reqBody = req.body;
  reqBody.block = "";
  userHelpers.doSignUp(req.body).then((response) => {
    if (response.status) {
      req.session.signErr = true;
      res.redirect("/signup");
    } else {
      res.redirect("/login");
    }
  });
});

//otp section
router.get("/otp-login", verifyAuth, (req, res) => {
  res.render("user/otp-login");
  req.session.loginErr = false;
});

router.post("/otp-verification", (req, res) => {
  const { number } = req.body;
  User_number = number;
  client.verify.services(process.env.SERVICE_SID).verifications.create({
    to: `+91${number}`,
    channel: "sms",
  });
  res.render("user/otp-verify");
});

router.post("/otp-matching", function (req, res) {
  const { otp } = req.body;

  client.verify
    .services(process.env.SERVICE_SID)
    .verificationChecks.create({
      to: `+91${User_number}`,
      channel: "sms",
      code: otp,
    })
    .then((resp) => {
      console.log(resp);
      if (resp.valid == true) {
        res.redirect("/");
      } else {
        res.render("user/otp-verify");
      }
    });

  //res.redirect("/");
});

module.exports = router;
