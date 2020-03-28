var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var fs = require('fs');


app.use(bodyParser.json())

var neo4j = require('neo4j-driver')

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

app.post("/async", async (req, res) => {
    var x = req.body;
    var driver = neo4j.driver('bolt://localhost',
        neo4j.auth.basic('neo4j', '')
    );

    var session = driver.session();
    const propertyId = x.property.link.split('/')[3];
    fs.writeFile(`test/${propertyId}.json`, JSON.stringify(x), 'utf8', (event) => console.log(event));
    const txc = session.beginTransaction()
    try {
        let cypher1 = 'MERGE (t:Tenant { email: $tenantEmail }) ON CREATE SET t.created = timestamp(), t.phone = $tenantPhone ON MATCH SET t.lastInterest = timestamp() RETURN t.email AS tenantEmail';
        let params1 = {
            tenantEmail: x.tenant.email,
            tenantPhone: x.tenant.phone
        };

        const result1 = await txc.run(cypher1, params1)
        result1.records.forEach(r => console.log(r.get('tenantEmail')))
        console.log('match tenant')

        let cypher2 = 'MERGE (p:Property {id: $id}) '
        cypher2 = cypher2.concat('ON CREATE SET p.link = $propertyLink,');
        cypher2 = cypher2.concat('p.bedrooms = $propertyBedrooms, p.bathrooms = $propertyBathrooms,');
        cypher2 = cypher2.concat('p.address = $propertyAddress, p.price = $propertyRentPrice,');
        cypher2 = cypher2.concat('p.floatPrice = $propertyRentFloatPrice,');
        cypher2 = cypher2.concat('p.type = $propertyType,');
        cypher2 = cypher2.concat('p.ber = $propertyBER,');
        cypher2 = cypher2.concat(' p.location = $propertyLocation,');
        cypher2 = cypher2.concat(' p.created = timestamp() ');
        cypher2 = cypher2.concat(' ON MATCH SET p.lastInterest = timestamp(), ');
        cypher2 = cypher2.concat(' p.address = $propertyAddress, p.price = $propertyRentPrice,');
        cypher2 = cypher2.concat(' p.ber = $propertyBER,');
        cypher2 = cypher2.concat(' p.location = $propertyLocation,');
        cypher2 = cypher2.concat('p.floatPrice = $propertyRentFloatPrice');

        let params2 = {
            propertyLink: x.property.link,
            propertyType: x.property.type,
            propertyBedrooms: x.property.bedrooms,
            propertyBathrooms: x.property.bathrooms,
            id: propertyId,
            propertyAddress: x.property.address,
            propertyRentPrice: x.property.rentPrice,
            propertyRentFloatPrice: x.property.rentFloatPrice,
            propertyBER: x.property.ber,
            propertyLocation: x.property.location,
        }
        await txc.run(cypher2, params2);

        let cypher3 = "MATCH (p:Property {id: $propertyId}), (t:Tenant { email: $tenantEmail }) MERGE (t)-[r:INTERESTED]->(p) ON CREATE SET r.count = 1 ON MATCH set r.count = r.count + 1";
        let params3 = {
            tenantEmail: x.tenant.email,
            propertyId: propertyId
        };

        await txc.run(cypher3, params3);
        console.log('create property interest relation')

        let cypher4 = "MATCH (p:Property { id: $propertyId }) MERGE (b:Bathroom {total: $totalBathrooms, title: $title}) MERGE (p)-[r:HAS_BATHROOM]->(b)";
        let params4 = {
            totalBathrooms: x.property.bathrooms,
            title: `${x.property.bathrooms} bathroom(s)`,
            propertyId: propertyId
        };

        await txc.run(cypher4, params4);
        console.log('create bathroom relation')

        let cypher5 = "MATCH (p:Property { id: $propertyId }) MERGE (b:Bedroom {total: $totalBedrooms, title: $title})  MERGE (p)-[r:HAS_BEDROOM]->(b)";
        let params5 = {
            totalBedrooms: x.property.bedrooms,
            title: `${x.property.bedrooms} bedroom(s)`,
            propertyId: propertyId
        };

        await txc.run(cypher5, params5);
        console.log('create bedroom relation')

        for (f in x.property.facilities) {
            let cypherX = "MATCH (p:Property { id: $propertyId }) MERGE (f:Facility {name: $facility}) MERGE (p)-[r:HAS_FACILITY]->(f)";
            let paramsX = {
                facility: x.property.facilities[f],
                propertyId: propertyId
            };
            await txc.run(cypherX, paramsX);
        }
        console.log('create facilities')

        let cypher6 = "MATCH (p:Property { id: $propertyId }) MERGE (t:Type { name: $propertyType }) MERGE (p)-[r:HAS_TYPE]->(t)";
        let params6 = {
            propertyType: x.property.type,
            propertyId: propertyId
        };
        await txc.run(cypher6, params6);
        console.log('create property type relation')


        let cypher7 = "MATCH (p:Property { id: $propertyId }) MERGE (l:Location { name: $locationName})  MERGE (p)-[r:LOCATED]->(l)";
        let params7 = {
            locationName: x.property.location,
            propertyId: propertyId
        };

        await txc.run(cypher7, params7);
        console.log('create location relation');

        if (x.agent) {
            let cypher8 = "MATCH (p:Property { id: $propertyId }) MERGE (a:Agent { name: $agentName, licence: $agentLicence})  MERGE (p)-[r:MANAGED_BY]->(a)";
            let params8 = {
                agentName: x.agent.name,
                agentLicence: x.agent.licence,
                propertyId: propertyId
            };
    
            await txc.run(cypher8, params8);
            console.log('create agent relation');
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