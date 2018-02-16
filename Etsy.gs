var apiKey = "*****"  // update!
var sharedSecret = "*****" // update!
var appName = "*****" // update!
var baseURL = "https://openapi.etsy.com/v2"
var shop_id = "*****" // update!
var username = "*****" // update!

// requires library:   Mb2Vpd5nfD3Pz-_a-39Q4VfxhMjh3Sh48


/// Step 1:  Request Token, and follow URL to Etsy Site

function etsyOAuth()  {
  var service = getEtsyService();
  if (service.hasAccess()) {
    return service
  } else {
    var authorizationUrl = service.authorize();
    Logger.log('Please visit the following URL and then re-run the script: ' + authorizationUrl);
  }

}

function forceNewOAuth(){
  var service = getEtsyService()
  var authorizationUrl = service.authorize();
  Logger.log('Please visit the following URL and then re-run the script: ' + authorizationUrl);
}


// Step2:  When authorized on Etsy site, take Verification Code and enter it here and run this code.

function authCallback() {
  var service = PropertiesService.getScriptProperties()
  var etsy = service.getProperty("oauth1.etsy")
  var parameter = {
    "oauth_verifier": "89ad51cc",
    "oauth_token":JSON.parse(etsy).public
  }
  var request = {"parameter": parameter}
  var service = getEtsyService();
  var isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    Logger.log('Success! You can close this page.');
  } else {
    Logger.log('Denied. You can close this page');
  }
}


// helper functions


function getEtsyService() {
  var service = OAuth1.createService('etsy');
  service.setAccessTokenUrl("https://openapi.etsy.com/v2/oauth/access_token")
  service.setRequestTokenUrl('https://openapi.etsy.com/v2/oauth/request_token?scope=email_r%20listings_w%20listings_r%20feedback_r%20billing_r%20transactions_r&oauth_callback=')
  service.setAuthorizationUrl('https://www.etsy.com/oauth/signin?')
  service.setConsumerKey(apiKey);
  service.setConsumerSecret(sharedSecret);
  service.setCallbackFunction('authCallback');
  service.setPropertyStore(PropertiesService.getScriptProperties());
  return service;
}


function EtsyOrder(order) {
  
  if(!order) order ='0123456789'  // for testing
  
  var cache = CacheService.getScriptCache()
  var orderData = cache.get(order)
  
  
  if(orderData) {return JSON.parse(orderData)}
  
  
  var serviceEtsy = etsyOAuth()
  Logger.log(baseURL + "/receipts/"+order)
  var response = serviceEtsy.fetch(baseURL + "/receipts/"+order);
  var orderData = JSON.parse(response.getContentText()).results[0];
  
  
  var response = serviceEtsy.fetch(baseURL + "/receipts/"+order+"/transactions");
  orderData["transactions"] = JSON.parse(response.getContentText()).results;
  
  
  var response = serviceEtsy.fetch(baseURL + "/shops/"+shop_id+"/receipts/"+order+"/payments")
  orderData["fees"] = JSON.parse(response.getContentText()).results;
  
  var date = orderData["creation_tsz"]
  var url = baseURL + "/users/"+username+"/charges?min_created="+(date-60)+"&max_created="+(date+60)  // looks for bill items within 60 seconds of purchase. 
  var response = serviceEtsy.fetch(url)
  
  orderData["billed"] = JSON.parse(response.getContentText()).results
  
  cache.put(order, JSON.stringify(orderData), 3600)
  
  return orderData
  
}
