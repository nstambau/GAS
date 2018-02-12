// Typical webwork installation has login screen at:
//   https://[host]/webwork2/[course]

var course = '[course]' // put course here
var host = '[host]'  // put host here
// The target spreadsheet needs to be populated with student data ahead of time. 
// This script will populate homework assignements automatically.
var targetSS = ""   // google id for target spreadsheet (in url)
var targetsheet = ""  // name of target sheet
var colWid = 4 // The column in the sheet with their ID number

function Ww_login(force){ //

// For security, your username and password should be stored in the script properties. To 
// do this, update the rows at the bottom of this file, and run "runonce" once. Then, 
// remove your username and password (don't re-run!), so that they are not visiable in 
// the text of this script.
  
  var cache = CacheService.getScriptCache()
  var login = JSON.parse(cache.get("loginWw"))
  if(force){login = ""}
  
  if(login){
    Logger.log("Login credentials found in Cache")
    return login
  }
  
  var prop = PropertiesService.getScriptProperties()
  var password = prop.getProperty("password")   ///   '+password+'
  var username = prop.getProperty("username")   ///   '+username+'
  
  
  
  var payload = 'submit=Log+In+Again&user='+username+'&passwd='+password
  
  var headers = {
    "Referer": "https://"+host+"/webwork2/"+course+"/",
    "Cookie": ""
  }
  
  
  var options = {
    "Host": host,
    "method": "POST",
    "headers": headers,
    "payload":  payload,
    "followRedirects": false
  }
  var response = UrlFetchApp.fetch("https://"+host+"/webwork2/"+course+"/",options)
  
  var temp = response.getAllHeaders().toSource()
  var name = " 'Set-Cookie':\""
  var temp1 = temp.split(name).pop()
  var temp2 = temp1.split(";").shift().split("%")
  temp2.pop()
  var login = temp2.join("%") 
  Logger.log("Updated Login")
  
  cache.put("loginWw",JSON.stringify(login))
  
  return login
  
  
}


function updateGradesWw(){
  var cache = CacheService.getScriptCache()
  
  var csvString = cache.get("Ww_csvString")
  
  if(!csvString){ // No data stored in cache? Let's get some fresh data!
    var prop = PropertiesService.getScriptProperties()
    var username = prop.getProperty("username")   ///   '+username+'
    
    var login = Ww_login()
    
    var keys = login.split("%")
    var key = keys[1].slice(2)
    
    // First, we refresh the csv file online
    
    var headers = {
      "Connection": "keep-alive",
      "Cookie": login
    }
    
    var payload = "" // Pulls same report as if you go to the "Grading Tools" page in WebWork. 
    
    
    var options = {
      "Host": host,
      "method": "POST",
      "headers": headers,
      "payload": payload,
      "followRedirects": false
    }
    
    var response = UrlFetchApp.fetch("https://"+host+"/webwork2/"+course+"/instructor/scoring/",options)
    
    
    var text = response.getContentText()
    var temp1 = text.split('.csv') // name of the csvfile
    if(temp1.length<2){
      Ww_login(true)
      throw("Login Refreshed - Please try again")
    }
    var filename = temp1[0].split('"').pop()+".csv"  
    
    // Second, grab the updated csv file!
    
    var options = {
      "Host": "webwork.wit.edu",
      "method": "GET",
      "headers": headers,
      "followRedirects": false
    }
    
    var response = UrlFetchApp.fetch("https://"+host+"/webwork2/"+course+"/instructor/scoringDownload/?getFile="+filename+"&key="+key+"&effectiveUser="+username+"&user="+username,options)
    
    
    var csvString = response.getContentText()
    cache.put("Ww_csvString",csvString)
    
  }
  
  // Time to process the csv file. Depending on your settings, this may need to be changed. 
  var data = Utilities.parseCsv(csvString);
  // First, time the entries
  for (var ii = 0; ii<data.length;ii++){
    for (var jj = 0; jj<data[ii].length; jj++) {
      data[ii][jj] = data[ii][jj].trim()
    }
  }
  
  // clean up header rows
  data.shift()
  var headers = data.shift()
  data.shift()
  data.shift()
  data.shift()
  var values = data.shift()
  data.shift()
  var students = {}

  // Run through students, which are filtered by haveing userID's starting with W (a pattern at this institution)
  
  for (var ii = 0; ii<data.length; ii++){
    var student = data[ii]
    var id = student[0]
    if(id.charAt(0)!="W"){continue}
    students[id]={
      "username": student[1],
      "first": student[2],
      "last": student[3],
      "section": student[4],
      "grades": {}
    }
    for (var jj=6; jj<headers.length-2; jj++){
      students[id]["grades"][headers[jj]] = student[jj]/values[jj]
    }
  }
  
  var SS = SpreadsheetApp.openById("1o-KvoqXjVcUryzAw0ok_ikBu5Zt2Md2mxz4wAFVZZmU")
  var sheet = SS.getSheetByName("1850")
  var sheetData = sheet.getDataRange().getValues()
  
  for (var jj=6; jj<headers.length-2; jj++){
    var set = headers[jj]
    var col = sheetData[0].indexOf(set)+1
    if(col<0) { // Assignment not found. 
      return
      var col = sheet.getLastColumn()+1
      sheet.insertColumnAfter(col-1)
    }
    var newCol = [[set]]
    var checkCounter = 0 // If all grades are zero, we will record them as null.
    for (var row = 1; row<sheetData.length; row++){
      var studentID = sheetData[row][colWid-1]
      if(!(studentID in students)){
        if(studentID) {
          newCol.push([0])
        } else {
          newCol.push([""])
        }
        
        continue
      }

      var grade = students[studentID]["grades"][set]
      checkCounter += grade
      newCol.push([grade])
      students[id]["grades"][headers[jj]] = student[jj]/values[jj]
    }


    if(checkCounter>0){
      sheet.getRange(1, col, newCol.length).setValues(newCol).setNumberFormat("##0%")
    } else {
      sheet.getRange(1, col, newCol.length).clear()
      sheet.getRange(1,col).setValue(set)
    }
    
  }
}

function runOnce() {
  
  
  var prop = PropertiesService.getScriptProperties()
  
  var password = "****"
  var username = "****"   // For example:  stambaughn
  
  prop.setProperty("password", password)
  prop.setProperty("username", username)
}
