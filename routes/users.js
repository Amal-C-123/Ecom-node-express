var express = require("express");
const session = require("express-session");
require("dotenv").config();
var router = express.Router();
const userHelpers = require("../helpers/user-helpers");
var productHelpers = require("../helpers/product-management");
const cartHelpers = require("../helpers/cart-helpers");

const client = require("twilio")(
  process.env.ACCOUNT_SID,
  process.env.AUTH_TOKEN,
  {
    lazyLoading: true,
  }
);

let User_number = "";
let trueOtpSessionUser = {}

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

/* GET users listing. */
router.get("/", async function (req, res, next) {
  let user = req.session.user;
  // let userSession = req.session;
  // console.log(userSession);
  // userHelpers.isExist(userSession);
  let cartCount = null;
  if (req.session.user) {
    cartCount = await cartHelpers.getCartCount(req.session.user._id);
  }

  productHelpers.getAllProducts().then((products) => {
    res.render("index", { userHead: true, user, products, cartCount });
  });
});

router.get("/login", (req, res) => {
  let blocked = req.session.blockedUser;
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
  productHelpers.getProductData(req.params.id).then((product) => {
    res.render("user/product-details", { product, userHead: true });
  });
});

router.get("/user-dashboard", (req, res) => {
  let user = req.session.user;
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

router.get("/signup", (req, res) => {
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
router.get("/otp-login", (req, res) => {
  res.render("user/otp-login",{userHead: true});
  req.session.loginErr = false;
});

router.post("/otp-verification", (req, res) => {
  userHelpers.numberExist(req.body.number).then((response) => {
    if (response.userExist == false) {
      res.render("user/otp-login", {userHead: true, userNotExist: true });
    } else if (response.userBlock == true) {
      res.render("user/otp-login", { userHead: true,userBlock: true });
    } else {
      // req.session.user = response;
      trueOtpSessionUser=response
      const { number } = req.body;
      console.log(number);
      User_number = number;
      client.verify.services(process.env.SERVICE_SID).verifications.create({
        to: `+91${number}`,
        channel: "sms",
      });
      res.render("user/otp-verify", { userHead:true,user: response.user });
    }
  });
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
      if (resp.valid == false) {
        req.session.otp = true;
        let otpvalidation = req.session.otp;
        res.render("user/otp-verify", {userHead:true, otpvalidation });
      } else if (resp.valid == true) {
        req.session.user=trueOtpSessionUser
        req.session.loggedIn = true;
        res.redirect("/");
      }
    });
});

//cart section
router.get("/cart", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = await cartHelpers.getCartCount(req.session.user._id);
  let products = await cartHelpers.getCartProducts(req.session.user._id);
  let total = await cartHelpers.getTotalAmount(req.session.user._id);
  res.render("user/cart", { userHead: true, products, cartCount, total, user });
});

router.get("/add-to-cart/:id", verifyLogin, (req, res) => {
  cartHelpers.addToCart(req.params.id, req.session.user._id).then((data) => {
    res.json({ status: true });
  });
});

router.post("/change-product-quantity", verifyLogin, (req, res, next) => {
  cartHelpers.changeProductQuantity(req.body).then(async (response) => {
    let total = await cartHelpers.getTotalAmount(req.session.user._id);
    if (total > 0) {
      response.total = total;
    }
    res.json(response);
  });
});

router.get("/checkout", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let total= await cartHelpers.getTotalAmount(req.session.user._id)
  res.render("user/checkout", { userHead:true, user, total });
});

router.post("/checkout-form",verifyLogin, async (req, res) => {
  let user = req.session.user;
  let products= await cartHelpers.getCartProductList(req.body.userId)
  let totalPrice = await cartHelpers.getTotalAmount(req.body.userId);
  cartHelpers.placeOrder(req.body,products,totalPrice).then((response) => {
    res.json({status:true})
  })
 
  //res.render("user/checkout", { user,total });
   
})

module.exports = router;
