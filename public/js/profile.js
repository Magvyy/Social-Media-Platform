document.addEventListener("keydown", function(e) {
    var key = e.key.toLowerCase();
    if (key === "enter") {
        var chatbox = document.querySelector("textarea");
        var message = chatbox.value.replaceAll("\n", "");
        chatbox.value = "";
        chatbox.value.replace("\n", "");
        if (e.preventDefault) {
            e.preventDefault();
        }
        if (message !== "") {
            sendMessage(message);
        }
    }
})

function sendMessage(message) {
    const xhttp = new XMLHttpRequest();
    var temp = window.location.href.split("/");
    var recipient = temp[temp.length - 1];
    var params = `recipient=${recipient}&message=${message}`;
    xhttp.open("POST", "/message?"+params, true);
    xhttp.send();
    var parent = document.querySelector("#messages");
    var child = document.createElement("p");
    child.setAttribute("class", "sent message");
    child.innerHTML = message;
    parent.insertBefore(child, parent.firstChild);
}

socket.addEventListener("message", data => {
    var [message, sender] = data["data"].split("&");
    var messages = document.querySelector("#messages");
    message = makeMessage(message);
    messages.insertBefore(message, messages.firstChild);
});

function makeMessage(msg) {
    let message = document.createElement("p");
    message.setAttribute("class", "recieved message");
    message.innerHTML = msg;
    return message;
}