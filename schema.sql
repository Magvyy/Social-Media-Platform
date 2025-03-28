DROP DATABASE notes_app;


DROP TABLE users;
CREATE TABLE users (
    user_name VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    UNIQUE (user_name),
    PRIMARY KEY (user_name)
);

DROP TABLE notes;
CREATE TABLE notes (
    note_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_name VARCHAR(150) NOT NULL,
    note_name VARCHAR(150) NOT NULL,
    note_content VARCHAR(4096),
    public TINYINT(1),
    created TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (note_id),
    FOREIGN KEY (user_name) REFERENCES users(user_name)
);

DROP TABLE access;
CREATE TABLE access (
    note_id INT UNSIGNED NOT NULL,
    user_name VARCHAR(150) NOT NULL,
    readable TINYINT(1) NOT NULL,
    writeable TINYINT(1) NOT NULL,
    PRIMARY KEY (note_id, user_name)
);

DROP TABLE profiles;
CREATE TABLE profiles (
    user_name VARCHAR(150) NOT NULL,
    banner VARCHAR(255),
    profile_pic VARCHAR(255),
    PRIMARY KEY (user_name),
    FOREIGN KEY (user_name) REFERENCES users(user_name)
);

DROP TABLE messages;
CREATE TABLE messages (
    message_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    chat_id INT UNSIGNED NOT NULL,
    sender VARCHAR(150) NOT NULL,
    recipient VARCHAR(150) NOT NULL,
    message VARCHAR(4096) NOT NULL,
    sent TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY(message_id),
    FOREIGN KEY(sender) REFERENCES users(user_name),
    FOREIGN KEY(recipient) REFERENCES users(user_name)
);

DROP TABLE chats;
CREATE TABLE chats (
    chat_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    chatter_1 VARCHAR(150) NOT NULL,
    chatter_2 VARCHAR(150) NOT NULL,
    PRIMARY KEY(chat_id),
    FOREIGN KEY(chatter_1) REFERENCES users(user_name),
    FOREIGN KEY(chatter_2) REFERENCES users(user_name)
);