-- Create a temporary table with the same structure
CREATE TABLE card_reviews_temp AS SELECT * FROM card_reviews;

-- Drop the original table
DROP TABLE card_reviews;

-- Recreate the table with proper structure
CREATE TABLE card_reviews (
                              id TEXT PRIMARY KEY NOT NULL,
                              flashcard_id TEXT NOT NULL REFERENCES flashcards(id),
                              user_id TEXT NOT NULL REFERENCES user(id),
                              reviewed_at INTEGER DEFAULT CURRENT_TIMESTAMP NOT NULL,
                              rating INTEGER NOT NULL,
                              ease_factor INTEGER DEFAULT 250 NOT NULL,
                              interval INTEGER DEFAULT 0 NOT NULL,
                              next_review INTEGER NOT NULL
);

-- Copy data back
INSERT INTO card_reviews SELECT * FROM card_reviews_temp;

-- Drop temporary table
DROP TABLE card_reviews_temp;

-- Create indexes
CREATE INDEX card_reviews_user_id_idx ON card_reviews (user_id);
CREATE INDEX card_reviews_flashcard_id_idx ON card_reviews (flashcard_id);
CREATE INDEX card_reviews_next_review_idx ON card_reviews (next_review);
CREATE INDEX card_reviews_user_flashcard_idx ON card_reviews (user_id, flashcard_id);