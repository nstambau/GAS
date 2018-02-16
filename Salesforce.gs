var host = "srm.my.salesforce.com" // Change to your host, as needed.

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
  
  
  // now we send that soql query to mentorforce
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
  
  
  // now we send that soql query to mentorforce
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
  
  var sessionID = loginMF_()
  
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