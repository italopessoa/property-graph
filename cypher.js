function createTenant(email, phone, execCallback) {
    const cypher = 'MERGE (t:Tenant { email: $tenantEmail }) ON CREATE SET t.created = timestamp(), t.phone = $tenantPhone ON MATCH SET t.lastInterest = timestamp() RETURN t.email AS tenantEmail';
    execCallback(
        cypher, {
        tenantEmail: email,
        tenantPhone: phone
    }, 'create tenant');
}

function createProperty(propertyId, property, execCallback) {
    const cypher = 'MERGE (p:Property {id: $id}) '
        .concat('ON CREATE SET p.link = $propertyLink,')
        .concat('p.bedrooms = $propertyBedrooms, p.bathrooms = $propertyBathrooms,')
        .concat('p.address = $propertyAddress, p.price = $propertyRentPrice,')
        .concat('p.floatPrice = $propertyRentFloatPrice,')
        .concat('p.type = $propertyType,')
        .concat('p.ber = $propertyBER,')
        .concat(' p.location = $propertyLocation,')
        .concat(' p.created = timestamp() ')
        .concat(' ON MATCH SET p.lastInterest = timestamp(), ')
        .concat(' p.address = $propertyAddress, p.price = $propertyRentPrice,')
        .concat(' p.ber = $propertyBER,')
        .concat(' p.location = $propertyLocation,')
        .concat('p.floatPrice = $propertyRentFloatPrice');

    execCallback(
        cypher, {
        propertyLink: property.link,
        propertyType: property.type,
        propertyBedrooms: property.bedrooms,
        propertyBathrooms: property.bathrooms,
        id: propertyId,
        propertyAddress: property.address,
        propertyRentPrice: property.rentPrice,
        propertyRentFloatPrice: property.rentFloatPrice,
        propertyBER: property.ber,
        propertyLocation: property.location,
    }, 'create property');
}

function createInterestRelation(tenantEmail, propertyId, execCallback) {
    const cypher = "MATCH (p:Property {id: $propertyId}), (t:Tenant { email: $tenantEmail }) MERGE (t)-[r:INTERESTED]->(p) ON CREATE SET r.count = 1 ON MATCH set r.count = r.count + 1";
    execCallback(cypher, { tenantEmail, propertyId }, 'create property interest relation');
}

function createBathroom(propertyId, totalBathrooms, execCallback) {
    const cypher = "MATCH (p:Property { id: $propertyId }) MERGE (b:Bathroom {total: $totalBathrooms, title: $title}) MERGE (p)-[r:HAS_BATHROOM]->(b)";
    execCallback(cypher, {
        totalBathrooms,
        title: `${totalBathrooms} bathroom(s)`,
        propertyId
    }, 'create bathroom relation');
}

function createBedroom(propertyId, totalBedrooms, execCallback) {
    const cypher = "MATCH (p:Property { id: $propertyId }) MERGE (b:Bedroom {total: $totalBedrooms, title: $title})  MERGE (p)-[r:HAS_BEDROOM]->(b)";
    execCallback(cypher, {
        totalBedrooms,
        title: `${totalBedrooms} bedroom(s)`,
        propertyId
    }, 'create bedroom relation');
}

function createFacility(propertyId, facility, execCallback) {
    const cypher = "MATCH (p:Property { id: $propertyId }) MERGE (f:Facility {name: $facility}) MERGE (p)-[r:HAS_FACILITY]->(f)";
    execCallback(cypher, {
        facility,
        propertyId
    }, `create ${facility} relation`);
}

function createPropertyType(propertyId, propertyType, execCallback) {
    const cypher = "MATCH (p:Property { id: $propertyId }) MERGE (t:Type { name: $propertyType }) MERGE (p)-[r:HAS_TYPE]->(t)";
    execCallback(cypher, {
        propertyType,
        propertyId
    }, 'create property type relation');

}

function createLocation(propertyId, locationName, execCallback) {
    const cypher = "MATCH (p:Property { id: $propertyId }) MERGE (l:Location { name: $locationName})  MERGE (p)-[r:LOCATED]->(l)";
    execCallback(cypher, {
        locationName,
        propertyId
    }, 'create location');
}

function createAgent(propertyId, agentName, agentLicence, execCallback) {
    const cypher = "MATCH (p:Property { id: $propertyId }) MERGE (a:Agent { name: $agentName, licence: $agentLicence})  MERGE (p)-[r:MANAGED_BY]->(a)";
    execCallback(cypher, {
        agentName,
        agentLicence,
        propertyId
    }, 'create agent');
}


function createBER(propertyId, ber, execCallback) {
    const cypher = "MATCH (p:Property { id: $propertyId }) MERGE (b:BER { label: $ber, rank: $rank}) MERGE (p)-[r:HAS_BER]->(b)";
    let rank = ['a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'c1', 'c2', 'c3', 'd1', 'd2', 'e1', 'e2', 'f', 'g'].indexOf(ber.toLowerCase()) + 1;
    execCallback(cypher, {
        rank: rank,
        ber: rank > 0 ? ber.toUpperCase() : 'EXEMPT',
        propertyId
    }, 'create ber rank');
}

module.exports.createTenant = createTenant;
module.exports.createProperty = createProperty;
module.exports.createInterestRelation = createInterestRelation;
module.exports.createBathroom = createBathroom;
module.exports.createBedroom = createBedroom;
module.exports.createFacility = createFacility;
module.exports.createPropertyType = createPropertyType;
module.exports.createLocation = createLocation;
module.exports.createAgent = createAgent;
module.exports.createBER = createBER;