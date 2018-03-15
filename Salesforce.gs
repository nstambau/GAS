// This script stores salesforce credentials in "Properties" and then executes SOQL or SOSL queries. 
// Query results are stored in cache, and login token is stored in cache as well. 
// To use: Complete data in the "initialize" routine, and complete the "host" data as well. 
// Run once, and then remove your sensitive information. Then use getSOQL or getSOSL to send
// a query/search to salesforce, and the data is returned as a 2D array with headers.

var host = "***.**.salesforce.com" // Change to your host, as needed.

function initialize(){
  
  // Loads your credientials into the Library. Only run when credentials change.
  
  var uProps = {
//    'userEmail': '******@***.***',
//    'MFpassword':"******", // 
//    'MFsecToken':"******"  // 
  };

  var prop = PropertiesService.getScriptProperties()
  prop.setProperty("Info", JSON.stringify(uProps));
  
// Run this Function to load your values into the user properties. 

}


/**
* Returns the results of a given SOQL query
*
* @param {string} sosl A valid SOQL query for Salesforce
* @return {array} The results of the query as a 2D array with headers
*/
function getSOQL(soql){
  
  // now we extract the names of the fields you requested, and populate headers for use later
  
  
  var cache = CacheService.getScriptCache()
  var out = Wunzip(cache.get(shortKeyHash_("soql:"+soql)))
  //out=""
  
  if(out){ return out  }
  //  Logger.log(soql)
  try{
    var fieldsTemp = soql.split(/FROM/ig).shift()
    fieldsTemp = fieldsTemp.split(/SELECT/ig).pop()
    fieldsTemp = fieldsTemp.split(",")
    
    var fields = []
    var headers = []
    
    for (var ii = 0; ii<fieldsTemp.length; ii++){
      var wholeField = fieldsTemp[ii].trim()
      fields.push(wholeField)
      headers.push(wholeField.split(".").pop())
    }
  }
  catch (err){
    Logger.log(err)
    return err +  "Could not parse SOQL query to determine headers. Make sure it's working on the workbench! (http://workbench.developerforce.com/)"
  }
  
  
  // Check to see if there are Aggregate Functions, and change headers accordingly
  //  Logger.log(fields)
  var fieldCounter = 0
  for (var ii =0; ii<fields.length; ii++){
    var field = fields[ii]
    field = field.split("(")
    if (field[1]) {
      fields[ii] = "expr"+fieldCounter
      fieldCounter++
    }
  }
  if(fieldCounter>0){
    for (var ii =0; ii<fields.length; ii++){
      var field = fields[ii]
      field = field.split(".").pop()
      fields[ii] = field
    }
  }
  //  Logger.log(fields)
  
  
  // now we send that soql query to salesforce
  try{
    var results = fetch_("https://"+host+"/services/data/v39.0/query?q=" + encodeURIComponent(soql));
    if (results === null || results === undefined) { return "Query was not successful. Make sure it's working on the workbench! (http://workbench.developerforce.com/)" }
    
    var object = JSON.parse(results); // the object returned is a JSON file of a keyed array; so next we parse it
    var records = object.records // collect the records from the array
    
    if (records.length == 0) { return "Query returned 0 results. Make sure it's working on the workbench! (http://workbench.developerforce.com/)" }
    //    Logger.log(records)
    var out = [headers]  // Initiate the keyed array we'll use to collect the resutls
    
    for (var ii = 0; ii< records.length; ii++){
      var row = []
      for (var jj = 0; jj<fields.length; jj++){
        var field = fields[jj].split('.')
        var final = records[ii]
        for(var kk = 0; kk<field.length; kk++){
          if (!final) continue
          if(field[kk] in final) {
            final = final[field[kk]]
          }
          else {
            final = ""
          }
        }
        row.push(final)
      }
      out.push(row)
    }
    
    
    // this is where we look for additional batches of records (2000+)
    var nextRecord = object.nextRecordsUrl;
    while (nextRecord){
      var results = fetch_("https://" + host + nextRecord);
      if (results === null || results === undefined) { return -1 } // this shouldn't happen, so we throw an error.
      var object = JSON.parse(results);
      var records = object.records // collect the records from the array
      var nextRecord = object.nextRecordsUrl;
      
      for (var ii = 0; ii< records.length; ii++){
        var row = []
        for (var jj = 0; jj<fields.length; jj++){
          var field = fields[jj].split('.')
          var final = records[ii]
          for(var kk = 0; kk<field.length; kk++){
            if (!final) continue
            if(field[kk] in final) {
              final = final[field[kk]]
            }
            else {
              final = ""
            }
          }
          row.push(final)
        }
        out.push(row)
      }
      
    }
    try{
      cache.put(shortKeyHash_("soql"+soql),Wzip(out))
    } catch (err){}
    //    Logger.log(out)
    return out
  }
  catch (err){
    Logger.log(err)
    Logger.log(soql)
    throw("An error occured. Check that your soql query is correct, and make sure it's working on the workbench! (http://workbench.developerforce.com/) "+ err)
  }
  
  
  
}


/**
* Returns the results of a given SOSL query
*
* @param {string} sosl A valid SOSL query for Salesforce
* @return {array} The results of the query as a 2D array with headers
*/
function getSOSL(sosl){

  // now we extract the names of the fields you requested, and populate headers for use later
  //Logger.log(sosl)
  
  var cache = CacheService.getScriptCache()
  
  var out = Wunzip(cache.get(shortKeyHash_("sosl:"+sosl)))
  //  out = ""
  if(out){ return out  }
  
  try{
    var fieldsTemp = sosl.split(/[\(\)]/g)[1]
    fieldsTemp = fieldsTemp.split(/ORDER/ig)[0]
    fieldsTemp = fieldsTemp.split(/GROUP/ig)[0]
    fieldsTemp = fieldsTemp.split(/WHERE/ig)[0]
    fieldsTemp = fieldsTemp.split(",")
    //    Logger.log(fieldsTemp)
    var fields = []
    var headers = []
    
    for (var ii = 0; ii<fieldsTemp.length; ii++){
      var wholeField = fieldsTemp[ii].trim()
      fields.push(wholeField)
      headers.push(wholeField.split(".").pop())
    }
  }
  catch (err){
    Logger.log(err)
    return err +  "Could not parse SOSL query to determine headers. Make sure it's working on the workbench! (http://workbench.developerforce.com/)"
  }
  
  // Logger.log(fields)
  
  
  // now we send that soql query to salesforce
  
  try{
    var results = fetch_("https://"+host+"/services/data/v39.0/search?q=" + encodeURIComponent(sosl));
    //    Logger.log(results)
    if (results === null || results === undefined) { return "Query was not successful. Make sure it's working on the workbench! (http://workbench.developerforce.com/)" }
    
    var records = JSON.parse(results); // the object returned is a JSON file of a keyed array; so next we parse it
    if (records.length == 0) { return "Query returned 0 results. Make sure it's working on the workbench! (http://workbench.developerforce.com/)" }
    
    var out = [headers]  // Initiate the keyed array we'll use to collect the resutls
    records = records.searchRecords
    //    Logger.log(records)
    
    for (var ii = 0; ii< records.length; ii++){
      var row = []
      for (var jj = 0; jj<fields.length; jj++){
        var field = fields[jj].split('.')
        var final = records[ii]
        for(var kk = 0; kk<field.length; kk++){
          if (!final) continue
          if(field[kk] in final) {
            final = final[field[kk]]
          }
          else {
            final = ""
          }
        }
        row.push(final)
      }
      out.push(row)
    }
    
    cache.put(shortKeyHash_("sosl"+sosl),Wzip(out))
    //  Logger.log(out)
    return out
  }
  catch (err){
    Logger.log(err)
    return err +  " An error occured. Check that your sosl query is correct, and make sure it's working on the workbench! (http://workbench.developerforce.com/)"}
  
}


function fetch_(url){
  
//  var user = Session.getActiveUser().getEmail()
  
  var sessionID = loginSF_()
  
  var httpheaders = {Authorization: "OAuth " + sessionID};
  var parameters = {headers: httpheaders, "muteHttpExceptions": true}; 
  
  var results = UrlFetchApp.fetch(url, parameters).getContentText();
  if(results.indexOf("INVALID_SESSION_ID")>0){
  var effectiveUser = Session.getEffectiveUser().getEmail()
    var activeUser = Session.getActiveUser().getEmail()
    CacheService.getScriptCache().put("sessionIdnate.stambaugh@wgu.edu","")
    CacheService.getScriptCache().put("sessionId"+effectiveUser,"")
    SpreadsheetApp.openById('1PuVjMabwjhLILVijL1itrQ6O_Dd4uEVwu7Tc9gaO_gY').getActiveSheet().appendRow([new Date(), effectiveUser, activeUser, "Failed fetch. Clearing Cache"])
    throw "Stale Login. Rerun Script"
  }
  return results
}


/**
* Compresses a string or object [uses JSON]
*
* @param {string} A string (or Object)
* @return {string} A compressed string representation
*/
function Wzip(string){
  
  if(typeof string == "string"){
//    Logger.log("It's already a string!")
  }
  else {
//    Logger.log("Made it a string!")
    string = JSON.stringify(string)
  }
  
  var blob = Utilities.newBlob(string)
  var zip = Utilities.zip([blob])
  var compress = Utilities.base64Encode(zip.getBytes())
  
//  Logger.log("Input Length: " + string.length)
//  Logger.log("Output Length: " + compress.length)
  
  return compress
  
}

/**
* Decompresses a string or object [uses JSON]
*
* @param {string} A compressed string
* @return {string} The decompressed string (or Object)
*/
function Wunzip(compress){
  
  if(!compress){return ""}
  
  var zip = Utilities.newBlob(Utilities.base64Decode(compress),"application/zip")
  var blob = Utilities.unzip(zip)
  var string = blob[0].getDataAsString()
  
  try {
    string = JSON.parse(string)
  }
  catch (err) { }
  
//  Logger.log(typeof string)
  
  return string
  
}

function shortKeyHash_(input) {
    return Utilities.base64Encode( Utilities.computeDigest( Utilities.DigestAlgorithm.SHA_1, input));
}


function loginSF_(){

 
  var scriptCache = CacheService.getScriptCache()
  var sessionId = scriptCache.get("sessionId")
  
  if(sessionId){
    scriptCache.put("sessionId", sessionId, 30*60); // recache for 30 minutes. 
  return sessionId
  }
  
  var prop = PropertiesService.getScriptProperties()
  var uProps = JSON.parse(prop.getProperty("Info"));
  
  try{
  var userEmail = uProps.userEmail
  var MFpassword = uProps.MFpassword
  var MFsecToken = uProps.MFsecToken
} catch (err){
  throw "Login info wasn't found in properties. Did you run the Initialize function?"
  }
  
  var message="<?xml version='1.0' encoding='utf-8'?>" 
  +"<soap:Envelope xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/' " 
  +   "xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://"
  +   "www.w3.org/2001/XMLSchema'>" 
  +  "<soap:Body>" 
  +     "<login xmlns='urn:partner.soap.sforce.com'>" 
  +        "<username>" + userEmail + "</username>"
  +        "<password>"+ MFpassword + MFsecToken + "</password>"
  +     "</login>" 
  +  "</soap:Body>" 
  + "</soap:Envelope>";
  
  
  var httpheaders = { SOAPAction: "login" };
  var parameters = {method: "POST", contentType: "text/xml", headers: httpheaders, payload: message, muteHttpExceptions: true};
  var result = UrlFetchApp.fetch("https://login.salesforce.com/services/Soap/u/39.0", parameters).getContentText();
  
  if(result.indexOf("Fault")>0){
    var err = XmlService.parse(result)
    err = XMLtoAssocArray(err)
    Logger.log(err)
    Logger.log("Login did not work. Aborting.")
    throw(err + "\n Login did not work. Aborting.")
  }

  var id = result.split("sessionId")
  var sessionId = id[1].slice(1,-2)
  
  Logger.log("Cached MF Login")
  
  scriptCache.put("sessionId", sessionId, 60*60);    // Puts session ID into cache for 1 hour

  return sessionId
  
}
