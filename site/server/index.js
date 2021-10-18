const express = require("express");
const path = require("path");
const { Pool } = require('pg')

const app = express();
const pool = new Pool();
const port = 8000;

pool.on("error", (err, client) => {
    console.error("Unexpected error on idle client", err);
    process.exit(-1);
});

app.use("/ukdrugmap/static", express.static("public"));
app.use('/ukdrugmap/static', express.static(path.join(__dirname, "../fe/dist")));

const getAdulterantStats = async (q1, q2, b, client) => {
    const qres0 = await client.query(q1, b);
    const qres1 = await client.query(q2, b);
    const numWithAdulterants = +qres0.rows[0].count;
    const count = +qres1.rows[0].count
    const percentWithAdulterants = Math.round(numWithAdulterants / count * 100);
    return { count, percentWithAdulterants };
};


app.get('/ukdrugmap', (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
}); 


app.get('/ukdrugmap/counties/all/:drug', async (req, res) => {
    const client = await pool.connect();

    const { count, percentWithAdulterants } = await getAdulterantStats(
        `SELECT COUNT(*) count FROM test_results WHERE (cardinality(analysis_any) != 1 OR purchase_intent != ANY(analysis_any)) AND purchase_intent = $1`,
        `SELECT COUNT(*) count FROM test_results WHERE purchase_intent = $1`,
        [req.params.drug], 
        client,
    );

    const QUERY = `WITH substances AS (
            SELECT a.analysis_any substance, COUNT(*) count FROM (
            SELECT
            unnest(t.analysis_any) analysis_any
            FROM (SELECT * FROM test_results WHERE purchase_intent = $1) t
            ) a GROUP BY a.analysis_any
        ), 
        substance_counts AS (
            SELECT COUNT(*) substance_count FROM test_results WHERE purchase_intent = $1
        )
        SELECT s.*, s.count::decimal / sc.substance_count::decimal percentage FROM substances s, substance_counts sc`;

    try {
        const qres = await client.query(QUERY, [req.params.drug]);
        res.json({rows: qres.rows.sort((x, y) => y.count - x.count), count, percentWithAdulterants});
    } catch (e) {
        console.log(e);
    } finally {
        // Make sure to release the client before any error handling,
        // just in case the error handling itself throws an error.
        client.release()
    }
}); 


app.get('/ukdrugmap/counties/:name/:drug', async (req, res) => {
    const client = await pool.connect();

    const { count, percentWithAdulterants } = await getAdulterantStats(
        `SELECT COUNT(*) count FROM 
                (SELECT * FROM test_results WHERE (cardinality(analysis_any) != 1 OR purchase_intent != ANY(analysis_any)) AND purchase_intent = $2) t
            JOIN
                (SELECT * FROM counties WHERE ctyua19nm = $1) c
            ON ST_WITHIN(t.geom, c.st_areashape)`,
        `SELECT COUNT(*) count FROM (SELECT * FROM test_results WHERE purchase_intent = $2) t
            JOIN
                (SELECT * FROM counties WHERE ctyua19nm = $1) c
            ON ST_WITHIN(t.geom, c.st_areashape)`,
        [req.params.name, req.params.drug], 
        client,
    );

    const QUERY = `WITH substances AS (
            SELECT a.analysis_any substance, COUNT(*) count FROM (
            SELECT
            unnest(t.analysis_any) analysis_any
            FROM 
                (SELECT * FROM counties WHERE ctyua19nm = $1) c
            JOIN 
                (SELECT * FROM test_results WHERE purchase_intent = $2) t
            ON ST_WITHIN(t.geom, c.st_areashape)
            ) a GROUP BY a.analysis_any
        ), 
        substance_counts AS (
            SELECT c.ctyua19nm, COUNT(*) substance_count FROM
                (SELECT * FROM counties WHERE ctyua19nm = $1) c
            JOIN 
                (SELECT * FROM test_results WHERE purchase_intent = $2) t
            ON ST_WITHIN(t.geom, c.st_areashape)
            GROUP BY c.ctyua19nm
        )
        SELECT s.*, s.count::decimal / sc.substance_count::decimal percentage FROM substances s, substance_counts sc`;

    try {
        const qres = await client.query(QUERY, [req.params.name, req.params.drug]);
        res.json({rows: qres.rows.sort((x, y) => y.count - x.count), count, percentWithAdulterants});
    } catch (e) {
        console.log(e);
    } finally {
        // Make sure to release the client before any error handling,
        // just in case the error handling itself throws an error.
        client.release()
    }
}); 

app.get('/ukdrugmap/counties/:name', async (req, res) => {
    const client = await pool.connect();

    const { count, percentWithAdulterants } = await getAdulterantStats(
        `SELECT COUNT(*) count FROM 
                (SELECT * FROM test_results WHERE cardinality(analysis_any) != 1 OR purchase_intent != ANY(analysis_any)) t
            JOIN
                (SELECT * FROM counties WHERE ctyua19nm = $1) c
            ON ST_WITHIN(t.geom, c.st_areashape)`,
        `SELECT COUNT(*) count FROM test_results t
            JOIN
                (SELECT * FROM counties WHERE ctyua19nm = $1) c
            ON ST_WITHIN(t.geom, c.st_areashape)`,
        [req.params.name], 
        client,
    );

    const QUERY = `WITH substances AS (
            SELECT a.analysis_any substance, COUNT(*) count FROM (
            SELECT
            unnest(t.analysis_any) analysis_any
            FROM 
                (SELECT * FROM counties WHERE ctyua19nm = $1) c
            JOIN 
                test_results t
            ON ST_WITHIN(t.geom, c.st_areashape)
            ) a GROUP BY a.analysis_any
        ), 
        substance_counts AS (
            SELECT c.ctyua19nm, COUNT(*) substance_count FROM
                (SELECT * FROM counties WHERE ctyua19nm = $1) c
            JOIN 
                test_results t
            ON ST_WITHIN(t.geom, c.st_areashape)
            GROUP BY c.ctyua19nm
        )
        SELECT s.*, s.count::decimal / sc.substance_count::decimal percentage FROM substances s, substance_counts sc`;

    try {
        const qres = await client.query(QUERY, [req.params.name]);
        res.json({rows: qres.rows.sort((x, y) => y.count - x.count), count, percentWithAdulterants});
    } catch (e) {
        console.log(e);
    } finally {
        // Make sure to release the client before any error handling,
        // just in case the error handling itself throws an error.
        client.release()
    }
}); 

app.get('/ukdrugmap/counties', async (req, res) => {
    const client = await pool.connect();

    const { count, percentWithAdulterants } = await getAdulterantStats(
        "SELECT COUNT(*) count FROM test_results WHERE cardinality(analysis_any) != 1 OR purchase_intent != ANY(analysis_any)",
        "SELECT COUNT(*) count FROM test_results",
        [], 
        client,
    );

    const QUERY = `WITH substances AS (
            SELECT a.analysis_any substance, COUNT(*) count FROM (
            SELECT
            unnest(t.analysis_any) analysis_any
            FROM test_results t) a
            GROUP BY a.analysis_any
        ), 
        substance_counts AS (
            SELECT COUNT(*) substance_count FROM test_results
        )
        SELECT s.*, s.count::decimal / sc.substance_count::decimal percentage FROM substances s, substance_counts sc`;

    try {
        const qres = await client.query(QUERY);
        res.json({rows: qres.rows.sort((x, y) => y.count - x.count), percentWithAdulterants, count});
    } catch (e) {
        console.log(e);
    } finally {
        // Make sure to release the client before any error handling,
        // just in case the error handling itself throws an error.
        client.release()
    }
}); 

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});