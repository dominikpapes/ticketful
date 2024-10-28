import {Pool} from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: {
        rejectUnauthorized: false,
    },
})

export async function getAll() {
    const query = 'SELECT COUNT(*) FROM tickets'
    try{
        const result = await pool.query(query);
        return result.rows[0]?.count || 0;
    } catch (error){
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function getOne(id: string) {
    const query = 'SELECT * FROM tickets WHERE id = $1';
    const values = [id];
    try{
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error){
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function getCountTickets(vatin: string) {
    const query = 'SELECT COUNT(tickets.vatin) FROM tickets WHERE vatin = $1 GROUP BY tickets.vatin'
    const values = [vatin]
    try{
        const result = await pool.query(query, values);
        return result.rows[0]?.count || 0;
    } catch (error){
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function newTicket(vatin: string, firstName: string, lastName: string) {
    const query = 'INSERT INTO tickets (vatin, firstName, lastName) VALUES ($1, $2, $3) RETURNING id'
    const values = [vatin, firstName, lastName];
    try{
        const result = await pool.query(query, values);
        return result.rows[0]?.id;
    } catch (error){
        console.error('Error executing query:', error);
        throw error;
    }
}
