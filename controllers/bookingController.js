const pool = require('../db');

exports.bookSeats = async (req, res) => {
  const client = await pool.connect();
  try {
    const { seats } = req.body;
    const userId = req.user.id;

    console.log(seats);

    if (!Array.isArray(seats) || seats.length < 1 || seats.length > 7) {
      return res.status(400).json({ error: 'You can book 1 to 7 seats only' });
    }

    await client.query('BEGIN');

    const bookedSeats = [];
    const currentTimestamp = new Date().toISOString();

    for (const seatNumber of seats) {
      const seatRes = await client.query(
        'SELECT * FROM seats WHERE seat_number = $1',
        [seatNumber]
      );

      if (seatRes.rows.length > 0) {
        const seat = seatRes.rows[0];
        if (seat.is_booked) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Seat ${seatNumber} is already booked` });
        }

        await client.query(
          `UPDATE seats SET is_booked = true, booked_by = $1, booked_at = $2 WHERE seat_number = $3`,
          [userId, currentTimestamp, seatNumber]
        );
      } else {
        // Extract row character (e.g. 'A' from 'A3') as row_number
        const rowNumber = Math.ceil(seatNumber / 7);

        await client.query(
          `INSERT INTO seats (seat_number, row_number, is_booked, booked_by, booked_at)
           VALUES ($1, $2, true, $3, $4)`,
          [seatNumber, rowNumber, userId, currentTimestamp]
        );
      }

      bookedSeats.push(seatNumber);
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Booking successful', seats: bookedSeats });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Booking failed' });
  } finally {
    client.release();
  }
};

// GET /api/seats/booked
exports.getAllBookedSeats = async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT seat_number FROM seats WHERE is_booked = true ORDER BY seat_number`
    );

    res.status(200).json({ bookedSeats: result.rows.map(row => row.seat_number) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch booked seats' });
  } finally {
    client.release();
  }
};

// GET /api/seats/my-bookings
exports.getUserBookedSeats = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id; // Get the user ID from the authenticated user

    // Query the database for the seats booked by the user
    const result = await client.query(
      `SELECT seat_number, booked_at, row_number FROM seats WHERE booked_by = $1 ORDER BY seat_number`,
      [userId]
    );

    // Map the result rows to an array of ticket objects
    const tickets = result.rows.map((row, index) => {
      return {
        ticketId: `TICKET-${index + 1}`,  // Generate a unique ticket ID (you can use your own logic here)
        seat: row.seat_number,
        date: row.booked_at, // Assuming `booked_at` is the date when the seat was booked
        row: row.row_number, // Row information from the `row_number` field
      };
    });

    // Return the mapped tickets as the response
    res.status(200).json({ myBookedSeats: tickets });
  } catch (err) {
    console.error(err);  // Log any errors
    res.status(500).json({ error: 'Failed to fetch your booked seats' });
  } finally {
    client.release(); // Release the database client
  }
};


// DELETE /api/seats/cancel-booking
// DELETE /api/seats/cancel-booking
exports.cancelBooking = async (req, res) => {
  const client = await pool.connect();
  try {
    const { seatNumbers } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({ error: 'Please provide seat numbers to cancel' });
    }

    await client.query('BEGIN');

    // First verify all seats belong to the user
    const verificationResult = await client.query(
      `SELECT seat_number FROM seats 
       WHERE seat_number = ANY($1) 
       AND booked_by = $2`,
      [seatNumbers, userId]
    );

    const verifiedSeats = verificationResult.rows.map(row => row.seat_number);
    const invalidSeats = seatNumbers.filter(seat => !verifiedSeats.includes(seat));

    if (invalidSeats.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Some seats are not booked by you or do not exist',
        invalidSeats
      });
    }

    // Delete the seats completely
    await client.query(
      `DELETE FROM seats 
       WHERE seat_number = ANY($1)`,
      [seatNumbers]
    );

    await client.query('COMMIT');
    res.status(200).json({ 
      message: 'Booking cancellation successful - seats removed',
      cancelledSeats: seatNumbers
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Booking cancellation failed' });
  } finally {
    client.release();
  }
};



