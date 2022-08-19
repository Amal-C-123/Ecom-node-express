


function changeOrderStatus(orderId,status) {
    $.ajax({
      url: "/admin/change-order-status/" + orderId,
      method: "POST",
      data: {
        status: status,
      },
      success: (response) => {
        if(response.statusChange){
            swal('User Order Status Changed').then(()=>{
                location.reload()
            })
        }
      }
    });
  }