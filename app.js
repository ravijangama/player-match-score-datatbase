const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log(`Server Is Starting @3000`));
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertDBToPlayersList = (playerObj) => {
  return {
    playerId: playerObj.player_id,
    playerName: playerObj.player_name,
  };
};
const convertDBToMatchesList = (matchObj) => {
  return {
    matchId: matchObj.match_id,
    match: matchObj.match,
    year: matchObj.year,
  };
};
//Get Players List API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT 
        *
    FROM
       player_details;`;
  const playersList = await db.all(getPlayersQuery);
  response.send(
    playersList.map((eachPlayer) => convertDBToPlayersList(eachPlayer))
  );
});
//Get Specific Player API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
        *
    FROM
       player_details
    WHERE
       player_id=${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertDBToPlayersList(player));
});
//Update Player Name API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
      UPDATE 
          player_details
      SET
         player_name="${playerName}"
      WHERE
         player_id=${playerId};`;
  const players = await db.run(updateQuery);
  const playersId = players.lastID;
  response.send("Player Details Updated");
  //console.log({ playersId: playersId });
});
//Get Specific Match API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
        *
    FROM
       match_details
    WHERE
       match_id=${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(convertDBToMatchesList(match));
});
//Get All Matches Of Player API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchQuery = `
       SELECT 
          *
       FROM 
         match_details
       WHERE 
          match_id IN (
              SELECT 
                 match_id
              FROM
                 player_match_score
              WHERE 
                 player_id=${playerId}
          );`;
  const matchesList = await db.all(playerMatchQuery);
  response.send(
    matchesList.map((eachMatch) => convertDBToMatchesList(eachMatch))
  );
});
//Get Players Of Match API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerMatchQuery = `
       SELECT 
          player_id,
          player_name
       FROM 
         player_details NATURAL JOIN player_match_score
       WHERE 
          match_id=${matchId};`;
  const playersList = await db.all(playerMatchQuery);
  response.send(
    playersList.map((eachPlayer) => convertDBToPlayersList(eachPlayer))
  );
});
//Get Stats Of Player API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerStatsQuery = `
       SELECT 
           player_details.player_id AS playerId,
           player_details.player_name AS playerName,
           SUM(player_match_score.score) AS totalScore,
           SUM(player_match_score.fours) AS totalFours,
           SUM(player_match_score.sixes) AS totalSixes
       FROM 
          player_details JOIN player_match_score 
          ON player_details.player_id=player_match_score.player_id
        WHERE
           player_match_score.player_id=${playerId}`;
  const playerStats = await db.get(playerStatsQuery);
  response.send(playerStats);
});
module.exports = app;
