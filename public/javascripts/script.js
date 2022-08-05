var FirstNameError = document.getElementById('firstName-error');
var LastNameError = document.getElementById('lastName-error');
var emailError = document.getElementById('email-error');
var phoneNumberError = document.getElementById('phoneNumber-error')
var passwordError = document.getElementById('password-error')
var confirmPasswordError = document.getElementById('confirmPassword-error')
var submitError = document.getElementById('submit-error');
// function validateFirstName() {
//   var FirstName = document.getElementById('firstName').value;

//   if (FirstName.length == 0) {
//     FirstNameError.innerHTML = "Name is required";
//     return false;
//   }
//   if (!FirstName.match(/^([A-Za-z])+$/)) {
//     FirstNameError.innerHTML = "Only letters";
//     return false;
//   }
//   if (FirstName.length < 3) {
//     FirstNameError.innerHTML = "Enter a valid name";
//     return false;
//   }
//   FirstNameError.innerHTML = ""
//   return true
// }
// function validateLastName() {
//   var LastName = document.getElementById('lastName').value;

//   if (LastName.length == 0) {
//     LastNameError.innerHTML = "Name is required";
//     return false;
//   }
//   if (!LastName.match(/^([A-Za-z])+$/)) {
//     LastNameError.innerHTML = "Only letters";
//     return false;
//   }
//   if (LastName.length < 3) {
//     LastNameError.innerHTML = "Enter a valid name";
//     return false;
//   }
//   LastNameError.innerHTML = ""
//   return true
// }

function validateEmail() {
  var email = document.getElementById('email').value;

  if (email.length == 0) {
    emailError.innerHTML = "Email is required";
    return false;

  }
  if (!email.match(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/)) {
    emailError.innerHTML = "Email is invalid";
    return false;
  }
  emailError.innerHTML = ""
  return true
}
function validatePhoneNumber() {
  var phone = document.getElementById('phoneNumber').value
  if (phone.length < 10) {
    phoneNumberError.innerHTML = "Phone number is required"
    return false
  }
  if (phone.match(/^([A-Za-z])+$/)) {
    LphoneNumberError.innerHTML = "Only numbers";
    return false;
  }
  if (!phone.match(/^\d{10}$/)) {
    phoneNumberError.innerHTML = "Phone number is invalid"
    return false
  }

  phoneNumberError.innerHTML = ""
  return true
}

function validatePassword() {
  var password = document.getElementById('password').value;

  if (password.length == 0) {
    passwordError.innerHTML = "Password is required";
    return false;

  }
  if (password.length < 3) {
    passwordError.innerHTML = "Password must be atleast 3 characters ";
    return false;
  }

  passwordError.innerHTML = ''
  return true

}
// function validateConfirmPassword() {
//   var password = document.getElementById('password').value
//   var confirmPassword = document.getElementById('confirmPassword').value
//   if (password != confirmPassword) {
//     confirmPasswordError.innerHTML = "Please enter same password"
//     return false
//   }
//   confirmPasswordError.innerHTML = ''
//   return true
// }


function validateForm() {


  if (!validateEmail() || !validatePhoneNumber() || !validatePassword()) {
    submitError.innerHTML = 'Please fill the form properly';
    return false;
  }
}


