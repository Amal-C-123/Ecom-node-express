


function addToCart(proId) {
  $.ajax({
    url: "/add-to-cart/" + proId,
    method: "get",
    success: (response) => {
      if (response.status) {
        
        let count = $("#cart-count").html();
        count = parseInt(count) + 1;
        $("#cart-count").html(count);
        swal('Item Added to Cart')
      }else if(response.alertOnly){
        swal('Item Added to Cart')
      }
      else{
         window.location.href='/user-orders-list'
      }
      
    },
  })
    .done(() => {
       
      // window.location.href='/add-to-cart/:id'  
    })
    .catch((e) => console.log("header.hbs error"));
}

function changeQuantity(cartId, proId, count, dummy) {
  event.preventDefault();
  let quantity = parseInt(document.getElementById(proId).innerHTML);
  count = parseInt(count);
  $.ajax({
    url: "/change-product-quantity",
    data: {
      cart: cartId,
      product: proId,
      count: count,
      quantity: quantity,
    },
    method: "post",
    success: (response) => {
      if (response.removeProduct) {
        // alert("Product Removed from cart");
        swal("Product removed from the cart").then(() => {
          location.reload();
        });
      } else {
        document.getElementById(proId).innerHTML = quantity + count;
        document.getElementById("total").innerHTML = "₹ " + response.total;
        document.getElementById("total-price").innerHTML = "₹ " + response.total;
      }
    },
  });
}



