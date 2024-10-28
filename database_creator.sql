CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
DROP TABLE IF EXISTS tickets;
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vatin CHAR(10) NOT NULL,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    ticketNo INT DEFAULT 1 CHECK (ticketNo >= 1 AND ticketNo <= 3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION increment_ticket_no()
RETURNS TRIGGER AS $$
DECLARE
    current_ticket_no INT;
BEGIN
    -- Get the current maximum ticketNo for the matching vatin
    SELECT COALESCE(MAX(ticketNo), 0)
    INTO current_ticket_no
    FROM tickets
    WHERE vatin = NEW.vatin;

    -- Increment ticketNo if it's less than 3
    IF current_ticket_no < 3 THEN
        NEW.ticketNo := current_ticket_no + 1;
    ELSE
        RAISE EXCEPTION 'Maximum ticket number reached for VATIN %', NEW.vatin;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_no
BEFORE INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION increment_ticket_no();

INSERT INTO tickets (vatin, firstName, lastName)
VALUES ('1234567890', 'John', 'Doe');

SELECT tickets.vatin, tickets.firstName, tickets.lastName
FROM tickets
WHERE id = '40431a1d-e6be-4187-a140-e856c1ba601b';

SELECT COUNT(tickets.vatin)
FROM tickets
WHERE vatin = '1234567890'
GROUP BY tickets.vatin;

SELECT id FROM tickets WHERE vatin = '1234567890';