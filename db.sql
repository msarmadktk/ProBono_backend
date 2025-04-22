

DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS balances CASCADE;
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS digitalproducts CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS connects CASCADE;
DROP TABLE IF EXISTS courseenrollments CASCADE;
DROP TABLE IF EXISTS learningcourses CASCADE;
DROP TABLE IF EXISTS work_history CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS portfolioitems CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS job_categories CASCADE;
-- ===============================
-- 1. Users & Authentication
-- ===============================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    user_type       VARCHAR(20) NOT NULL 
                    CHECK (user_type IN ('freelancer','client','admin')),
    status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active','suspended','banned')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- 2. Freelancer Profiles & Portfolios
-- ===============================
CREATE TABLE profiles (
    id                SERIAL PRIMARY KEY,
    user_id           INT NOT NULL UNIQUE,
    skills            TEXT,
    bio               TEXT,
    experience_level  VARCHAR(20) DEFAULT 'Entry-Level'
                      CHECK (experience_level IN ('Entry-Level','Intermediate','Expert')),
    average_rating    DECIMAL(3,2) DEFAULT 0.00,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hourly_rate       DECIMAL(10,2),
    title             VARCHAR(255),
    profile_image     VARCHAR(255),
    is_public         BOOLEAN DEFAULT true,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE portfolioitems (
    id             SERIAL PRIMARY KEY,
    profile_id     INT NOT NULL,
    project_title  VARCHAR(255) NOT NULL,
    description    TEXT,
    media_links    TEXT,  -- could store JSON or comma-separated URLs
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);
-- ===============================
-- Job Categories
-- ===============================
CREATE TABLE job_categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ===============================
-- 3. Jobs & Proposals
-- ===============================
CREATE TABLE jobs (
    id              SERIAL PRIMARY KEY,
    client_id       INT NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    skills_required TEXT, -- can store JSON or comma-separated values
    budget          DECIMAL(10,2),
    status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','closed')),
    location        VARCHAR(255),
    category_id     INTEGER REFERENCES job_categories(id) ON DELETE SET NULL,
    experience_level VARCHAR(50) CHECK (experience_level IN ('Entry Level', 'Intermediate', 'Expert')),
    job_type        VARCHAR(20) CHECK (job_type IN ('Hourly', 'Fixed')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE proposals (
    id               SERIAL PRIMARY KEY,
    job_id           INT NOT NULL,
    freelancer_id    INT NOT NULL,
    proposal_content TEXT,
    timeline         VARCHAR(255),
    bid              DECIMAL(10,2),
    status           VARCHAR(20) DEFAULT 'submitted'
                    CHECK (status IN ('submitted','accepted','rejected')),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===============================
-- 4. Learning Hub
-- ===============================
CREATE TABLE learningcourses (
    id           SERIAL PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    content_url  VARCHAR(255),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courseenrollments (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL,
    course_id       INT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status          VARCHAR(20) DEFAULT 'enrolled'
                    CHECK (status IN ('enrolled','completed')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES learningcourses(id) ON DELETE CASCADE
);

-- ===============================
-- 5. Financials, Connects & Balances
-- ===============================
CREATE TABLE connects (
    id           SERIAL PRIMARY KEY,
    user_id      INT NOT NULL UNIQUE,
    balance      INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE balances (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL UNIQUE,
    available_amount DECIMAL(10,2) DEFAULT 0.00,
    pending_amount  DECIMAL(10,2) DEFAULT 0.00,
    last_updated    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE transactions (
    id               SERIAL PRIMARY KEY,
    user_id          INT NOT NULL,
    job_id           INT,
    transaction_type VARCHAR(20) NOT NULL
                    CHECK (transaction_type IN ('connect_purchase','revenue_share','refund','other','job_posting_fee')),
    amount           DECIMAL(10,2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details          TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
);

-- ===============================
-- 6. Feedback & Reviews
-- ===============================
CREATE TABLE feedback (
    id          SERIAL PRIMARY KEY,
    job_id      INT NOT NULL,
    reviewer_id INT NOT NULL,
    reviewee_id INT NOT NULL,
    rating      DECIMAL(3,2) NOT NULL,
    comment     TEXT,
    role        VARCHAR(20) NOT NULL
                CHECK (role IN ('client','freelancer')),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===============================
-- 7. Digital Marketplace
-- ===============================
CREATE TABLE digitalproducts (
    id            SERIAL PRIMARY KEY,
    freelancer_id INT NOT NULL,
    product_name  VARCHAR(255) NOT NULL,
    description   TEXT,
    product_url   VARCHAR(255),
    price         DECIMAL(10,2),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE product_reviews (
    id          SERIAL PRIMARY KEY,
    product_id  INT NOT NULL,
    reviewer_id INT NOT NULL,
    rating      DECIMAL(3,2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    comment     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES digitalproducts(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===============================
-- 8. Communication: Chat System
-- ===============================
CREATE TABLE chats (
    id            SERIAL PRIMARY KEY,
    job_id        INT,
    client_id     INT NOT NULL,
    freelancer_id INT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
    id              SERIAL PRIMARY KEY,
    chat_id         INT NOT NULL,
    sender_id       INT NOT NULL,
    message_content TEXT,
    sent_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===============================
-- 9. Moderation & Dispute Resolution
-- ===============================
CREATE TABLE reports (
    id              SERIAL PRIMARY KEY,
    reporter_id     INT NOT NULL,
    reported_user_id INT NOT NULL,
    job_id          INT NOT NULL,
    reason          TEXT,
    status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending','resolved')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE TABLE disputes (
    id                SERIAL PRIMARY KEY,
    job_id            INT NOT NULL,
    description       TEXT,
    status            VARCHAR(20) DEFAULT 'open'
                      CHECK (status IN ('open','resolved')),
    resolution_details TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- ===============================
-- 10. Announcements & Notifications
-- ===============================
CREATE TABLE announcements (
    id                  SERIAL PRIMARY KEY,
    title               VARCHAR(255) NOT NULL,
    message             TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_send_time TIMESTAMP
);

-- ===============================
-- 11. Optional Extensions
-- ===============================
CREATE TABLE badges (
    id         SERIAL PRIMARY KEY,
    user_id    INT NOT NULL,
    badge_type VARCHAR(100),
    issued_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE invitations (
    id             SERIAL PRIMARY KEY,
    job_id         INT NOT NULL,
    freelancer_id  INT NOT NULL,
    status         VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending','accepted','declined')),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE analytics (
    id           SERIAL PRIMARY KEY,
    user_id      INT NOT NULL,
    metric_type  VARCHAR(255),
    metric_value DECIMAL(10,2),
    time_period  VARCHAR(50),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===============================
-- 12. Work History
-- ===============================
CREATE TABLE work_history (
    id            SERIAL PRIMARY KEY,
    user_id       INT NOT NULL,
    company_name  VARCHAR(255),
    position      VARCHAR(255),
    start_date    DATE NOT NULL,
    end_date      DATE,
    description   TEXT,
    is_current    BOOLEAN DEFAULT false,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ======================================================
-- 13. Functions & Triggers for "updated_at"/"last_updated"
--     to emulate MySQL's "ON UPDATE CURRENT_TIMESTAMP"
-- ======================================================

-- 13.1. Function for "updated_at" columns
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13.2. Function for "last_updated" in connects and balances
CREATE OR REPLACE FUNCTION set_last_updated_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13.3. Create triggers for tables having an 'updated_at' column.
CREATE TRIGGER tg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at_timestamp();

CREATE TRIGGER tg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at_timestamp();

CREATE TRIGGER tg_jobs_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at_timestamp();

CREATE TRIGGER tg_proposals_updated_at
BEFORE UPDATE ON proposals
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at_timestamp();

CREATE TRIGGER tg_learningcourses_updated_at
BEFORE UPDATE ON learningcourses
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at_timestamp();

CREATE TRIGGER tg_digitalproducts_updated_at
BEFORE UPDATE ON digitalproducts
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at_timestamp();

CREATE TRIGGER tg_disputes_updated_at
BEFORE UPDATE ON disputes
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at_timestamp();

CREATE TRIGGER tg_work_history_updated_at
BEFORE UPDATE ON work_history
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at_timestamp();

-- 13.4. Trigger for the "last_updated" column
CREATE TRIGGER tg_connects_last_updated
BEFORE UPDATE ON connects
FOR EACH ROW
EXECUTE PROCEDURE set_last_updated_timestamp();

CREATE TRIGGER tg_balances_last_updated
BEFORE UPDATE ON balances
FOR EACH ROW
EXECUTE PROCEDURE set_last_updated_timestamp();

ALTER TABLE work_history ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

INSERT INTO public.job_categories (id, name) VALUES
(1, 'Web Development'),
(2, 'Graphic Design'),
(3, 'Content Writing'),
(4, 'Digital Marketing'),
(5, 'Mobile App Development'),
(6, 'Video Editing'),
(7, 'Virtual Assistance'),
(8, 'SEO Specialist'),
(9, 'UI/UX Design'),
(10, 'Data Entry'),
(11, 'Translation Services'),
(12, 'Voice Over'),
(13, 'Social Media Management'),
(14, 'E-commerce Management'),
(15, 'Game Development');