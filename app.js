/**
 * Corona Management System
 * This is a  management system for keeping track of members, manufacturers, medical conditions, vaccination records, and vaccinations related to the coronavirus.
 * The system is built using Node.js and PostgreSQL as the database.
 * It provides a RESTful API for performing some of the  CRUD operations on the data.
 * Autor: Tamara Seban
 */

const express = require("express");
const app = express();
app.use(express.json());

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});

const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Corona Management System",
  password: "Secret",
  port: 5432,
});

//--------members -------

// Getting  Members
// Endpoint: GET /members
// Returns a JSON array containing information about all members in our system
app.get("/members", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM Members");
    res.send(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

// Getting a Single Member
// Endpoint: GET /members/:member_id
// Returns a JSON object containing information about the member with the given member_id.
app.get("/members/:member_id", async (req, res) => {
  const memberId = req.params.member_id;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM Members WHERE member_id = $1",
      [memberId]
    );
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: `Member with ID ${memberId} not found` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Adding  Members
// Endpoint: POST /members/add
// Returns a JSON array containing information about all members in our system
app.post("/members/add", async (req, res) => {
  console.log(req.body);
  if (!req.body.member_id) {
    return res
      .status(400)
      .json({ message: "Missing member_id in request body" });
  }

  const {
    member_id,
    first_name,
    last_name,
    phone,
    mobile,
    address,
    city,
    profile_photo,
  } = req.body;

  // Insert the new member into the Members table
  const queryText =
    "INSERT INTO Members (member_id, first_name, last_name, phone, mobile, address, city, profile_photo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)";
  const values = [
    member_id,
    first_name,
    last_name,
    phone,
    mobile,
    address,
    city,
    profile_photo,
  ];

  try {
    const result = await pool.query(queryText, values);
    res.status(201).json({ message: "Member added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding member" });
  }
});

//--------manufacturers -------

// Getting Manufacturers
// Endpoint: GET /manufacturers
// Returns a JSON array containing information about all manufacturers in our system
app.get("/manufacturers", function (req, res) {
  const query = "SELECT * FROM manufacturers";
  pool.query(query, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error retrieving manufacturers from database");
    } else {
      res.status(200).json(result.rows);
    }
  });
});

// Adding a manufacturer
// Endpoint: POST /manufacturers/add
// Returns a JSON array containing information about the added manufacturer
app.post("/manufacturers/add", async (req, res) => {
  console.log(req.body);
  if (!req.body.manufacturer_name) {
    return res
      .status(400)
      .json({ message: "Missing manufacturer_name in request body" });
  }

  const { manufacturer_name } = req.body;

  // Insert the new manufacturer into the Manufacturers table
  const queryText =
    "INSERT INTO Manufacturers (manufacturer_name) VALUES ($1) RETURNING *";
  const values = [manufacturer_name];

  try {
    const result = await pool.query(queryText, values);
    res.status(201).json({ message: "Manufacturer added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding manufacturer" });
  }
});

//--------medicalconditions -------

// Getting medicalconditions
// Endpoint: GET /medicalconditions
// Returns a JSON array containing information about all medicalconditions in our system
app.get("/medicalconditions", (req, res) => {
  const query = "SELECT * FROM medicalconditions";

  pool.query(query, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error retrieving medical conditions");
    } else {
      res.status(200).json(result.rows);
    }
  });
});

// Adding Medical Conditions
// Endpoint: POST /medicalconditions/add
// Returns a JSON response indicating success or failure of the operation
app.post("/medicalconditions/add", async (req, res) => {
  console.log(req.body);
  if (!req.body.member_id) {
    return res
      .status(400)
      .json({ message: "Missing member_id in request body" });
  }

  const { member_id, positive_result_date, recovery_date } = req.body;

  // Insert the new medical condition into the MedicalConditions table
  const queryText =
    "INSERT INTO MedicalConditions (member_id, positive_result_date, recovery_date) VALUES ($1, $2, $3)";
  const values = [member_id, positive_result_date, recovery_date];

  try {
    const result = await pool.query(queryText, values);
    res.status(201).json({ message: "Medical condition added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding medical condition" });
  }
});

//--------vaccinations -------

// Getting Vaccinations
// Endpoint: GET /vaccinations
// Returns a JSON array containing information about all vaccinations in our system
app.get("/vaccinations", function (req, res) {
  pool.query("SELECT * FROM vaccinations", (error, results) => {
    if (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: "Unable to retrieve data from vaccinations table" });
    } else {
      res.status(200).json(results.rows);
    }
  });
});

// Adding a new Vaccination
// Endpoint: POST /vaccinations/add
// Returns a JSON object containing information about the newly added vaccination

app.post("/vaccinations/add", async (req, res) => {
  const { vaccination_id, manufacturer_id } = req.body;

  // Check if required fields are present
  if (!vaccination_id || !manufacturer_id) {
    return res.status(400).json({
      message: "Please provide both vaccination_id and manufacturer_id",
    });
  }

  // Check if manufacturer_id exists in manufacturers table
  pool.query(
    "SELECT * FROM manufacturers WHERE manufacturer_id = $1",
    [manufacturer_id],
    (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: "Error querying the database" });
      }

      if (results.rows.length === 0) {
        return res.status(400).json({
          message: `Manufacturer with id ${manufacturer_id} does not exist`,
        });
      }

      // Insert new record into vaccinations table
      pool.query(
        "INSERT INTO vaccinations (vaccination_id, manufacturer_id) VALUES ($1, $2)",
        [vaccination_id, manufacturer_id],
        (error, results) => {
          if (error) {
            console.error(error);
            return res
              .status(500)
              .json({ message: "Error inserting record into database" });
          }

          res
            .status(201)
            .json({ message: "Record added to vaccinations table" });
        }
      );
    }
  );
});

//--------vaccinationsrecords -------

// Getting Vaccination Records
// Endpoint: GET /vaccination-records
// Returns a JSON array containing information about all vaccination records in our system
app.get("/vaccinationrecords", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM vaccinationsRecords");
    res.send(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

// Add a new vaccination record
// Endpoint: POST /vaccinations
// Expects a JSON object in the request body with the following fields:
// - vaccination_id (integer): the ID of the vaccination administered
// - member_id (integer): the ID of the member who received the vaccination
// - vaccination_date (string): the date the vaccination was administered in YYYY-MM-DD format
app.post("/vaccinationrecords/add", async (req, res) => {
  try {
    const { vaccination_id, member_id, vaccination_date } = req.body;

    // Check if the vaccination and member IDs are valid
    const vaccinationResult = await pool.query(
      "SELECT * FROM Vaccinations WHERE vaccination_id = $1",
      [vaccination_id]
    );
    if (vaccinationResult.rowCount === 0) {
      return res.status(400).send("Invalid vaccination ID");
    }

    const memberResult = await pool.query(
      "SELECT * FROM Members WHERE member_id = $1",
      [member_id]
    );
    if (memberResult.rowCount === 0) {
      return res.status(400).send("Invalid member ID");
    }

    // Insert the new vaccination record into the vaccinationsRecords table
    await pool.query(
      "INSERT INTO vaccinationsRecords (vaccination_id, member_id, vaccination_date) VALUES ($1, $2, $3)",
      [vaccination_id, member_id, vaccination_date]
    );

    res.status(201).send("Vaccination record added successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

//------BONUS

//Endpoint: GET /unvaccinatedMembersCount
//Description: Retrieves the number of members who have not been vaccinated at all
app.get("/unvaccinatedMembersCount", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(*) 
      FROM Members 
      WHERE member_id NOT IN (
        SELECT member_id 
        FROM vaccinationsRecords
      )
    `);
    res.send(rows[0].count);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

// Getting the number of members who were sick in the last month
app.get("/sickCount", async (req, res) => {
  try {
    // Get today's date
    const today = new Date();
    // Calculate the date 30 days ago
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

    // Query the database for sick members within the last month
    const { rows } = await pool.query(
      `
      SELECT COUNT(*) AS count, DATE_TRUNC('day', positive_result_date) AS date
      FROM MedicalConditions
      WHERE positive_result_date >= $1 AND recovery_date <= $2
      GROUP BY date
      ORDER BY date ASC
    `,
      [thirtyDaysAgo, today]
    );

    // Send the result as a JSON response
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});
