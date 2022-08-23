var express = require("express");
var router = express.Router();
const session = require("express-session");
var productHelpers = require("../helpers/poduct-helpers");
const userHelpers = require("../helpers/user-helpers");
const itemHelpers = require("../helpers/product-management");
const store = require("../multer/multer");


let userName = "admin";
let pin = "12345";

const verifyLogin = (req, res, next) => {
  if (req.session.users) {
    next();
  } else {
    res.render("admin/admin-login", {
      adminLogin: true,
      errout: req.session.err,
    });
    req.session.err = false;
  }
};

// get user listing
router.get("/", (req, res) => {
  if (req.session.users) {
    res.redirect("/admin/admin-dashboard");
  } else {
    res.render("admin/admin-login", {
      adminLogin: true,
      errout: req.session.err,
    });
    req.session.err = false;
  }
});

router.post("/view-dashboard", (req, res) => {
  const { Email, Password } = req.body;
  if (userName === Email && pin === Password) {
    req.session.check = true;
    req.session.users = {
      userName
    };
    res.redirect("/admin/admin-dashboard");
  } else {
    req.session.err = "incorrect username or password";
    res.redirect("/admin");
  }
});

router.get("/admin-dashboard", verifyLogin, (req, res) => {
  res.render("admin/adminDashboard", { admin: true });
});

//users
router.get("/view-users", verifyLogin, (req, res) => {
  productHelpers.getAlluser().then((users) => {
    res.render("admin/view-users", { admin: true, users });
  });
});

router.get("/Block-user/:id", verifyLogin, (req, res) => {
  let userId = req.params.id;
  userHelpers.blockUser(userId).then((response) => {
    req.session.user = null;
    req.session.loggedIn = null;
    res.redirect("/admin/view-users");
  }).catch(()=>{
    res.render('admin/404',{admin:true})
  })
});

router.get("/Un-Block-user/:id", verifyLogin, (req, res) => {
  let userId = req.params.id;
  userHelpers.unblockUser(userId).then((response) => {
    req.session.user = null;
    req.session.loggedIn = null;
    res.redirect("/admin/view-users");
  });
});

//products
// view-products
router.get("/view-products",verifyLogin, (req, res) => {
  itemHelpers.getAllProducts().then((products) => {
    res.render("admin/view-products", { admin: true, products });
  });
});

router.get("/add-products",verifyLogin, (req, res) => {
  itemHelpers.getCategories().then((categories) => {
    res.render("admin/add-products", { admin: true, categories });
  });
});

//product delete
router.get("/product-delete/:id", verifyLogin, (req, res) => {
  let proId = req.params.id;
  itemHelpers.deleteProduct(proId).then((response) => {
    res.redirect("/admin/view-products");
  });
});

//edit-product
router.get("/edit-product/:id", verifyLogin, async (req, res) => {
  try{
    let editProductFormData = await itemHelpers.getProductData(req.params.id);
    console.log(editProductFormData);
    let categories = await itemHelpers.getCategories();
    res.render("admin/edit-product", {
      editProductFormData,
      categories,
      admin: true,
    })
  } catch{
    res.render('admin/404',{admin:true})
  }
  
});

//edit-productdata post
router.post("/product-edit/:id", verifyLogin, async (req, res) => {
  let editProductFormData = await itemHelpers.updateProduct(
    req.params.id,
    req.body
  );
  res.render("admin/edit-product", {
    editProductFormData,
    admin: true,
  });
});

router.post("/add-item", store.array("image", 4), verifyLogin,(req, res) => {
  const files = req.files;
  // if (!files) {
  //   const err = new Error("please choose the images");
  //   res.redirect("/add-products", err);
  // }
  
  var filenames = req.files.map(function (file) {
    return file.filename;
  });

  req.body.Image = filenames;
  itemHelpers.addItem(req.body).then((resolve) => {
    res.redirect("/admin/view-products");
  });
});

//categories
//getting catogories page for delete update
router.get("/categories", verifyLogin, (req, res) => {
  itemHelpers.getCategories().then((categories) => {
    res.render("admin/categories", { admin: true, categories });
  });
});

router.get("/add-categories", verifyLogin, (req, res) => {
  res.render("admin/add-category", { admin: true });
});

router.post("/add-category", verifyLogin, (req, res) => {
  //let category = req.body;
  console.log(req.body);
  itemHelpers.addCategory(req.body);
  res.redirect("/admin/add-categories");
});

router.get("/edit-categories/:id", verifyLogin, (req, res) => {
  itemHelpers.getSingleCategory(req.params.id).then((category) => {
    res.render("admin/edit-category", {admin:true, category });
  }).catch(()=>{
    res.render('admin/404')
  })
});

router.post("/edit-category/:id", (req, res) => {
  itemHelpers.updateCategory(req.params.id, req.body);
  res.redirect("/admin/categories");
});

router.get("/delete-category/:id", verifyLogin, (req, res) => {
  itemHelpers.deleteCategory(req.params.id).then((response) => {
    res.redirect("/admin/categories");
  });
});

//orders
router.get("/admin-orders", verifyLogin, (req, res) => {
  itemHelpers.getOrders().then((Items) => {
      res.render("admin/admin-orders", { admin: true,Items });
 })
});

router.post("/change-order-status/:id", verifyLogin, (req, res) => {
    itemHelpers.changeOrderStatus(req.params.id,req.body.status).then((response)=>{
      res.json(response)
    })
});



router.get("/logout", (req, res) => {
  req.session.users = null;
  res.redirect("/admin");
});

// /about/*  for page not found






module.exports = router;
