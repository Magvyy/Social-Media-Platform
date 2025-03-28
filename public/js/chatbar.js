socket.addEventListener("message", data => {
    var [message, sender] = data["data"].split("&");
    var chatbox = document.querySelector("#chat-" + sender + " a h5");
    chatbox.innerHTML = sender + ": " + message;
});