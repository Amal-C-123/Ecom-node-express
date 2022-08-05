var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { response } = require("../app");
var objectId = require("mongodb").ObjectId;

module.exports = {
  getAllProducts: (proId) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .find()
        .toArray();
      resolve(products);
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
      db.get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .insertOne(userData)
        .then((data) => {
          resolve(data.insertedId);
        });
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

  getProductData: (editProductId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .findOne({ _id: objectId(editProductId) })
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
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
};
