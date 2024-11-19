CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    creation_time TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS players (
    player_id SERIAL PRIMARY KEY,
    username VARCHAR(50) DEFAULT 'anonymous' NOT NULL,
    status VARCHAR(10) DEFAULT 'waiting' NOT NULL
);

CREATE TABLE matches (
    match_id SERIAL PRIMARY KEY,
    player_id1 INTEGER NOT NULL,
    player_id2 INTEGER NOT NULL,
    status VARCHAR(10) DEFAULT 'ongoing' NOT NULL,
    turn INTEGER,
    winner INTEGER,
    last_move JSONB,
    
    -- Foreign Key Constraints
    CONSTRAINT matches_player_id1_fkey FOREIGN KEY (player_id1) REFERENCES players (player_id),
    CONSTRAINT matches_player_id2_fkey FOREIGN KEY (player_id2) REFERENCES players (player_id)
);