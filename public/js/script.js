 $(document).ready(function(){
	 //$( document ).tooltip();
	 
$(".fakeloader").fakeLoader({

// Time in milliseconds for fakeLoader disappear
timeToHide:1200, 

// 'spinner1', 'spinner2', 'spinner3', 'spinner4', 'spinner5', 'spinner6', 'spinner7' 
spinner:"spinner2",//Options: 

// Background color. Hex, RGB or RGBA colors
bgColor:"#2ecc71",

// Custom loading GIF.
            
});


	 //this is for tool tip
	  var tooltips = $( "[title]" ).tooltip({
      position: {
        my: "left top",
        at: "right+5 top-5"
      }
    });
	
 $("#submit").click(function () {

	 if($("input[placeholder=Username]").val() === "" || $("input[placeholder=Password]").val() === "") 
	 {
		 alert("Please Enter valid user name and password!");
         return;
	/*	swal({   title: "Login Failed!",   text: "Please Enter valid user name and password!",   type: "error",   confirmButtonText: "Login again" });
	 }

	 $.alert({
    title: 'Login Failed!',
    content: 'Please Enter valid user name and password!',
    confirm: function(){
			alert('Confirmed!');
    }
});	 */
	 
 }
  /*
        $.ajax({
          url: "http://localhost:3001/login",
            type: "POST",
            contentType: "application/json;charset=utf-8",
            data: JSON.stringify({
                UserName: $("input[placeholder=Username]").val(),
                Password: $("input[placeholder=Password]").val(),
                Role:$("#role option:selected").text()
            }),
            success: function (response) {
                location = response;
            },
            error: function (e) {
                alert("Failed to Login!!");
            }
        });*/
    });
 });