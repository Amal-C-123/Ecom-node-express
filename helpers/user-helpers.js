var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectId;
require("dotenv").config();
const RazorPay = require("razorpay");
const paypal = require("paypal-rest-sdk");
const CC = require("currency-converter-lt");
var instance = new RazorPay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

paypal.configure({
  mode: "sandbox",
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
});


module.exports = {
  doSignUp: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let email = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });
      if (email) {
        console.log("same email");
        response.status = true;
        resolve(response);
      } else {
        userData.Password = await bcrypt.hash(userData.Password, 10);
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(userData)
          .then((data) => {
            resolve(data.insertedId);
          });
        console.log("user data inserted in database");
        resolve({ status: false });
      }
    });
  },

  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });

      if (user) {
        if (user.block == true) {
          resolve({ userBlock: true });
        }
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            console.log("login Success");
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            console.log("login failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("login failed");
        resolve({ status: false });
      }
    });
  },

  // isExist: (isUser) => {
  //   var user = { ...isUser.user };
  //   async function nameGetter(user) {
  //     let email = await db
  //       .get()
  //       .collection(collection.USER_COLLECTION)
  //       .findOne({ Email: user.Email });
  //     let userEmail = { ...email };
  //     if (userEmail.Email !== user.Email) {
  //       isUser.destroy();
  //     }
  //   }
  //   nameGetter(user);
  // },

  numberExist: (number) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Phone: number });
      if (user == null) {
        console.log("number doesnot exist in database");
        resolve({ userExist: false });
      } else if (user.block == true) {
        resolve({ userBlock: true });
        console.log("number is blocked");
        resolve({ status: false });
      } else {
        resolve(user);
      }
    });
  },

  blockUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            //updating user for blocking feature
            $set: { block: true },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  unblockUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: { block: false },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  // addAddress
  addAdrress: (address, userId) => {
    return new Promise(async (resolve, reject) => {
      let Address = await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .findOne({ _id: objectId(userId) });
      console.log(Address);
      if (Address) {
        address.index = Address.addressList.length + 1;
        db.get()
          .collection(collection.ADDRESS_COLLECTION)
          .updateOne(
            { _id: objectId(userId) },
            {
              $push: { addressList: address },
            }
          )
          .then(() => {
            resolve();
          });
      } else {
        address.index = 1;
        db.get()
          .collection(collection.ADDRESS_COLLECTION)
          .insertOne({ _id: objectId(userId), addressList: [address] })
          .then((response) => {
            resolve(response);
          });
      }
    });
  },

  getAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      let address = await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(userId) },
          },
          {
            $unwind: "$addressList",
          },
        ])
        .toArray();
      resolve(address);
    });
  },

  getAddress_PlaceOrder: (userId, addressIndex) => {
    return new Promise(async (resolve, reject) => {
      let singleAddress = await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(userId) },
          },
          {
            $unwind: "$addressList",
          },
          {
            $match: { "addressList.index": addressIndex },
          },
        ])
        .toArray();
      console.log(singleAddress[0].addressList, "mmmm");
      resolve(singleAddress[0].addressList);
    });
  },

  priceConvert: (price) => {
    return new Promise((resolve, reject) => {
      let convertPrice = new CC({
        from: "INR",
        to: "USD",
        amount: price,
        isDecimalComma: false,
      });
      convertPrice.convert().then((response) => {
        console.log(response);
        resolve(response);
      });
    });
  },

  changeOrderStatus: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let Order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              paymentstatus: "cancelled", cancel: true
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },


  
  placeOrder: (
    orderedProducts,
    deliveryAddress,
    total,
    paymentMethod,
    userId
  ) => {
    console.log(total, "uuuuuuuuuuuuuuuuuuuuuuuuu");
    return new Promise((resolve, reject) => {
      let status = paymentMethod === "COD" ? "placed" : "pending";
      let orderObj = {
        userId: objectId(userId),
        products: orderedProducts,
        address: deliveryAddress,
        totalAmount: total,
        paymentstatus: status,
        paymentMethod: paymentMethod,
        date: new Date().toUTCString().slice(0, 25),
      };
      console.log(orderObj);
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((data) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .deleteOne({ user: objectId(userId) })
            .then(() => {
              resolve(data);
            });
        });
    });
  },

  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: objectId(userId) })
        .sort({ date: -1 })
        .toArray();
      resolve(orders);
    });
  },

  getOrderedProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTIONS,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: {
                $arrayElemAt: ["$product", 0],
              },
            },
          },
        ])
        .toArray();

      resolve(products);
    });
  },

  getOrderDetails: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: objectId(orderId) }).then((orderData)=>{
          resolve(orderData)
        })

    });
  },

  generateRazorPay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      instance.orders.create(
        {
          amount: total * 100,
          currency: "INR",
          receipt: orderId,
          notes: {
            key1: "value3",
            key2: "value2",
          },
        },
        (err, order) => {
          if (err) {
            console.log(err);
          } else {
            resolve(order);
          }
        }
      );
    });
  },

  generatePayPal: (orderId, totalPrice) => {
    let price = totalPrice.toString();
    return new Promise((resolve, reject) => {
      const create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: "http://localhost:3000/success",
          cancel_url: "http://localhost:3000/cancel",
        },
        transactions: [
          {
            item_list: {
              items: [
                {
                  name: "Red Sox Hat",
                  sku: "001",
                  price: totalPrice,
                  currency: "USD",
                  quantity: 1,
                },
              ],
            },
            amount: {
              currency: "USD",
              total: totalPrice,
            },
            description: "Hat for the best team ever",
          },
        ],
      };

      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          resolve(payment);
        }
      });
    });
  },

  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", process.env.KEY_SECRET);

      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },

  changePaymentStatus: (orderId) => {
    console.log(orderId);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          {
            _id: objectId(orderId),
          },
          {
            $set: { paymentstatus: "placed" },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
};
