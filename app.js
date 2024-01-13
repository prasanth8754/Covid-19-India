const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()
const dbPath = path.join(__dirname, 'covid19India.db')
app.use(express.json())

// initializing database...
let db = null
const initializeDBAndConnectDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (err) {
    console.log(`DB Error: ${err.message}`)
    process.exit(1)
  }
}
initializeDBAndConnectDatabase()

// Returns a list of all states in the state table
function convertDBToResponseObject1(dbObj) {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  }
}

app.get('/states/', async (request, response) => {
  const getAllStatesQuery = `
  SELECT 
  *
  FROM 
  state;`
  const statesList = await db.all(getAllStatesQuery)
  response.send(
    statesList.map(eachItem => convertDBToResponseObject1(eachItem)),
  )
})

//Returns a state based on the state ID

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getSingleStateQuery = `
  SELECT 
  *
  FROM state
  WHERE state_id = ${stateId}
  ;`
  const state = await db.get(getSingleStateQuery)
  response.send(
    [state].map(eachItem => convertDBToResponseObject1(eachItem))[0],
  )
})

//Create a district in the district table, `district_id` is auto-incremented

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body

  const addDistrictQuery = `
  INSERT INTO 
  district (district_name,state_id,cases,cured,active,deaths)
  VALUES(
    "${districtName}",
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths}
  );`

  await db.run(addDistrictQuery)
  response.send('District Successfully Added')
})

//Returns a district based on the district ID
function convertDistrictDbToResponseObj(dbObj) {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  }
}

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getSingleDistrictQuery = `
  SELECT 
  *
  FROM 
  district
  WHERE district_id = ${districtId}
  ;`

  const district = await db.get(getSingleDistrictQuery)
  response.send(
    [district].map(eachItem => convertDistrictDbToResponseObj(eachItem))[0],
  )
})

//Deletes a district from the district table based on the district ID

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
  DELETE FROM
  district
  WHERE district_id = ${districtId}
  ;`
  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

//Updates the details of a specific district based on the district ID

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateDistrictQuery = `
  UPDATE district
  SET 
  district_name = "${districtName}",
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  WHERE district_id = ${districtId};`

  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params

  const getStatisticsQuery = `
  SELECT 
  SUM(cases) as totalCases,
  SUM(cured) as totalCured,
  SUM(active) as totalActive,
  SUM(deaths)  as totalDeaths
  FROM district
  WHERE state_id = ${stateId}
  ;`

  const statistic = await db.get(getStatisticsQuery)
  response.send(statistic)
})

//Returns an object containing the state name of a district based on the district ID
function convertDbToResponseObj(dbObj) {
  return {
    stateName: dbObj.state_name,
  }
}

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateNameQuery = `
  SELECT state_name 
  FROM state 
  INNER JOIN 
  district
  ON state.state_id = district.state_id
  WHERE district_id = ${districtId}
  ;`
  const state = await db.get(getStateNameQuery)
  response.send([state].map(eachItem => convertDbToResponseObj(eachItem))[0])
})

module.exports = app
