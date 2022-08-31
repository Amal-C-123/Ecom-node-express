var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
//const { response } = require("../app");
var objectId = require("mongodb").ObjectId;
var Handlebars = require("handlebars");
const { response } = require("express");

Handlebars.registerHelper("inc", function (value, options) {
  return parseInt(value) + 1;
});

module.exports = {
  getAllProducts: (proId) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .find()
        .limit(8)
        .toArray();
      resolve(products);
    });
  },

  listAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .find()
        .toArray();
      resolve(products);
    });
  },

  

  getAllBanner: () => {
    return new Promise(async (resolve, reject) => {
      let banner = await db
        .get()
        .collection(collection.BANNER_COLLECTION)
        .find()
        .toArray();
      resolve(banner);
    });
  },

  addBanner: (body) => {
    return new Promise((resolve, reject) => {
      let proObj = {
        Name: body.Name,
        text: body.bannerText,
        description: body.description,
        Images: body.Images,
      };
      db.get()
        .collection(collection.BANNER_COLLECTION)
        .insertOne(proObj)
        .then(() => {
          resolve();
        });
    });
  },

  deleteBanner: (bannerData) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.BANNER_COLLECTION)
        .deleteOne({ _id: objectId(bannerData) })
        .then(() => {
          resolve();
        });
    });
  },

  //Add category
  addCategory: (userData) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_CATEGORY)
        .insertOne(userData)
        .then((data) => {
          resolve(data.insertedId);
        });
    });
  },
  //filter products according to category
  categoryFilter: (categoryId) => {
    return new Promise(async(resolve, reject) => {
      let products= await db.get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .find({ categoryId: objectId(categoryId) }).toArray()
        resolve(products)
    });
  },

  getCategories: () => {
    return new Promise(async (resolve, reject) => {
      let categories = await db
        .get()
        .collection(collection.PRODUCT_CATEGORY)
        .find()
        .toArray();
      resolve(categories);
    });
  },

  getSingleCategory: (editProdId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_CATEGORY)
        .findOne({ _id: objectId(editProdId) })
        .then((category) => {
          resolve(category);
        });
    });
  },

  updateCategory: (proId, proDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_CATEGORY)
        .updateOne(
          { _id: objectId(proId) },
          {
            $set: {
              category: proDetails.category,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  deleteCategory: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_CATEGORY)
        .deleteOne({ _id: objectId(proId) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  //ADD-PRODUCT
  addItem: (userData) => {
    return new Promise(async (resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTIONS).insertOne(userData);
      let catId = await db
        .get()
        .collection(collection.PRODUCT_CATEGORY)
        .findOne({ category: userData.category });
      catId = catId._id;
      if (catId) {
        db.get()
          .collection(collection.PRODUCT_COLLECTIONS)
          .updateOne({ name: userData.name }, { $set: { categoryId: catId } });
      }
      resolve();
    });
  },

  //delete product
  deleteProduct: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .deleteOne({ _id: objectId(prodId) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  getProductData: (ProductId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .findOne({ _id: objectId(ProductId) })
        .then((productData) => {
          resolve(productData);
        });
    });
  },

  updateProduct: (proId, productDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .updateOne(
          { _id: objectId(proId) },
          {
            $set: {
              name: productDetails.name,
              category: productDetails.category,
              description: productDetails.description,
              price: productDetails.price,
              Image: productDetails.Image,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  //admin-orders
  getOrders: () => {
    return new Promise(async (resolve, reject) => {
      let Items = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find()
        .sort({ date: -1 })
        .toArray();
      resolve(Items);
    });
  },

  changeOrderStatus: (orderId, status) => {
    return new Promise(async (resolve, reject) => {
      let Order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              paymentstatus: status,
            },
          }
        );
      resolve({ statusChange: true });
    });
  },

  //coupons section
  addCoupon: (couponData) => {
    return new Promise((resolve, reject) => {
        db.get().collection(collection.COUPON_COLLECTION).insertOne(couponData).then((data) => {
            resolve(data.insertedId)
        })
    })
},
  
getAllCoupon: () => {
  return new Promise(async (resolve, reject) => {
      let coupon = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
      resolve(coupon)
  })
},

deleteCoupon: (couponId) => {
  return new Promise((resolve, reject) => {
      db.get().collection(collection.COUPON_COLLECTION).deleteOne({ _id: objectId(couponId) })
      resolve()
  })
},
};
