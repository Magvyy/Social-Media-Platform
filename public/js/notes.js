


var notes = document.querySelectorAll("#notes");
for (let i = 0; i < notes.length; i++) {
    var note = notes[i];
    var temp = note.querySelector("#header a").getAttribute("href").split("/");
    var noteId = temp[temp.length - 1];
    var actions = note.querySelector("#interact");

    var like = actions[0];
    like.addEventListener("click", function() {
        const xhttp = new XMLHttpRequest();
        xhttp.open("GET", "/note/like?" + noteId, true);
        xhttp.send();
    });

    var comment = actions[1];
    comment.addEventListener("click", function() {
        // bla bla bla
    });

    var share = actions[2];
    comment.addEventListener("click", function() {
        // bla bla bla
    });
}