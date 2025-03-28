function login() {
    const xhttp = new XMLHttpRequest();
    var userName = document.querySelector("#user_name").value;
    var password = document.querySelector("#password").value;
    var params = `user_name=${userName}&password=${password}`;
    xhttp.open("POST", "/login?"+params, true);
    xhttp.send();
    xhttp.onload = function() {
        window.location.href = "/";
    }
}

function register() {
    const xhttp = new XMLHttpRequest();
    var userName = document.querySelector("#user_name").value;
    var password = document.querySelector("#password").value;
    var params = `user_name=${userName}&password=${password}`;
    xhttp.open("POST", "/register?"+params, true);
    xhttp.send();
    xhttp.onload = function() {
        window.location.href = "/";
    }
}

socket.addEventListener("message", data => {
    var message = data["data"];
    console.log(message);
    if (message) {
        var warningBox = document.querySelector("#warning");
        warningBox.classList.remove("hidden");
        warningBox.classList.add("warning");
        document.querySelector("#warning p").innerHTML = message;
    }
});