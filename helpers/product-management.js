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
        .toArray();
      resolve(products);
    });
  },

  // listAllProducts: () => {
  //   return new Promise(async (resolve, reject) => {
  //     let products = await db
  //       .get()
  //       .collection(collection.PRODUCT_COLLECTIONS)
  //       .find()
  //       .toArray();
  //     resolve(products);
  //   });
  // },

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

  getOneBanner: (bannerId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.BANNER_COLLECTION)
        .findOne({ _id: objectId(bannerId) })
        .then((banner) => {
          resolve(banner);
        });
    });
  },

  updateBanner: (bannerId, body) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.BANNER_COLLECTION)
        .updateOne(
          { _id: objectId(bannerId) },
          {
            $set: {
              Name: body.Name,
              text: body.bannerText,
              description: body.description,
            },
          }
        );
      resolve();
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
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .find({ categoryId: objectId(categoryId) })
        .toArray();
      resolve(products);
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

  addOfferCategory: (body, catId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_CATEGORY)
        .updateOne(
          { _id: objectId(catId) },
          {
            $set: {
              percentage: body.percentage,
              offername: body.offername,
            },
          }
        );
      resolve();
    });
  },

  activateCategoryOffer: (catId) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .aggregate([
          {
            $match: {
              categoryId: objectId(catId),
            },
          },
          {
            $project: {
              name: 1,
              categoryId: 1,
              price: 1,
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_CATEGORY,
              localField: "categoryId",
              foreignField: "_id",
              as: "Category",
            },
          },
          {
            $project: {
              name: 1,
              categoryName: "$Category.category",
              Categoryoffername: "$Category.offername",
              Categorypercentage: "$Category.percentage",
              price: 1,
            },
          },
        ])
        .toArray();
      console.log(products);
      //mapping
      products.map(async (prod) => {
        let Price = parseInt(prod.price);
        let discount = (Price * prod.Categorypercentage) / 100;
        Price = parseInt(Price - parseInt(discount));
        console.log("Price", Price);

        await db
          .get()
          .collection(collection.PRODUCT_COLLECTIONS)
          .updateMany(
            { _id: objectId(prod._id) },
            {
              $set: {
                price: Price,
                offername: prod.Categoryoffername,
                discountprice: discount,
                discountpercentage: prod.Categorypercentage,
              },
            }
          );
      });
      resolve();
    });
  },

  deactivateCategoryOffer: (catId) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .aggregate([
          {
            $match: {
              categoryId: objectId(catId),
            },
          },
          {
            $project: {
              name: 1,
              categoryId: 1,
              price: 1,
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_CATEGORY,
              localField: "categoryId",
              foreignField: "_id",
              as: "Category",
            },
          },
          {
            $project: {
              name: 1,
              categoryName: "$Category.category",
              Categoryoffername: "$Category.offername",
              Categorypercentage: "$Category.percentage",
              price: 1,
            },
          },
        ])
        .toArray();
      console.log(products);
      //mapping
      products.map(async (prod) => {
        let Price = parseInt(prod.price);
        let discount = (prod.price * prod.Categorypercentage) / 100;
        Price = parseInt(Price + parseInt(discount));
        let discount1 = (Price * 5) / 100;
        let defaultpercentage = "5";

        await db
          .get()
          .collection(collection.PRODUCT_COLLECTIONS)
          .updateMany(
            { _id: objectId(prod._id) },
            {
              $set: {
                price: Price,
                offername: prod.Categoryoffername,
                discountprice: discount1,
                discountpercentage: [defaultpercentage],
              },
            }
          );
      });
    });
  },

  changeOfferStatus: (catId, newOffer) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_CATEGORY)
        .updateOne(
          { _id: objectId(catId) },
          {
            $set: {
              offer: newOffer,
            },
          }
        );
      response.status = true;
      resolve(response);
    });
  },

  //ADD-PRODUCT
  addItem: (body) => {
    console.log(body);
    // Stock=parseInt(body.Stock)
    body.Stock = Stock;
    return new Promise(async (resolve, reject) => {
      let Category = await db
        .get()
        .collection(collection.PRODUCT_CATEGORY)
        .findOne({ category: body.category });
      console.log(Category);
      let proObj = {
        name: body.name,
        category: body.category,
        categoryId: objectId(Category._id),
        Stock: body.Stock,
        price: body.price,
        Cutprice: body.Cutprice,
        description: body.description,
        Image: body.Image,
        discountpercentage: ["5"],
        offername: [""],
      };

      db.get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .insertOne(proObj)
        .then(() => {
          resolve();
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
    return new Promise( (resolve, reject) => {
      if(status=='delivered'){
        db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              paymentstatus: status, delivered:true
            },
          }
        ); 
        resolve({ statusChange: true });
      }else if(status=='cancelled'){
            db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .updateOne(
              { _id: objectId(orderId) },
              {
                $set: {
                  paymentstatus: status, cancel:true
                },
              }
            );
          resolve({ statusChange: true });
      }
      else{
        db
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
      }
    });
  },

  //coupons section
  addCoupon: (couponData) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .insertOne(couponData)
        .then((data) => {
          resolve(data.insertedId);
        });
    });
  },

  getAllCoupon: () => {
    return new Promise(async (resolve, reject) => {
      let coupon = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find()
        .toArray();
      resolve(coupon);
    });
  },

  deleteCoupon: (couponId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .deleteOne({ _id: objectId(couponId) });
      resolve();
    });
  },
};
