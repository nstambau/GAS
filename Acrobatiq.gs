// Extracts Student Data from Acrobatiq using a Faculty login

// You'll need to update checkpoint codes on lines 183-195, 214-216, 239, 398, 399

var host = "???.acrobatiq.com" //  Update with your host site
var course = "classname" // Update with your instance of the class name

function loginAcro_() {
  
  var cache = CacheService.getScriptCache()
  var csrftoken = cache.get("PS_csrftoken")
  var sessionid = cache.get("PS_sessionid")
  var Cookie = cache.get("PS_Cookie")
  
  csrftoken = ""
  if (csrftoken && sessionid && Cookie) {return }
  
  
  // STEP 1
  // gets a csrftoken from opening a login page
  
  var options0 = {
    
    "method" : "GET",
    "Host": host
  }
  
  var response0 = UrlFetchApp.fetch("https://"+host+"/login" , options0);
  var headers0 = response0.getAllHeaders()
  var jvCookie = headers0["Set-Cookie"];
  var setCookie = headers0["Set-Cookie"].split(";")
  var temp = setCookie[0].split("=")
  var token0 = temp[1];
  
  // STEP 2
  // Uses that csrftoken, along with my Acrobatiq credentials to log in
  
  var username = "******"  // update with your email
  var password = "******" // update with your password
  
  var url = "https://"+host+"/login"
  
  var payload =  "csrfmiddlewaretoken="+token0+"&next=/coursemanage/mycourses/&username="+username+"&password="+password
  
  
  
  var headers = {
    "Referer": "https://"+host+"/login",
    "Cookie": jvCookie
  }
  
  
  
  var options =
      {
        "method" : "POST",
        "Host": host,
        "headers" : headers,
        "payload" : payload,
        "muteHttpExceptions" : true,
        "followRedirects": false
      };
  
  
  var login = UrlFetchApp.fetch("https://"+host+"/login" , options);
  var sessionDetails = login.getAllHeaders();
  
  var Cookie1 = sessionDetails["Set-Cookie"][0].split(";")
  var csrftoken = Cookie1[0].split("=")[1]
  
  var Cookie2 = sessionDetails["Set-Cookie"][1].split(";")
  var sessionid = Cookie2[0].split("=")[1]
  
  var Cookie = "csrftoken="+csrftoken+"; sessionid="+sessionid
  
  
  cache.put("PS_csrftoken",csrftoken,60*60) 
  cache.put("PS_sessionid",sessionid,60*60) 
  cache.put("PS_Cookie",Cookie,60*60) 
  
  Logger.log("Logged into Acrobatiq")
  
  return
}


/**
* Returns the internal ACROBATIQ student ID
*
* @param {string} email The students @***.edu email address
* @return {string} The student ID
*/
function ACRO_id(email) {
  
  email = email || 'jane.doe@abc.edu' // for testing
  
  var cache = CacheService.getScriptCache()
  var out = cache.get("acroID"+email)
  if(out){return JSON.parse(out)}
  
loginAcro_()
  var csrftoken = cache.get("PS_csrftoken")
  var Cookie = cache.get("PS_Cookie")
  
  var headers = {
    "Cookie": Cookie
    
  }
  var payload = "search[value]="+email+"&csrfmiddlewaretoken="+csrftoken+"&show_removed=True"
  
  var options = {
    "method": "POST",
    "Host": host,
    "payload" : payload,
    "headers": headers,
    "muteHttpExceptions" : true,
    "followRedirects": false
  }
  
  
  var page = UrlFetchApp.fetch("https://"+host+"/cia/mentordashboard/"+course+"/",options)
  var html = page.getContentText()
  
  cache.put(("acroID"+email), html, 60*60*4)
  var out = JSON.parse(html)
  Logger.log(out)
  return out
  
}

/**
* Returns the last login timestamp for student
*
* @param {string} email The students @wgu.edu email address
* @return {date} The date (timestamp) of the last login
*/
function getLastLogin(email){

  email = email || "jane.doe@abc.edu"
  var info = ACRO_id(email)
  try{
    var out = info.data[0].last_login
    } catch (err){
      var out = ""
      }
//  Logger.log(out)
  return out
  
}


/**
* Returns all the gradebook data for a student. Associative array has keys for each checkpoint, which point to an associative array with html of pop-over data, table of this data, and other related information.
*
* @param {string} email The students @wgu.edu email address
* @return {array} Associative array with all gradebook data
*/
function getGradebookData(email) {
  email = email || "jane.doe@abc.edu"
  
  
  loginAcro_()
  
  
  var cache = CacheService.getScriptCache()
  var csrf = cache.get("PS_csrftoken")
  var sessionid = cache.get("PS_sessionid")
  var Cookie = cache.get("PS_Cookie")
  
  
  var headers = { 
    "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:52.0) Gecko/20100101 Firefox/52.0",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://"+host+"/coursemanage/gradebook/"+course+"/",
    "Cookie": Cookie,
    "Connection": "keep-alive"
  }
  
  // add assessment codes here for each checkpoint. Searches by student email address using csrfmiddlewaretoken!! 
  var payload = 'draw=12&columns[0][data]=0&columns[0][name]=&columns[0][searchable]=true&columns[0][orderable]=true&columns[0][search][value]=&columns[0][search][regex]=false&columns[1][data]=1&columns[1][name]=&columns[1][searchable]=true&columns[1][orderable]=true&columns[1][search][value]=&columns[1][search][regex]=false&columns[2][data]=2&columns[2][name]=&columns[2][searchable]=true&columns[2][orderable]=true&columns[2][search][value]=&columns[2][search][regex]=false&columns[3][data]=3&columns[3][name]=&columns[3][searchable]=true&columns[3][orderable]=true&columns[3][search][value]=&'
  payload += 'columns[3][search][regex]=false&columns[4][data]=4&columns[4][name]=&columns[4][searchable]=true&columns[4][orderable]=true&columns[4][search][value]=&columns[4][search][regex]=false&columns[5][data]=5&columns[5][name]=&columns[5][searchable]=true&columns[5][orderable]=true&columns[5][search][value]=&columns[5][search][regex]=false&columns[6][data]=6&columns[6][name]=&columns[6][searchable]=true&columns[6][orderable]=true&columns[6][search][value]=&columns[6][search][regex]=false&columns[7][data]=7&columns[7][name]=&columns[7][searchable]=true&columns[7][orderable]=true'
  payload += '&columns[7][search][value]=&columns[7][search][regex]=false&columns[8][data]=8&columns[8][name]=&columns[8][searchable]=true&columns[8][orderable]=true&columns[8][search][value]=&columns[8][search][regex]=false&columns[9][data]=9&columns[9][name]=&columns[9][searchable]=true&columns[9][orderable]=true&columns[9][search][value]=&columns[9][search][regex]=false&columns[10][data]=10&columns[10][name]=&columns[10][searchable]=true&columns[10][orderable]=true&columns[10][search][value]=&columns[10][search][regex]=false&columns[11][data]=11&columns[11][name]=&columns[11][searchable]=true'
  payload += '&columns[11][orderable]=true&columns[11][search][value]=&columns[11][search][regex]=false&columns[12][data]=12&columns[12][name]=&columns[12][searchable]=true&columns[12][orderable]=true&columns[12][search][value]=&columns[12][search][regex]=false&columns[13][data]=13&columns[13][name]=&columns[13][searchable]=true&columns[13][orderable]=true&columns[13][search][value]=&columns[13][search][regex]=false&columns[14][data]=14&columns[14][name]=&columns[14][searchable]=true&columns[14][orderable]=true&columns[14][search][value]=&columns[14][search][regex]=false&columns[15][data]=15&'
  payload += 'columns[15][name]=&columns[15][searchable]=true&columns[15][orderable]=true&columns[15][search][value]=&columns[15][search][regex]=false&columns[16][data]=16&columns[16][name]=&columns[16][searchable]=true&columns[16][orderable]=true&columns[16][search][value]=&columns[16][search][regex]=false&columns[17][data]=17&columns[17][name]=&columns[17][searchable]=true&columns[17][orderable]=true&columns[17][search][value]=&columns[17][search][regex]=false&columns[18][data]=18&columns[18][name]=&columns[18][searchable]=true&columns[18][orderable]=true&columns[18][search][value]=&'
  payload += 'columns[18][search][regex]=false&columns[19][data]=19&columns[19][name]=&columns[19][searchable]=true&columns[19][orderable]=true&columns[19][search][value]=&columns[19][search][regex]=false&columns[20][data]=20&columns[20][name]=&columns[20][searchable]=true&columns[20][orderable]=true&columns[20][search][value]=&columns[20][search][regex]=false&columns[21][data]=21&columns[21][name]=&columns[21][searchable]=true&columns[21][orderable]=true&columns[21][search][value]=&columns[21][search][regex]=false&columns[22][data]=22&columns[22][name]=&columns[22][searchable]=true&'
  payload += 'columns[22][orderable]=true&columns[22][search][value]=&columns[22][search][regex]=false&columns[23][data]=23&columns[23][name]=&columns[23][searchable]=true&columns[23][orderable]=true&columns[23][search][value]=&columns[23][search][regex]=false&columns[24][data]=24&columns[24][name]=&columns[24][searchable]=true&columns[24][orderable]=true&columns[24][search][value]=&columns[24][search][regex]=false&columns[25][data]=25&columns[25][name]=&columns[25][searchable]=true&columns[25][orderable]=true&columns[25][search][value]=&columns[25][search][regex]=false&columns[26][data]=26&'
  payload += 'columns[26][name]=&columns[26][searchable]=true&columns[26][orderable]=true&columns[26][search][value]=&columns[26][search][regex]=false&columns[27][data]=27&columns[27][name]=&columns[27][searchable]=true&columns[27][orderable]=true&columns[27][search][value]=&columns[27][search][regex]=false&columns[28][data]=28&columns[28][name]=&columns[28][searchable]=true&columns[28][orderable]=true&columns[28][search][value]=&columns[28][search][regex]=false&columns[29][data]=29&columns[29][name]=&columns[29][searchable]=true&columns[29][orderable]=true&columns[29][search][value]=&'
  payload += 'columns[29][search][regex]=false&columns[30][data]=30&columns[30][name]=&columns[30][searchable]=true&columns[30][orderable]=true&columns[30][search][value]=&columns[30][search][regex]=false&columns[31][data]=31&columns[31][name]=&columns[31][searchable]=true&columns[31][orderable]=true&columns[31][search][value]=&columns[31][search][regex]=false&columns[32][data]=32&columns[32][name]=&columns[32][searchable]=true&columns[32][orderable]=true&columns[32][search][value]=&columns[32][search][regex]=false&columns[33][data]=33&columns[33][name]=&columns[33][searchable]=true&'
  payload += 'columns[33][orderable]=true&columns[33][search][value]=&columns[33][search][regex]=false&order[0][column]=0&order[0][dir]=asc&'
  payload += 'start=0&length=10&search[value]='+email+'&search[regex]=false&csrfmiddlewaretoken='+csrf+'&assessment_order[]=&assessment_order[]=&assessment_order[]=&assessment_order[]=&assessment_order[]=57bde22b81b41414d6eef5c1&assessment_order[]=57bde22b81b41414d6eef579&assessment_order[]=57bde3b281b41414d6f038a6&assessment_order[]=57bde22b81b41414d6eef4fb&assessment_order[]=57bde22b81b41414d6eef515&assessment_order[]=57bde19181b41414d6ed1f89&assessment_order[]=57bde3a981b41414d6f02e7c&assessment_order[]=&assessment_order[]=&assessment_order[]=57bde23581b41414d6ef1247&'
  payload += 'assessment_order[]=57bde3b981b41414d6f04118&assessment_order[]=57bde23581b41414d6ef1263&assessment_order[]=57bde23581b41414d6ef1285&assessment_order[]=57bde19481b41414d6ed28a7&assessment_order[]=57bde3c281b41414d6f04e12&assessment_order[]=57bde3c181b41414d6f04c7c&assessment_order[]=&assessment_order[]=57bde22881b41414d6eeec89&assessment_order[]=57bde3ab81b41414d6f031d8&assessment_order[]=57bde22481b41414d6eee339&assessment_order[]=57bde22481b41414d6eee319&assessment_order[]=57bde3cc81b41414d6f05d5c&assessment_order[]=57bde22881b41414d6eeec65&assessment_order[]=57bde22881b41414d6eeec4d&assessment_order[]=57bde3c981b41414d6f058ee&assessment_order[]=&assessment_order[]='
  

  var options = {
    "method": "POST",
    "Host": host,
    "payload" : payload,
    "headers": headers,
    "muteHttpExceptions" : true,
    "followRedirects": false
  }

  var page = UrlFetchApp.fetch("https://"+host+"/coursemanage/gradebook-ajax/"+course+"/",options)
// Logger.log(page.getContentText())
//  
//  return
  var temp = JSON.parse(page.getContentText())
// Logger.log(temp)
  
  var Names = ["Module 4, ckpt 1","Module 4, ckpt 2","Module 5, ckpt 1","Module 5, ckpt 2","Module 7","Module 8, ckpt 1","Module 8, ckpt 2","Module 10","Module 11, ckpt 1","Module 11, ckpt 2","Module 12, ckpt 1","Module 12, ckpt 2"]
  var refName = ["_u2_m1_checkpoint1/","_u2_m1_checkpoint2/","_u2_m2_checkpoint1/","_u2_m2_checkpoint2/","_u3_m1_checkpoint1/","_u3_m2_checkpoint1/","_u3_m2_checkpoint2/","asmt_mod_10_introduction_checkpoint/","_u4_m1_prob_chkpt_1/","_u4_m1_prob_chkpt_2/","_u4_m2_checkpoint1/","_u4_m2_checkpoint2/"]
  var indicies = [[7, 8, 10, 11], [16, 18, 19], [24, 26, 27, 29, 30]]
  

  var headers1 = { //headers need to go in options, cookies go in headers not in options --jv
    "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:48.0) Gecko/20100101 Firefox/48.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Cookie": Cookie,
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
  }
   
 var options1 = {
    "method": "GET",
    "Host": host,
    "headers": headers1,
     "muteHttpExceptions" : true,
     "followRedirects": false
  }

var full = ""
var summary = ""
summary += "<div class='rTable'><div class='col-md-4'><strong>Checkpoint</strong></div> <div class='col-md-2'><strong>Att.</strong></div><div class='col-md-4'><strong>Score</strong></div><div class='col-md-4'><strong>Time</strong></div></div>"

   
    var out = []
//Logger.log(temp.data[0])
  for (var kk = 0; kk<indicies.length; kk++){
  for (var jj = 0; jj<indicies[kk].length; jj++){
    var checkpoint = temp.data[0][indicies[kk][jj]]
   var name = Names.shift()
    // assemble the Summary
    
    if(!checkpoint){ // no data found for this checkpoint
      summary += "<div class='student-popover-content row'><div class='col-md-4'>" +  name + "</div><div class='col-md-2 red'>0</div></div>"
      full += '<div class="module">'+name+'</div>'
      full +='No Data Found'
      full += '<br/><p></p>'
      refName.shift()
      
      continue
    }
    
    
    var url = "https://"+host+"/courseware/student_assessment/"+course+"/" + checkpoint["student_assessment_id"]
    var response = UrlFetchApp.fetch(url , options1);
    var data = JSON.parse(response.getContentText())
    var points = data.points


    // assemble the Full History
    var url = "https://"+host + checkpoint["score_popover_url"]
    var response0 = UrlFetchApp.fetch(url , options1);
    //Logger.log(response0.getAllHeaders());
    var clean0 = response0.getContentText().replace(/\s\s+/g, ' ');
    var clean = clean0.replace(/([^\w\s,:<>\/]|&nbsp;|<div([^>]*)>)/ig, '');
    var clean1 = clean.split("</div>")
    var clean2 = ""
    while (clean2.length<5) {
      clean2 = clean1.pop()
    }
    var end = new Date(clean2)
    var start = new Date(clean1.pop())



   // Logger.log(data.submitted + ' --> ' + end)
    var time = (end.getTime() - start.getTime())/(1000*60)
   // Logger.log(time)
    var subDate = (end.getMonth()+1)+"/"+end.getDate()
    var today = new Date()
    var old = ((today.getTime()-end.getTime())>1000*60*60*24*30)
   // Logger.log("Start: "+ start + ":" +clean1+"  End: " + end+ "  time: " + time)
    if (time>99) time = "&#8734;"
    
    summary += "<div class='row'>"
    summary += "<div class='col-md-4'><a href=\"https://"+host+"/courseware/summative-assessment/"+course+"/" + refName.shift()+checkpoint["student_assessment_id"] +'" onclick="openSubpage(event, \'StudentView\');" target=\'main\' >' + name + "</a></div>"
 
    
    if (data.attempt>3) summary += "<div class='col-md-2 red'>" + data.attempt + "</div>"
    else summary += "<div class='col-md-2'>" + data.attempt + "</div>"
    
    if (data.score<80) summary += "<div class='col-md-3 red'>" + data.score +"% (" +points[0] + " of " + points[1] + ")</div>"
    else summary += "<div class='col-md-4'>" + data.score +"% (" +points[0] + " of " + points[1] + ")</div>"
  
    if (time<5) summary += "<div class='col-md-3'><font color=\"red\">" + time + " min, </font>"
    else summary += "<div class='col-md-4'>" + time + " min, "
    
    if (old) summary += '<font color="red">on '+subDate+"</font></div></div>"
    else summary += "on "+subDate+"</div></div>"
    
    
    
    full += '<div class="module">'+name+'</div>'
    full +='<div class="rTable">'
    full += response0.getContentText()
    full += '</div><br/><p></p>'
    
    }
    

    full.replace(/(student-popover-content)/g, '')
    
    out.push(full)
    full = "";
  }
  

//Logger.log(summary)
out.unshift(summary)

  return out
}

  
/**
* Returns the 'Accuracy' dashboard data for a student. Associative array has keys for each checkpoint, which point to an associative array with html of pop-over data, table of this data, and other related information.
*
* @param {string} email The students @wgu.edu email address
* @param {string} start The start date (ex. 2017-04-21)
* @param {string} end The end date (ex. 2017-04-21)
* @return {array} Associative array with all gradebook data
*/
function getDashboardData(email,start,end) {

  email = email || "jane.doe@abc.edu"
  start = start || '2015-01-01'
  end = end || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')

  var info = ACRO_id(email)
  var studentId = info.data[0].id.id
  if(!studentId){return ""}
  
  
  loginAcro_()
  
  var cache = CacheService.getScriptCache()
  var Cookie = cache.get("PS_Cookie")
  var csrf = cache.get("PS_csrftoken")
  
  var headers = {
    "User-Agent": " Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.16 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://"+host+"/cia/mentordashboard/"+course+"/"+studentId,
    "Cookie": Cookie,
    "Connection": "keep-alive"
    
  }
  
var payload = 'csrfmiddlewaretoken='+csrf+'&aggregation_type=Accuracy&student_set=select&timeframe='+start+'%2F'+end+'&students%5B%5D=58261be94c68a92155ffb56f&tableView=true'

  var options = {
    "method": "GET",
    "Host": ""+host+"",
    "headers": headers,
    "muteHttpExceptions" : true,
    "followRedirects": false
  }
 
  
  
  // Get All
  var url = "https://"+host+"/en-us/dashboard/visualization/content/student/"+course+"/"+studentId
  var page = UrlFetchApp.fetch(url,options)
  //Logger.log(page.getResponseCode())
  var html = page.getContentText()
  //Logger.log(page.getAllHeaders())
  var temp = JSON.parse(html).html

  var data = temp.replace(/([\n\s])/g,"")
  data = data.split("ExploratoryDataAnalysis")
  data = data[1].split("AdditionalResources")
  data = data[0].replace(/(<td>|<\/tr>)/g,"")
  data = data.split("<tr>")
  
  var html = "<div class='rTable'><div class='col-db'><strong>Module</strong></div> <div class='col-db'><strong>% Accur</strong></div><div class='col-db'><strong>% Comp.</strong></div><div class='col-db'><strong>% View</strong></div><div class='col-db'><strong>Time</strong></div></div>"
  var table = [["Module","Accuracy", "Completion", "Viewed", "Time Spent (sec)"]];
  var ind = [1, 2, 5, 6, 9, 10, 11] // index
  var mod = [4, 5, 7, 8, 10, 11, 12] // Module Numbers
  
  
  for(var kk = 0;kk<ind.length;kk++){
    var temp1 = data[ind[kk]].split("</td>")
    temp1.pop()
    var module = "Module "+mod.shift()
    temp1[0] = module
    table.push(temp1)

    
    html += "<div class='row'><div class='col-db'>"+module+"</div>"   // Module
    html += "<div class='col-db'>"+makePretty_(temp1[1])+"</div>" // % Read
    html += "<div class='col-db'>"+makePretty_(temp1[2])+"</div>"
    html += "<div class='col-db'>"+makePretty_(temp1[3])+"</div>"
    html += "<div class='col-db'>"+timeDisp_(temp1[4])+"</div></div>"
  }
  
  var out = {
  "html": html,
  "table": table
  }
  
//  Logger.log(out)
  
  return out
}

function makePretty_(decimal){

return Math.round(decimal*1000)/10 + " %"
}

function timeDisp_(sec){

sec = Math.round(sec)
if (sec<60){
  return sec +" sec"
  }
else if (sec<60*60) {
  var min = sec/6;
  min = Math.round(min)/10
  return min +" min"
}
else if (sec<60*60*48) {
  var hr = sec/(60*6);
  hr = Math.round(hr)/10
  return hr +" hrs"
}
else {
  var day = sec/(60*6*24);
  day = Math.round(day)/10
  return day +" days"
}

}
  
  
