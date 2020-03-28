var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var fs = require('fs');
var queries = require('./cypher')

app.use(bodyParser.json())

var neo4j = require('neo4j-driver')

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

app.post("/async", async (req, res) => {
    var x = req.body;
    var driver = neo4j.driver('bolt://localhost',
        neo4j.auth.basic('neo4j', 'daft')
    );
    var session = driver.session();
    const txc = session.beginTransaction()

    const exec = async (cypher, params, message) => {
        await txc.run(cypher, params);
        console.log(message);
    }


    const propertyId = x.property.link.split('/')[3];
    //fs.writeFile(`test/${propertyId}.json`, JSON.stringify(x), 'utf8', (event) => { });
    try {
        queries.createTenant(x.tenant.email, x.tenant.phone, exec);
        queries.createProperty(propertyId, x.property, exec);
        queries.createInterestRelation(x.tenant.email, propertyId, exec);
        queries.createBathroom(propertyId, x.property.bathrooms, exec);
        queries.createBedroom(propertyId, x.property.bedrooms, exec);
        for (f in x.property.facilities) {
            queries.createFacility(propertyId, x.property.facilities[f], exec)
        }
        queries.createPropertyType(propertyId, x.property.type, exec);
        queries.createLocation(propertyId, x.property.location, exec);

        if (x.agent) {
            queries.createAgent(propertyId, x.agent.name, x.agent.licence, exec);
        }

        if(x.property.ber) {
            queries.createBER(propertyId, x.property.ber, exec);
        }

        await txc.commit()
        console.log('committed')
        //https://www.auctioneera.ie/what-is-a-ber

    } catch (error) {
        console.log(error)
        await txc.rollback()
        console.log('rolled back')
    } finally {
        await session.close()
    }

    res.end("done");
});