CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    time_created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    alias VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL
);

CREATE TABLE user_devices (
    id SERIAL PRIMARY KEY,
    device_push_token VARCHAR(255) UNIQUE NOT NULL,
    platform VARCHAR (255),
    last_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    usr_id INT,
    CONSTRAINT FK_user_id_device FOREIGN KEY(usr_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE threads (
    id SERIAL PRIMARY KEY,
    thread_name CHAR(2) UNIQUE NOT NULL
);

CREATE TABLE follow (
    thread_id INT,
    usr_id INT,
    CONSTRAINT pk_follow PRIMARY KEY (thread_id, usr_id),
    CONSTRAINT FK_user_id_follow FOREIGN KEY(usr_id) REFERENCES users(id)
    ON DELETE CASCADE,
    CONSTRAINT FK_thread_id_follow FOREIGN KEY(thread_id) REFERENCES threads(id)
    ON DELETE CASCADE
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    time_created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(255) NOT NULL,
    building CHAR(2) NOT NULL,
    post_floor CHAR(2) NOT NULL,
    nearest_room CHAR(3) NOT NULL,
    found_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    post_description TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    post_status VARCHAR(20) DEFAULT 'OPEN',
    usr_id INT,
    thread_id INT,
    CONSTRAINT FK_user_id_post FOREIGN KEY(usr_id) REFERENCES users(id)
    ON DELETE RESTRICT,
    CONSTRAINT FK_thread_id_post FOREIGN KEY(thread_id) REFERENCES threads(id)
    ON DELETE RESTRICT

);

CREATE TABLE post_images (
    id SERIAL PRIMARY KEY,
    post_id INT,
    url VARCHAR(255) NOT NULL,
    CONSTRAINT FK_post_id_image FOREIGN KEY(post_id) REFERENCES posts(id)
    ON DELETE CASCADE
);

CREATE TABLE claims (
    id SERIAL PRIMARY KEY,
    time_created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    claim_description TEXT NOT NULL,
    contact_info VARCHAR(255) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    usr_id INT,
    post_id INT,
    CONSTRAINT FK_user_id_claim FOREIGN KEY(usr_id) REFERENCES users(id)
    ON DELETE RESTRICT,
    CONSTRAINT FK_post_id_claim FOREIGN KEY(post_id) REFERENCES posts(id)
    ON DELETE RESTRICT
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    time_created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(255) NOT NULL,
    noti_message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    usr_id INT NOT NULL,
    post_id INT,
    CONSTRAINT FK_user_id_noti FOREIGN KEY(usr_id) REFERENCES users(id)
    ON delete cascade,
    CONSTRAINT FK_post_id_noti FOREIGN KEY(post_id) REFERENCES posts(id)
    ON DELETE CASCADE
);

CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    time_created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(255) NOT NULL,
    report_message TEXT NOT NULL,
    report_status VARCHAR(50) DEFAULT 'UNRESOLVED',
    usr_id INT NOT NULL,
    post_id INT,
    claim_id INT UNIQUE,
    CONSTRAINT FK_user_id_report FOREIGN KEY(usr_id) REFERENCES users(id)
    ON DELETE RESTRICT,
    CONSTRAINT FK_post_id_report FOREIGN KEY(post_id) REFERENCES posts(id) 
    ON DELETE RESTRICT,
    CONSTRAINT FK_claim_id_report FOREIGN KEY(claim_id) REFERENCES claims(id) 
    ON DELETE RESTRICT,
    CONSTRAINT CK_report_target CHECK (
        NUM_NONNULLS(post_id, claim_id) = 1
    )
);

-- CREATE TABLE claim_reports (
--     report_id INT PRIMARY KEY,
--     claim_id INT,
--     CONSTRAINT FK_report_id_claimreport FOREIGN KEY(report_id) REFERENCES reports(id)
--     ON DELETE CASCADE,
--     CONSTRAINT FK_claim_id_claimreport FOREIGN KEY(claim_id) REFERENCES claims(id)
--     ON DELETE CASCADE
-- );

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    time_created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actions VARCHAR(255) NOT NULL,
    log_detail TEXT NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INT NOT NULL,
    usr_id INT, --NULL mean system
    CONSTRAINT FK_user_id_auditlogs FOREIGN KEY(usr_id) REFERENCES users(id)
    ON DELETE RESTRICT
);

