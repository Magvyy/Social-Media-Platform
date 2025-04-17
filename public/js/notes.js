function likeNote(noteId) {
    const xhttp = new XMLHttpRequest();
    var params = `note_id=${noteId}&comment_id=null`;
    xhttp.open("POST", "/like?" + params, true);
    xhttp.send();
}