function testRun() {
  
  // This looks for houses that are close to two points of interest. 
  
  var address1 = "43 Monument Sq, Charlestown, MA 02129" // First Place if Interest
  var address2 = "109 Savin Hill Ave, Dorchester, MA 02125"  // Second Place of Interest
    
  // First, we look for the two places, and get the Latitute and Longitude
  
  var geocode1 = getGeocode(address1)
  var geocode2 = getGeocode(address2)
  
  if(geocode1.length<2 || geocode2.length<2){
    Logger.log("First place: " + JSON.stringify(geocode1))
    Logger.log("Second place: " + JSON.stringify(geocode2))
    throw("Could not find both places. See Logs")
  }
  
  // Optional: Output to a google sheet
  var docID = "1UJFUvLI7zW8h1at8opgL8bLoUrrbZISTYJY4C9k6ys4"
  
  if(docID){
    var SS = SpreadsheetApp.openById(docID)
    var sheet = SS.getSheetByName("Zillow")
    if(!sheet){
      SS.insertSheet("Zillow")
    }
  }

// Next, we use some simple logic to find a region of interest. An adaptive modification can be made if needed.
  
  var top = (Math.round(Math.min(geocode1[0],geocode2[0])*1000000)+5000)+""
  var bottom = (Math.round(Math.max(geocode1[0],geocode2[0])*1000000)-5000)+""
  var left = (Math.round(Math.min(geocode1[1],geocode2[1])*1000000)-5000)+""
  var right = (Math.round(Math.max(geocode1[1],geocode2[1])*1000000)+5000)+""

  var zillowData = getZillow(left, right, top, bottom)

  for (var ii = 1; ii<zillowData.length; ii++){
    var property = zillowData[ii]
    
    var price = Number(property[3])
    var beds = Number(property[5])
    var baths = Number(property[6])
    var sqft = Number(property[7])
    var geocode = [Number(property[0]), Number(property[1])]
    
    // Google maps has a low quota for getting directions, so we filter out properties here
    if (price>3000000){continue}
    if (sqft < 500){continue}
    if (beds<2){continue}
  
    var time1 = getDist(geocode, geocode1)
    var time2 = getDist(geocode, geocode2)
  
    zillowData[ii][9] = time1
    zillowData[ii][10] = time2
  }
  
  
  if(sheet){
    sheet.clear()
    sheet.getRange(1,1,zillowData.length,zillowData[0].length).setValues(zillowData)
  }
    
}

function getZillow(left, right, top, bottom){
  
  var cache = CacheService.getScriptCache()
  var out = cache.get(left+right+top+bottom)
  
  if(out){return JSON.parse(out)}
  
  var url = "https://www.zillow.com/search/GetResults.htm?spt=homes&status=100000&lt=111101&ht=111111&rect="+left+","+top+","+right+","+bottom+"&p=1&sort=globalrelevanceex&search=map&rt=7&listright=true&isMapSearch=1&zoom=12"
  
  var headers = {
    "User-Agent": "Mozilla/5.0",
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "*/*",
    "Referer": "https://www.zillow.com/homes/for_sale/33801_rb/?fromHomePage=true&shouldFireSellPageImplicitClaimGA=false&fromHomePageTab=buy"
  }
  
  var parameters = {
    "Host": "www.zillow.com",
    "Method": "GET",
    "Headers": headers
  }
  var raw = UrlFetchApp.fetch(url).getContentText()
  var properties = JSON.parse(raw).map.properties
  
  var out =[["Address", "Latitude", "Longitude", "Price", "ZEstimate", "Beds", "Baths", "SQFT", "Zillow Link", "Minutes to Dest. 1", "Minutes to Dest. 2"]]
  
  for(var ii = 0; ii<properties.length; ii++){
  //for(var ii = 0; ii<10; ii++){  // Trial run with only 10 properties.
    
    var property = properties[ii]
    var zpid = property[0]
    
    var lat = Number(property[1]+"")/1000000
    var long = Number(property[2]+"")/1000000
    
    var details = property.pop()
    var beds = Number(details[1])
    var baths = Number(details[2])
    var sqft = Number(details[3])
    var imageURL = details[5]
    
    var propDetails = getProp(zpid)
    if(!(propDetails)){continue}
    var Address = propDetails[0]
    var price = propDetails[1]
    var zEst = propDetails[2]
    
    var row = [Address, lat, long, price, zEst, beds, baths, sqft, '=hyperlink("https://www.zillow.com/homedetails/'+zpid+'_zpid/",IMAGE("'+imageURL+'",4,50,50))',"",""]
    out.push(row)
  }
  cache.put(left+right+top+bottom,JSON.stringify(out))
  return out
}


function getProp(zpid) {
  
  var httpheaders = { "Referer": "https://www.zillow.com/homes/for_sale/house,mobile_type/"+zpid+"_zpid/" };
  
  var parameters = {method: "GET", headers: httpheaders, muteHttpExceptions: true};
  var url = "https://www.zillow.com/jsonp/Hdp.htm?zpid="+zpid+"&fad=false&hc=false&lhdp=true&callback=YUI.Env.JSONP.handleHomeDetailPage56304954&view=null&ebas=true"
  
  var raw = UrlFetchApp.fetch(url,parameters) +""
  
  raw = raw.split('{  "zpid"')
  raw.shift()
  raw = '{  "zpid"' + raw.join('{  "zpid"')
  raw = raw.slice(0, -4).trim()
  
  var raw1 = raw.split(', "bodyScript" : function (Y) { ')
  var raw2 = raw1.shift()
  
  var propDetails = JSON.parse(raw2+"}")
  
  var Address = propDetails.title.split("|").shift().trim()
  Address = Address.replace("- Zillow").trim()
  
  var price0 = raw.split('price\\":\\"')
  if(price0.length<2){return ""}
  var price = Number(price0[1].split('\\",\\').shift().replace(/\D/g,""))
  
  var zest0 = raw.split('zestimate\\":\\"')
  if(zest0.length>1){
    var zEst = Number(zest0[1].split('\\",\\').shift().replace(/\D/g,""))
    } else {
      var zEst = price
      }
  var row = [Address, price, zEst]

  return row
  
}

function getGeocode(address){
  
  var address = address ||  "Times Square, NY, NY"
  var response = Maps.newGeocoder().geocode(address);
  if(response.results.length>0){
    var result = response.results[0];
    var out = [result.geometry.location.lat, result.geometry.location.lng]
    } else {
      var out = []
      }
  return out
}